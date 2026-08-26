"""The publish stage: article file, branch, pull request, probe, handoff.

Four things happen here and their order is the whole point.

First, the preconditions are checked immediately before the branch is created,
not at the top of the stage. A gate report that was passing when the operator
approved the package may have been superseded by a failing one; the check is
worth nothing if it runs before the last thing that could invalidate it.

Then the article is written into `src/content/blog/` as ordinary site content. No
provenance key, no marker, no parallel store — a generated post and a
hand-written one are indistinguishable by frontmatter shape, which is what keeps
hand-authoring a first-class path rather than a legacy one.

The package reaches the default branch through a pull request. Never a push.

Last, the LinkedIn text is withheld until the article's own URL answers. LinkedIn
   caches a URL's preview on first fetch and a preview cached against a 404
   cannot be cleanly corrected, so this is the one ordering constraint in the
   pipeline that is never relaxed for convenience.

Nothing in this module, or anywhere else in `agent/`, posts to LinkedIn.
`tests/test_publish.py` greps the tree for the API surface and fails if it
appears. Posting is a manual act by the operator.
"""

from __future__ import annotations

import json
import re
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest

import yaml

from . import config
from .state import RunState

__all__ = [
    "PublishError",
    "ProbeResult",
    "PublishResult",
    "publish",
    "check_preconditions",
    "emit_article",
    "article_path",
    "article_url",
    "open_pull_request",
    "probe_deployed_url",
    "build_handoff",
]

# What must have a passing gate report before anything is created.
PUBLISHABLE_ARTEFACTS = ("article", "post_en", "post_es")

# Where the article Markdown may be found in the state's artifacts, best first.
# `revise` supersedes `write`; `article` is the explicit key if a stage sets one.
ARTICLE_ARTIFACT_KEYS = ("article", "revise", "write")

POST_ARTEFACTS = {"post_en": "en", "post_es": "es"}

_FRONTMATTER = re.compile(r"\A---\r?\n(?P<yaml>.*?)\r?\n---\r?\n", re.DOTALL)
_HASHTAG_LINE = re.compile(r"(?m)^[ \t]*(#\w[\w-]*(?:[ \t]+#\w[\w-]*)*)[ \t]*$")
_HASHTAG = re.compile(r"#\w[\w-]*")

EM_DASH = "\N{EM DASH}"

# Markdown the handoff text may not carry. LinkedIn renders none of it: it is
# pasted verbatim, so a stray asterisk ships as a stray asterisk.
_MARKDOWN_SYNTAX = {
    r"\*\*[^*]+\*\*": "bold (**)",
    r"(?m)^#+ ": "heading (#)",
    r"(?m)^[ \t]*[-*+] ": "bullet list",
    r"\[[^\]]+\]\([^)]+\)": "inline link",
    r"`[^`]+`": "code span",
    r"(?m)^[ \t]*> ": "blockquote",
}


class PublishError(RuntimeError):
    """The publish stage refused to proceed, or a command it ran failed."""


@dataclass(frozen=True)
class ProbeResult:
    """What the deployed URL answered, and how many times it was asked."""

    url: str
    ok: bool
    status: int | None
    detail: str
    attempts: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "url": self.url,
            "ok": self.ok,
            "status": self.status,
            "detail": self.detail,
            "attempts": self.attempts,
        }

    def report(self) -> str:
        return f"probed {self.url} — {self.detail}"


@dataclass
class PublishResult:
    """Everything the operator needs to know about one publish attempt."""

    slug: str
    article_path: Path
    # "written" | "unchanged" | "preserved" — see `emit_article`.
    article_status: str
    branch: str | None = None
    pull_request: str | None = None
    probe: ProbeResult | None = None
    # None while the handoff is withheld. The probe is why.
    handoff: dict[str, Any] | None = None
    messages: list[str] = field(default_factory=list)

    @property
    def handed_off(self) -> bool:
        return self.handoff is not None

    def to_dict(self) -> dict[str, Any]:
        return {
            "slug": self.slug,
            "article_path": str(self.article_path),
            "article_status": self.article_status,
            "branch": self.branch,
            "pull_request": self.pull_request,
            "probe": self.probe.to_dict() if self.probe else None,
            "handoff": self.handoff,
            "messages": list(self.messages),
        }


# ── Paths and URLs ──────────────────────────────────────────────────────────


