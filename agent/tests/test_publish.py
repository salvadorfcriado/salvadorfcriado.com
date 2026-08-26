"""Publish stage tests.

Entirely offline. `subprocess.run`, `urllib.request.urlopen` and `time.sleep` are
monkeypatched, and `config.CONTENT_DIR` and `config.STATE_DIR` point at `tmp_path`,
so no test creates a branch, opens a pull request, writes into the real content
directory or reaches the network. A test that did any of those would be a test
nobody would run twice.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path
from urllib import error as urlerror

import pytest

from agent import config, publish
from agent.state import RunState

SLUG = "ranking-not-retrieval"
PR_URL = "https://github.com/salvadorfcriado/site/pull/7"
GENERATED_TITLE = "Ranking, not retrieval"
EDITED_TITLE = "Ranking, not retrieval (edited by hand)"

HASHTAGS = ["#RAG", "#VectorSearch", "#InformationRetrieval"]


def _article(title: str = GENERATED_TITLE) -> str:
    """A hand-written post's frontmatter shape, and nothing else."""
    return (
        "---\n"
        f'title: "{title}"\n'
        "date: 2026-08-27\n"
        "tags: [rag, evaluation]\n"
        "readingTime: 9\n"
        'excerpt: "The document was in the index and the answer was still wrong. '
        'How to tell a retrieval failure from a ranking failure."\n'
        "---\n"
        "\n"
        "The document was in the index. The answer was still wrong.\n"
    )


def _post_body(lang: str) -> str:
    """A body inside the configured band, with a digit and no Markdown."""
    limits = config.thresholds_for(lang)
    if lang == "en":
        hook = "Rank 9. That is where the right chunk was sitting."
        sentence = "The reranker read the query and the chunk together. "
    else:
        hook = "Puesto 9. Ahi estaba el fragmento correcto."
        sentence = "El reranker leyo la consulta y el fragmento juntos. "
    filler = sentence * limits["POST_BODY_MIN_CHARS"]
    return (hook + "\n\n" + filler)[: limits["POST_BODY_MIN_CHARS"]].rstrip()


def _report(kind: str, lang: str | None, ok: bool, failures: list[dict] | None = None) -> dict:
    return {
        "kind": kind,
        "lang": lang,
        "path": f"{SLUG}.md",
        "ok": ok,
        "gates_run": len(config.ARTICLE_REQUIRED_FRONTMATTER),
        "failures": failures or [],
        "results": [],
    }


@pytest.fixture
def sandbox(tmp_path, monkeypatch):
    """Content and state redirected into the temporary directory."""
    monkeypatch.setattr(config, "CONTENT_DIR", tmp_path / "content")
    monkeypatch.setattr(config, "STATE_DIR", tmp_path / "state")
    return tmp_path


def _state(
    *,
    article: str | None = None,
    es_ok: bool = True,
    approvals: tuple[str, ...] = ("outline", "article", "package"),
) -> RunState:
    state = RunState(slug=SLUG, topic="Ranking versus retrieval")
    state.artifacts["revise"] = article if article is not None else _article()
    state.artifacts["post_en"] = {"body": _post_body("en"), "hashtags": list(HASHTAGS)}
    state.artifacts["post_es"] = {"body": _post_body("es"), "hashtags": list(HASHTAGS)}
    state.gate_reports["article"] = _report("article", None, True)
    state.gate_reports["post_en"] = _report("post", "en", True)
    state.gate_reports["post_es"] = _report(
        "post",
        "es",
        es_ok,
        None
        if es_ok
        else [{"gate": "post.body_chars", "message": "body is short", "measured": None}],
    )
    for point in approvals:
        state.record_approval(point, "approve")
    state.save()
    return state


class FakeCommands:
    """Records every git and gh invocation and answers plausibly."""

    def __init__(self) -> None:
        self.commands: list[list[str]] = []

    def __call__(self, command, **kwargs):
        self.commands.append(list(command))
        stdout = ""
        if command[:3] == ["git", "status", "--porcelain"]:
            stdout = f"A  {command[-1]}\n"
        elif command[:2] == ["gh", "pr"]:
            stdout = f"{PR_URL}\n"
        return subprocess.CompletedProcess(list(command), 0, stdout, "")

    def find(self, *prefix: str) -> list[str] | None:
        for command in self.commands:
            if command[: len(prefix)] == list(prefix):
                return command
        return None


class FakeResponse:
    def __init__(self, status: int) -> None:
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def getcode(self) -> int:
        return self.status


@pytest.fixture
def commands(monkeypatch):
    fake = FakeCommands()
    monkeypatch.setattr(publish.subprocess, "run", fake)
    return fake


@pytest.fixture
def no_waiting(monkeypatch):
    monkeypatch.setattr(publish.time, "sleep", lambda seconds: None)


