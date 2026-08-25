"""Backends: one interface, a named prerequisite when unusable, and a stage
reassignable by configuration alone.

The suite never calls a model. The mock backend is what makes that true, and its
fixtures are held to the same gates as generated text, so an end-to-end run
against them proves the wiring rather than the fixture.
"""

from __future__ import annotations

import inspect
import json
import re

import pytest
import yaml

from agent import backends, config, prompts
from agent.backends import BackendError, BackendUnavailable, Response
from agent.backends.api import ApiBackend
from agent.backends.claude_code import ClaudeCodeBackend
from agent.backends.mock import MockBackend

ALL_BACKENDS = (config.BACKEND_CLAUDE_CODE, config.BACKEND_API, config.BACKEND_MOCK)

FIXTURE_STAGES = ("plan", "write", "critique", "revise", "post_en", "post_es")


# ── The interface ───────────────────────────────────────────────────────────


@pytest.mark.parametrize("name", ALL_BACKENDS)
def test_every_backend_satisfies_the_interface(name):
    backend = backends.get_backend(name)
    assert backend.name == name

    usable, reason = backend.available()
    assert isinstance(usable, bool)
    assert isinstance(reason, str)
    assert usable or reason, "an unusable backend must say why"

    signature = inspect.signature(backend.complete)
    assert list(signature.parameters) == ["prompt", "system"]
    assert signature.parameters["system"].kind is inspect.Parameter.KEYWORD_ONLY


def test_unknown_backend_names_the_alternatives():
    with pytest.raises(BackendError) as exc:
        backends.get_backend("gpt_by_carrier_pigeon")
    assert "gpt_by_carrier_pigeon" in str(exc.value)
    for name in ALL_BACKENDS:
        assert name in str(exc.value)


# ── Missing prerequisites, named ────────────────────────────────────────────


def test_claude_code_names_the_missing_binary(monkeypatch):
    monkeypatch.setattr("agent.backends.claude_code.shutil.which", lambda _: None)
    usable, reason = ClaudeCodeBackend().available()
    assert not usable
    assert reason.startswith(f"{config.BACKEND_CLAUDE_CODE}: ")
    assert "binary not found on PATH" in reason


def test_claude_code_refuses_to_run_when_unavailable(monkeypatch):
    monkeypatch.setattr("agent.backends.claude_code.shutil.which", lambda _: None)
    with pytest.raises(BackendUnavailable):
        ClaudeCodeBackend().complete("anything")


def test_api_names_the_missing_key(monkeypatch):
    monkeypatch.delenv(config.API_KEY_ENV, raising=False)
    usable, reason = ApiBackend().available()
    assert not usable
    assert reason == f"{config.BACKEND_API}: {config.API_KEY_ENV} is not set"


def test_api_refuses_to_run_without_a_key(monkeypatch):
    monkeypatch.delenv(config.API_KEY_ENV, raising=False)
    with pytest.raises(BackendUnavailable) as exc:
        ApiBackend().complete("anything")
    assert config.API_KEY_ENV in str(exc.value)


def test_api_reads_its_key_from_the_environment_at_call_time(monkeypatch):
    """`.env` is loaded by the entry point, which can run after the import."""
    monkeypatch.delenv(config.API_KEY_ENV, raising=False)
    backend = ApiBackend()
    assert not backend.available()[0]
    monkeypatch.setenv(config.API_KEY_ENV, "sk-not-a-real-key")
    assert backend.available()[0]


def test_mock_names_the_missing_fixtures_directory(tmp_path):
    backend = MockBackend(fixtures_dir=tmp_path / "absent")
    usable, reason = backend.available()
    assert not usable
    assert str(tmp_path / "absent") in reason
    assert reason.startswith(f"{config.BACKEND_MOCK}: ")


# ── Stage routing is configuration, not code ────────────────────────────────


def test_a_stage_moves_to_another_backend_by_config_alone(monkeypatch):
    monkeypatch.setitem(config.STAGE_BACKENDS, "write", config.BACKEND_MOCK)
    assert backends.for_stage("write").name == config.BACKEND_MOCK

    monkeypatch.setitem(config.STAGE_BACKENDS, "write", config.BACKEND_API)
    assert backends.for_stage("write").name == config.BACKEND_API

    monkeypatch.setitem(config.STAGE_BACKENDS, "write", config.BACKEND_CLAUDE_CODE)
    assert backends.for_stage("write").name == config.BACKEND_CLAUDE_CODE


def test_an_unmapped_stage_falls_back_to_the_default(monkeypatch):
    monkeypatch.setattr(config, "DEFAULT_BACKEND", config.BACKEND_MOCK)
    assert backends.for_stage("a_stage_nobody_mapped").name == config.BACKEND_MOCK


def test_every_mapped_stage_is_a_real_stage():
    for stage in config.STAGE_BACKENDS:
        assert stage in config.STAGES


# ── extract_json ────────────────────────────────────────────────────────────


def test_extract_json_survives_a_fenced_block_and_prose():
    payload = {"title": "a title", "gaps": ["one"]}
    wrapped = (
        "Sure, here is the outline you asked for.\n\n"
        "```json\n" + json.dumps(payload) + "\n```\n\n"
        "Let me know if you would like it adjusted."
    )
    assert backends.extract_json(wrapped) == payload


def test_extract_json_survives_bare_prose_around_an_object():
    payload = {"verdict": "pass"}
    assert backends.extract_json(f"Here it is: {json.dumps(payload)} Hope that helps!") == payload


def test_extract_json_on_unrecoverable_text_is_an_error():
    with pytest.raises(BackendError):
        backends.extract_json("I would rather write you a poem about latency.")