def article_path(slug: str) -> Path:
    return config.CONTENT_DIR / f"{slug}.md"


def article_url(slug: str) -> str:
    # Trailing slash: astro.config.mjs sets `trailingSlash: 'always'`, and the
    # redirect from the slashless form is a hop LinkedIn's fetcher need not take.
    return f"{config.SITE_URL}/blog/{slug}/"


def _repo_relative(path: Path) -> str:
    try:
        return str(path.relative_to(config.REPO_ROOT))
    except ValueError:
        return str(path)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# ── Preconditions ───────────────────────────────────────────────────────────


def check_preconditions(state: RunState) -> None:
    """Refuse to create anything unless every gate passes and every approval is in.

    Runs immediately before the branch. Names the offending report or approval;
    a message that says only "preconditions failed" sends the operator back to
    the state file to find out what this function already knew.
    """
    problems: list[str] = []

    for key in PUBLISHABLE_ARTEFACTS:
        report = state.gate_reports.get(key)
        if not report:
            problems.append(f"no gate report recorded for {key!r}")
            continue
        if not state.gates_passing(key):
            failures = report.get("failures") or []
            named = ", ".join(str(f.get("gate", "?")) for f in failures) or "unnamed gate"
            problems.append(f"gate report for {key!r} is failing: {named}")

    for point in config.APPROVAL_POINTS.values():
        record = state.approval_for(point)
        if record is None:
            problems.append(f"approval {point!r} is not recorded")
        elif not state.is_approved(point):
            problems.append(f"approval {point!r} is recorded as {record.get('decision')!r}")

    if problems:
        raise PublishError(
            "publish aborted before any branch was created:\n"
            + "\n".join(f"  - {p}" for p in problems)
        )


# ── The article file ────────────────────────────────────────────────────────


def _article_markdown(state: RunState) -> str:
    for key in ARTICLE_ARTIFACT_KEYS:
        value = state.artifacts.get(key)
        if isinstance(value, str) and value.strip():
            return value
        if isinstance(value, dict):
            text = value.get("markdown") or value.get("text")
            if isinstance(text, str) and text.strip():
                return text
    raise PublishError(
        f"no article Markdown in the state file; looked at {list(ARTICLE_ARTIFACT_KEYS)}"
    )


def _validate_frontmatter(text: str) -> dict[str, Any]:
    """The content schema is `.strict()`, so an unknown key is a build failure.

    Checked here as well as in the gate because this is the last point at which
    a generator-specific key could be introduced by accident, and the whole
    premise is that the emitted file is indistinguishable from a hand-written one.
    """
    match = _FRONTMATTER.match(text)
    if not match:
        raise PublishError("the article has no YAML frontmatter block")
    try:
        data = yaml.safe_load(match.group("yaml")) or {}
    except yaml.YAMLError as exc:
        raise PublishError(f"the article's frontmatter is not valid YAML: {exc}") from exc
    if not isinstance(data, dict):
        raise PublishError("the article's frontmatter is not a mapping")

    keys = set(data)
    missing = [k for k in config.ARTICLE_REQUIRED_FRONTMATTER if k not in keys]
    if missing:
        raise PublishError(f"the article's frontmatter is missing {', '.join(missing)}")
    unknown = sorted(keys - set(config.ARTICLE_ALLOWED_FRONTMATTER))
    if unknown:
        raise PublishError(
            f"the article's frontmatter carries {', '.join(unknown)}, which the content "
            "schema rejects; nothing generator-specific belongs in src/content/blog/"
        )
    return data


def emit_article(state: RunState) -> tuple[Path, str]:
    """Write the article as ordinary site content. Returns the path and what happened.

    "preserved" means the file on disk differs from what the state holds. That
    is the operator having edited the generated article before merging, and a
    resumed run that overwrote it would destroy work the build has already
    validated. The difference is reported, never resolved.
    """
    text = _article_markdown(state)
    _validate_frontmatter(text)
    if not text.endswith("\n"):
        text += "\n"

    path = article_path(state.slug)
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        existing = path.read_text(encoding="utf-8")
        if existing == text:
            return path, "unchanged"
        state.note("article_preserved", path=_repo_relative(path))
        return path, "preserved"

    path.write_text(text, encoding="utf-8")
    state.note("article_written", path=_repo_relative(path))
    return path, "written"


# ── Posts and hashtags ──────────────────────────────────────────────────────