def _serving(monkeypatch, status: int = config.DEPLOY_PROBE_OK_STATUS) -> list[str]:
    probed: list[str] = []

    def opener(request, timeout=None):
        probed.append(request.full_url)
        return FakeResponse(status)

    monkeypatch.setattr(publish.urlrequest, "urlopen", opener)
    return probed


def _not_found(monkeypatch) -> list[str]:
    probed: list[str] = []

    def opener(request, timeout=None):
        probed.append(request.full_url)
        raise urlerror.HTTPError(request.full_url, 404, "Not Found", {}, None)

    monkeypatch.setattr(publish.urlrequest, "urlopen", opener)
    return probed


# ── Preconditions ───────────────────────────────────────────────────────────


def test_a_failing_spanish_report_aborts_and_creates_no_branch(sandbox, commands):
    state = _state(es_ok=False)

    with pytest.raises(publish.PublishError) as excinfo:
        publish.publish(state)

    message = str(excinfo.value)
    assert "post_es" in message
    assert "post.body_chars" in message
    assert commands.commands == []
    assert not publish.article_path(SLUG).exists()


def test_a_missing_package_approval_aborts_and_creates_no_branch(sandbox, commands):
    state = _state(approvals=("outline", "article"))

    with pytest.raises(publish.PublishError) as excinfo:
        publish.publish(state)

    assert "package" in str(excinfo.value)
    assert commands.commands == []
    assert not publish.article_path(SLUG).exists()


def test_a_missing_gate_report_aborts_naming_the_artefact(sandbox, commands):
    state = _state()
    del state.gate_reports["post_en"]
    state.save()

    with pytest.raises(publish.PublishError) as excinfo:
        publish.publish(state)

    assert "post_en" in str(excinfo.value)
    assert commands.commands == []


# ── Branch and pull request ─────────────────────────────────────────────────


def test_the_happy_path_writes_the_article_and_opens_the_pull_request(
    sandbox, commands, no_waiting, monkeypatch
):
    _serving(monkeypatch)
    state = _state()

    result = publish.publish(state)

    path = publish.article_path(SLUG)
    assert path.read_text(encoding="utf-8") == _article()
    assert result.article_status == "written"

    branch = f"{config.PUBLISH_BRANCH_PREFIX}{SLUG}"
    assert commands.find("git", "checkout") == [
        "git", "checkout", "-b", branch, config.PUBLISH_BASE_BRANCH
    ]
    assert commands.find("git", "push") == [
        "git", "push", "--set-upstream", "origin", branch
    ]
    assert result.branch == branch
    assert result.pull_request == PR_URL

    created = commands.find("gh", "pr", "create")
    assert created is not None
    assert created[created.index("--base") + 1] == config.PUBLISH_BASE_BRANCH
    assert created[created.index("--head") + 1] == branch
    assert created[created.index("--title") + 1] == GENERATED_TITLE

    body = created[created.index("--body") + 1]
    assert _post_body("en").splitlines()[0] in body
    assert _post_body("es").splitlines()[0] in body
    assert " ".join(HASHTAGS) in body
    for key in publish.PUBLISHABLE_ARTEFACTS:
        assert key in body
    assert '"ok": true' in body


def test_the_article_frontmatter_carries_nothing_generator_specific(
    sandbox, commands, no_waiting, monkeypatch
):
    _serving(monkeypatch)
    state = _state()
    publish.publish(state)

    frontmatter = publish.article_path(SLUG).read_text(encoding="utf-8").split("---")[1]
    for key in frontmatter.splitlines():
        name = key.split(":")[0].strip()
        if name:
            assert name in config.ARTICLE_ALLOWED_FRONTMATTER


def test_an_unknown_frontmatter_key_aborts_before_the_branch(sandbox, commands):
    generated = _article().replace("readingTime: 9\n", "readingTime: 9\ngeneratedBy: agent\n")
    state = _state(article=generated)

    with pytest.raises(publish.PublishError) as excinfo:
        publish.publish(state)

    assert "generatedBy" in str(excinfo.value)
    assert commands.find("git", "checkout") is None


def test_an_article_edited_by_hand_is_not_overwritten_on_resume(
    sandbox, commands, no_waiting, monkeypatch
):
    _serving(monkeypatch)
    edited = _article(EDITED_TITLE) + "\nA paragraph the operator added before merging.\n"
    path = publish.article_path(SLUG)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(edited, encoding="utf-8")

    state = _state()
    result = publish.publish(state)

    assert path.read_text(encoding="utf-8") == edited
    assert result.article_status == "preserved"
    assert any("left as it is" in m for m in result.messages)
    # The pull request is titled from the file on disk, not from the state.
    created = commands.find("gh", "pr", "create")
    assert created[created.index("--title") + 1] == EDITED_TITLE