# ── The mock backend ────────────────────────────────────────────────────────


def test_mock_resolves_the_stage_from_the_prompt_marker():
    prompt = prompts.render("plan", TOPIC="anything", BRIEF="")
    response = MockBackend().complete(prompt)
    assert isinstance(response, Response)
    assert response.backend == config.BACKEND_MOCK
    assert response.meta["stage"] == "plan"
    assert backends.extract_json(response.text)["thesis"]


def test_mock_explicit_stage_wins_over_the_marker():
    prompt = prompts.render("plan", TOPIC="anything", BRIEF="")
    response = MockBackend(stage="post_en").complete(prompt)
    assert response.meta["stage"] == "post_en"


def test_mock_without_a_stage_says_so():
    with pytest.raises(BackendError) as exc:
        MockBackend().complete("a prompt with no marker in it")
    assert "stage" in str(exc.value)


def test_mock_names_the_stage_it_has_no_fixture_for():
    with pytest.raises(BackendError) as exc:
        MockBackend(stage="nonexistent_stage").complete("x")
    assert "nonexistent_stage" in str(exc.value)


def test_mock_is_deterministic():
    first = MockBackend(stage="write").complete("x").text
    second = MockBackend(stage="write").complete("x").text
    assert first == second


@pytest.mark.parametrize("stage", FIXTURE_STAGES)
def test_a_fixture_exists_for_every_generating_stage(stage):
    assert MockBackend().complete(f"<!-- stage: {stage} -->").text.strip()


# ── Fixture quality: the end-to-end run is only as good as these ────────────


def _article_fixture(stage: str) -> tuple[dict, str]:
    text = MockBackend(stage=stage).complete("x").text
    _, frontmatter, body = text.split("---\n", 2)
    return yaml.safe_load(frontmatter), body


@pytest.mark.parametrize("stage", ("write", "revise"))
def test_article_fixture_would_pass_the_article_gates(stage):
    meta, body = _article_fixture(stage)

    assert set(meta) >= set(config.ARTICLE_REQUIRED_FRONTMATTER)
    assert set(meta) <= set(config.ARTICLE_ALLOWED_FRONTMATTER)

    tag_source = config.TAGS_SOURCE.read_text(encoding="utf-8")
    vocabulary = set(re.findall(r"slug:\s*'([a-z0-9-]+)'", tag_source))
    assert config.ARTICLE_MIN_TAGS <= len(meta["tags"]) <= config.ARTICLE_MAX_TAGS
    assert set(meta["tags"]) <= vocabulary
    assert isinstance(meta["readingTime"], int) and meta["readingTime"] > 0
    assert config.ARTICLE_EXCERPT_MIN_CHARS <= len(meta["excerpt"]) <= config.ARTICLE_EXCERPT_MAX_CHARS

    words = len(body.split())
    assert config.ARTICLE_MIN_WORDS <= words <= config.ARTICLE_MAX_WORDS
    assert body.count("—") / words * 100 <= config.ARTICLE_MAX_EM_DASHES_PER_100_WORDS

    for pattern, name in config.ARTICLE_BANNED_PHRASES.items():
        assert not re.search(pattern, body, re.I), name
    for pattern in config.PLACEHOLDER_MARKERS:
        assert not re.search(pattern, body, re.I), pattern


@pytest.mark.parametrize("stage,lang", (("post_en", "en"), ("post_es", "es")))
def test_post_fixture_would_pass_the_post_gates(stage, lang):
    text = MockBackend(stage=stage).complete("x").text
    limits = config.thresholds_for(lang)
    hook = text.splitlines()[0]

    assert limits["POST_BODY_MIN_CHARS"] <= len(text) <= limits["POST_BODY_MAX_CHARS"]
    assert len(hook) <= limits["POST_HOOK_MAX_CHARS"]
    assert len(hook.split()) <= limits["POST_HOOK_MAX_WORDS"]
    assert not hook.rstrip().endswith("?")
    assert len(re.findall(r"\d", text)) >= limits["POST_MIN_DIGITS"]
    assert text.count("—") <= limits["POST_MAX_EM_DASHES"]
    assert len(re.findall(r"#\w+", text)) <= limits["POST_MAX_HASHTAGS"]
    assert text.rstrip().splitlines()[-1].startswith("#"), "hashtags go at the end"

    for pattern, name in config.banned_phrases_for(lang).items():
        assert not re.search(pattern, text, re.I), name
    for pattern, name in config.banned_openers_for(lang).items():
        assert not re.search(pattern, hook, re.I), name
    for pattern, name in config.engagement_bait_for(lang).items():
        assert not re.search(pattern, text, re.I), name


def test_structured_fixtures_are_the_shape_the_stage_declares():
    outline = backends.extract_json(MockBackend(stage="plan").complete("x").text)
    assert set(outline) == {"title", "angle", "thesis", "sections", "gaps", "tags", "excerpt"}
    assert outline["gaps"], "an outline with no gaps is an outline that invented its specifics"
    assert all({"heading", "claim", "evidence"} == set(s) for s in outline["sections"])

    verdict = backends.extract_json(MockBackend(stage="critique").complete("x").text)
    assert set(verdict) == {"scores", "total", "findings", "verdict"}
    assert len(verdict["scores"]) == 5
    assert verdict["total"] == sum(verdict["scores"].values()) <= config.CRITIC_SCORE_MAX
    assert verdict["total"] >= config.CRITIC_SCORE_FLOOR
    assert verdict["verdict"] == "pass"
    assert all({"dimension", "problem", "fix"} == set(f) for f in verdict["findings"])