def _post_parts(state: RunState, key: str) -> tuple[str, list[str]]:
    """Body and hashtags, however the post stage chose to record them."""
    artifact = state.artifacts.get(key)
    if isinstance(artifact, str):
        body, tags = artifact, []
    elif isinstance(artifact, dict):
        raw = artifact.get("body") or artifact.get("text") or ""
        if not isinstance(raw, str):
            raise PublishError(f"artifact {key!r} has no post body")
        body = raw
        tags = list(artifact.get("hashtags") or [])
    else:
        raise PublishError(f"no post recorded for {key!r}")

    if not body.strip():
        raise PublishError(f"artifact {key!r} has an empty post body")

    # Hashtags written into the body are lifted out so that their position is
    # this module's decision and not an accident of how the stage formatted them.
    found = [m for line in _HASHTAG_LINE.findall(body) for m in _HASHTAG.findall(line)]
    body = _HASHTAG_LINE.sub("", body)
    if not tags:
        tags = found

    normalised: list[str] = []
    for tag in tags:
        tag = str(tag).strip()
        if not tag:
            continue
        tag = tag if tag.startswith("#") else f"#{tag}"
        if tag not in normalised:
            normalised.append(tag)
    return body.strip(), normalised


def _compose_post(body: str, tags: list[str], url: str) -> str:
    """Final text: hook untouched at the top, URL embedded, hashtags in position."""
    if config.HASHTAG_POSITION != "end":
        # Anywhere but the end would sit above the hook, and the hook gate reads
        # the first line. Rather than quietly break it, say so.
        raise PublishError(
            f"HASHTAG_POSITION is {config.HASHTAG_POSITION!r}; this module only "
            "composes posts with the hashtags at the end"
        )
    # A URL the stage already embedded is removed before it is re-added, so the
    # link appears exactly once wherever the post text came from.
    body = body.replace(url, "").strip()
    blocks = [body, url]
    if tags:
        blocks.append(" ".join(tags))
    return "\n\n".join(blocks)


def _assert_copy_ready(text: str, lang: str, url: str) -> None:
    """Assert by construction that what is handed over would pass the post gates.

    The composition adds a URL and moves hashtags; both change what the gates
    measure. Checking here means a post that grew out of its band is reported
    now, with the numbers, rather than discovered in LinkedIn's character count.
    """
    limits = config.thresholds_for(lang)
    problems: list[str] = []

    length = len(text)
    if length < limits["POST_BODY_MIN_CHARS"]:
        problems.append(f"body is {length} characters, under {limits['POST_BODY_MIN_CHARS']}")
    if length > limits["POST_BODY_MAX_CHARS"]:
        problems.append(f"body is {length} characters, over {limits['POST_BODY_MAX_CHARS']}")

    hook = text.splitlines()[0] if text.splitlines() else ""
    if len(hook) > limits["POST_HOOK_MAX_CHARS"]:
        problems.append(f"hook is {len(hook)} characters, over {limits['POST_HOOK_MAX_CHARS']}")
    if len(hook.split()) > limits["POST_HOOK_MAX_WORDS"]:
        problems.append(f"hook is {len(hook.split())} words, over {limits['POST_HOOK_MAX_WORDS']}")

    tags = _HASHTAG.findall(text)
    if len(tags) > limits["POST_MAX_HASHTAGS"]:
        problems.append(f"{len(tags)} hashtags, over {limits['POST_MAX_HASHTAGS']}")

    # The two counts composition could plausibly disturb. The blacklists, the
    # emoji ceiling and the opener rules are the antislop gate's to enforce;
    # restating them here would be a second copy of a moving target.
    digits = sum(c.isdigit() for c in text)
    if digits < limits["POST_MIN_DIGITS"]:
        problems.append(f"{digits} digits, under {limits['POST_MIN_DIGITS']}")
    em_dashes = text.count(EM_DASH)
    if em_dashes > limits["POST_MAX_EM_DASHES"]:
        problems.append(f"{em_dashes} em dashes, over {limits['POST_MAX_EM_DASHES']}")

    for pattern in config.PLACEHOLDER_MARKERS:
        if re.search(pattern, text, re.IGNORECASE):
            problems.append(f"placeholder marker matching {pattern!r}")

    for pattern, name in _MARKDOWN_SYNTAX.items():
        if re.search(pattern, text):
            problems.append(f"Markdown syntax: {name}")

    if url not in text:
        problems.append("the article URL is not embedded")

    if problems:
        raise PublishError(
            f"the {lang} handoff text is not copy-ready:\n"
            + "\n".join(f"  - {p}" for p in problems)
        )