# ── Probe and handoff ───────────────────────────────────────────────────────


def test_a_failing_probe_withholds_the_handoff_and_reports_what_it_got(
    sandbox, commands, no_waiting, monkeypatch
):
    probed = _not_found(monkeypatch)
    state = _state()

    result = publish.publish(state)

    expected = publish.article_url(SLUG)
    assert result.handoff is None
    assert result.handed_off is False
    assert probed == [expected] * config.DEPLOY_PROBE_ATTEMPTS
    assert result.probe.url == expected
    assert result.probe.ok is False
    assert "404" in result.probe.detail
    assert "Not Found" in result.probe.detail
    assert any(expected in m and "404" in m for m in result.messages)

    reloaded = RunState.load(SLUG)
    assert reloaded.publish["handoff"] is None
    assert reloaded.publish["probe"]["url"] == expected
    assert reloaded.publish["pull_request"] == PR_URL


def test_the_url_probed_ends_in_a_slash(sandbox, commands, no_waiting, monkeypatch):
    # trailingSlash: 'always' — the slashless form is a redirect, and LinkedIn's
    # fetcher caches whatever it is handed first.
    probed = _serving(monkeypatch)
    publish.publish(_state())
    assert probed[0].endswith(f"/blog/{SLUG}/")


def test_a_successful_probe_emits_both_posts_and_records_the_handoff(
    sandbox, commands, no_waiting, monkeypatch
):
    _serving(monkeypatch)
    state = _state()

    result = publish.publish(state)

    url = publish.article_url(SLUG)
    assert result.handed_off is True
    assert result.probe.ok is True
    assert set(result.handoff["posts"]) == {"en", "es"}
    assert result.handoff["url"] == url

    for lang in ("en", "es"):
        post = result.handoff["posts"][lang]
        text = post["text"]
        limits = config.thresholds_for(lang)
        assert text.startswith(_post_body(lang).splitlines()[0])
        assert url in text
        assert post["hashtags"] == HASHTAGS
        assert text.rstrip().endswith(" ".join(HASHTAGS))
        assert limits["POST_BODY_MIN_CHARS"] <= len(text) <= limits["POST_BODY_MAX_CHARS"]
        # Copy-ready: pasted unchanged, so no Markdown and no markers survive.
        for pattern, name in publish._MARKDOWN_SYNTAX.items():
            assert not re.search(pattern, text), name
        for pattern in config.PLACEHOLDER_MARKERS:
            assert not re.search(pattern, text, re.IGNORECASE)

    reloaded = RunState.load(SLUG)
    assert reloaded.publish["handoff"]["posts"]["en"]["text"] == (
        result.handoff["posts"]["en"]["text"]
    )
    assert reloaded.publish["url"] == url


def test_hashtags_written_into_the_body_are_moved_to_their_configured_position(
    sandbox, commands, no_waiting, monkeypatch
):
    assert config.HASHTAG_POSITION == "end"
    _serving(monkeypatch)
    state = _state()
    state.artifacts["post_en"] = _post_body("en") + "\n\n" + " ".join(HASHTAGS)
    state.save()

    handoff = publish.publish(state).handoff
    text = handoff["posts"]["en"]["text"]

    assert text.rstrip().endswith(" ".join(HASHTAGS))
    assert len(publish._HASHTAG.findall(text)) == len(HASHTAGS)


def test_a_resumed_run_reuses_the_open_pull_request(
    sandbox, commands, no_waiting, monkeypatch
):
    _not_found(monkeypatch)
    state = _state()
    publish.publish(state)
    opened = len(commands.commands)

    _serving(monkeypatch)
    result = publish.publish(RunState.load(SLUG))

    assert len(commands.commands) == opened, "a resumed run must not open a second branch"
    assert result.pull_request == PR_URL
    assert result.handed_off is True


# ── The rule that is a fact ─────────────────────────────────────────────────


def test_no_code_path_posts_to_linkedin():
    """Posting is a manual act by the operator, and this is the proof.

    The needles are assembled from fragments so that this file does not itself
    become the match that the search is looking for.
    """
    needles = (
        "api." + "linkedin.com",
        "ugc" + "Posts",
        "w_member" + "_social",
        "linkedin.com" + "/v2",
        "restli" + "-protocol-version",
    )
    skipped = {"__pycache__", "state", ".venv", ".git"}

    hits: list[str] = []
    for path in sorted(Path(config.AGENT_DIR).rglob("*")):
        if not path.is_file() or set(path.parts) & skipped:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        hits += [f"{path}: {n}" for n in needles if n in text]

    assert hits == [], f"LinkedIn API surface found in the agent tree: {hits}"