def build_handoff(state: RunState, url: str) -> dict[str, Any]:
    """Both posts as final text, plus the hashtags and the URL, ready to paste."""
    posts: dict[str, Any] = {}
    for key, lang in POST_ARTEFACTS.items():
        body, tags = _post_parts(state, key)
        text = _compose_post(body, tags, url)
        _assert_copy_ready(text, lang, url)
        posts[lang] = {"text": text, "hashtags": tags, "characters": len(text)}
    return {"url": url, "posts": posts, "at": _now()}


# ── Git and GitHub ──────────────────────────────────────────────────────────


def _run(command: list[str]) -> subprocess.CompletedProcess[str]:
    """Every git and gh invocation, checked, with stderr carried into the error.

    A failed `git push` whose message is discarded costs more time than every
    other failure mode in this module combined.
    """
    try:
        result = subprocess.run(
            command,
            cwd=str(config.REPO_ROOT),
            capture_output=True,
            text=True,
        )
    except OSError as exc:
        raise PublishError(f"could not run {' '.join(command)}: {exc}") from exc
    if result.returncode:
        raise PublishError(
            f"command failed: {' '.join(command)}\n"
            f"  exit: {result.returncode}\n"
            f"  stderr: {(result.stderr or '').strip()}\n"
            f"  stdout: {(result.stdout or '').strip()}"
        )
    return result


def _branch_name(slug: str) -> str:
    branch = f"{config.PUBLISH_BRANCH_PREFIX}{slug}"
    if branch == config.PUBLISH_BASE_BRANCH:
        raise PublishError(
            f"the computed branch is {branch!r}, which is the base branch; "
            "the pipeline never writes to the default branch"
        )
    return branch


def _pull_request_body(state: RunState, path: Path, handoff_preview: dict[str, Any]) -> str:
    """The whole social package in one place, because it is reviewed in one place."""
    lines = [
        f"Generated by `agent/` from the topic: {state.topic}",
        "",
        f"Article: `{_repo_relative(path)}`",
        f"URL once deployed: {article_url(state.slug)}",
        "",
        "## LinkedIn post — English",
        "",
        "```text",
        handoff_preview["posts"]["en"]["text"],
        "```",
        "",
        "## LinkedIn post — Spanish",
        "",
        "```text",
        handoff_preview["posts"]["es"]["text"],
        "```",
        "",
        "## Hashtags",
        "",
        f"- English: {' '.join(handoff_preview['posts']['en']['hashtags']) or '(none)'}",
        f"- Spanish: {' '.join(handoff_preview['posts']['es']['hashtags']) or '(none)'}",
        "",
        "## Gate report",
        "",
    ]
    for key in PUBLISHABLE_ARTEFACTS:
        report = state.gate_reports.get(key) or {}
        verdict = "PASS" if report.get("ok") else "FAIL"
        lines.append(f"- `{key}`: {verdict} ({report.get('gates_run', '?')} gates run)")
    lines += [
        "",
        "<details><summary>Full gate report</summary>",
        "",
        "```json",
        json.dumps(state.gate_reports, indent=2, ensure_ascii=False),
        "```",
        "",
        "</details>",
        "",
        "Posting to LinkedIn is manual. The text above is copy-ready once the "
        "article URL answers.",
    ]
    return "\n".join(lines)


def open_pull_request(state: RunState, path: Path, body: str, title: str) -> tuple[str, str]:
    """Branch off the base branch, commit the article, push, open the pull request."""
    branch = _branch_name(state.slug)
    relative = _repo_relative(path)

    _run(["git", "checkout", "-b", branch, config.PUBLISH_BASE_BRANCH])
    _run(["git", "add", "--", relative])

    staged = _run(["git", "status", "--porcelain", "--", relative])
    if not staged.stdout.strip():
        raise PublishError(
            f"{relative} has nothing to commit on {branch}; the article is already "
            f"on {config.PUBLISH_BASE_BRANCH} and the pull request would be empty"
        )

    _run(["git", "commit", "-m", f"Add post: {title}", "--", relative])
    _run(["git", "push", "--set-upstream", "origin", branch])

    created = _run(
        [
            "gh",
            "pr",
            "create",
            "--base",
            config.PUBLISH_BASE_BRANCH,
            "--head",
            branch,
            "--title",
            title,
            "--body",
            body,
        ]
    )
    url = created.stdout.strip().splitlines()[-1] if created.stdout.strip() else ""
    if not url:
        raise PublishError("gh pr create returned no pull request URL")
    return branch, url


# ── The deployed-URL probe ──────────────────────────────────────────────────


def probe_deployed_url(slug: str) -> ProbeResult:
    """Ask the article's own URL until it answers, or until the attempts run out.

    An assumption that a merge implies a deployment is exactly the assumption
    that leaves a preview cached against a 404.
    """
    url = article_url(slug)
    status: int | None = None
    detail = "not attempted"
    # The list is the attempt counter and the "have we been here before" flag,
    # so the interval is waited between attempts and never after the last one.
    made: list[str] = []

    for _ in range(config.DEPLOY_PROBE_ATTEMPTS):
        if made:
            time.sleep(config.DEPLOY_PROBE_INTERVAL_SECONDS)
        made.append(url)

        request = urlrequest.Request(
            url, method="GET", headers={"User-Agent": config.DEPLOY_PROBE_USER_AGENT}
        )
        try:
            with urlrequest.urlopen(
                request, timeout=config.DEPLOY_PROBE_TIMEOUT_SECONDS
            ) as response:
                status = getattr(response, "status", None) or response.getcode()
                detail = f"HTTP {status}"
                if status == config.DEPLOY_PROBE_OK_STATUS:
                    return ProbeResult(
                        url=url, ok=True, status=status, detail=detail, attempts=len(made)
                    )
        except urlerror.HTTPError as exc:
            status = exc.code
            detail = f"HTTP {exc.code} {exc.reason}"
        except urlerror.URLError as exc:
            status = None
            detail = f"no response: {exc.reason}"
        except OSError as exc:
            status = None
            detail = f"no response: {exc}"

    return ProbeResult(
        url=url,
        ok=False,
        status=status,
        detail=f"{detail} after {config.DEPLOY_PROBE_ATTEMPTS} attempts",
        attempts=len(made),
    )


# ── The stage ───────────────────────────────────────────────────────────────


def publish(state: RunState) -> PublishResult:
    """Emit, open the pull request, probe, hand over. Resumable at every step.

    A second call after the pull request exists skips straight to the probe,
    which is how the run resumes once the operator has merged: the first call
    almost always withholds the handoff because nothing is deployed yet.
    """
    result = PublishResult(slug=state.slug, article_path=article_path(state.slug),
                           article_status="unchanged")

    existing_pr = state.publish.get("pull_request")
    if existing_pr:
        result.branch = state.publish.get("branch")
        result.pull_request = existing_pr
        result.messages.append(f"pull request already open: {existing_pr}")
    else:
        check_preconditions(state)

        path, status = emit_article(state)
        result.article_path, result.article_status = path, status
        if status == "preserved":
            result.messages.append(
                f"{_repo_relative(path)} differs from the generated article and was left "
                "as it is; the operator's edit stands and the build validates it"
            )

        title = _validate_frontmatter(path.read_text(encoding="utf-8")).get("title", state.slug)
        preview = build_handoff(state, article_url(state.slug))
        body = _pull_request_body(state, path, preview)

        branch, pr_url = open_pull_request(state, path, body, str(title))
        result.branch, result.pull_request = branch, pr_url
        state.publish.update(
            {
                "branch": branch,
                "pull_request": pr_url,
                "article_path": _repo_relative(path),
                "article_status": status,
                "url": article_url(state.slug),
                "opened_at": _now(),
            }
        )
        state.note("pull_request", branch=branch, url=pr_url)
        state.save()

    probe = probe_deployed_url(state.slug)
    result.probe = probe
    state.publish["probe"] = probe.to_dict()

    if not probe.ok:
        result.messages.append(
            "the LinkedIn text is withheld until the article URL answers: " + probe.report()
        )
        state.publish["handoff"] = None
        state.note("handoff_withheld", url=probe.url, detail=probe.detail)
        state.save()
        return result

    handoff = build_handoff(state, probe.url)
    result.handoff = handoff
    state.publish["handoff"] = handoff
    state.note("handoff", url=probe.url)
    state.save()
    return result
