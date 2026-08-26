"""Prompt files: they load, they resolve, and they restate no threshold.

The failure this suite exists for is the one the n8n workflow shipped: a limit
written into a prompt as a literal, a gate later tightened, and a model told one
number while being measured against another. A prompt may name a threshold; it
may never spell one.
"""

from __future__ import annotations

import re

import pytest

from agent import config, prompts

# Every stage that renders a prompt. `package` and `publish` are mechanical.
MODEL_STAGES = ("plan", "write", "critique", "revise", "post_en", "post_es")

PROMPT_NAMES = (prompts.STYLE_PROMPT,) + tuple(prompts.prompt_for_stage(s) for s in MODEL_STAGES)

# What the driver supplies. Values are irrelevant here; presence is the contract.
RUNTIME_CONTEXT = {key: f"<{key.lower()} supplied by the driver>" for key in prompts.RUNTIME_PLACEHOLDERS}


def context_for(name: str) -> dict[str, object]:
    ctx = dict(RUNTIME_CONTEXT)
    if name.startswith("post_"):
        ctx.update(prompts.lang_context(name.removeprefix("post_")))
    return ctx


def test_every_stage_has_a_prompt_file():
    for stage in MODEL_STAGES:
        name = prompts.prompt_for_stage(stage)
        assert prompts.path_for(name).is_file()


def test_stage_without_a_prompt_raises():
    with pytest.raises(prompts.PromptError):
        prompts.prompt_for_stage("publish")


def test_every_prompt_declares_its_stage():
    """The marker is how the mock backend knows which fixture is being asked for."""
    for stage in MODEL_STAGES:
        rendered = prompts.render(prompts.prompt_for_stage(stage), **context_for(prompts.prompt_for_stage(stage)))
        assert prompts.stage_marker(rendered) == stage


def test_every_prompt_carries_the_style_prefix():
    style = prompts.load(prompts.STYLE_PROMPT)
    marker = "## Never invent"
    assert marker in style
    for name in PROMPT_NAMES:
        assert marker in prompts.compose(name)


def test_every_placeholder_resolves():
    for name in PROMPT_NAMES:
        ctx = context_for(name)
        for key in prompts.placeholders(name):
            prompts.resolve(key, ctx)  # raises KeyError if it does not resolve


def test_render_leaves_no_placeholder_behind():
    for name in PROMPT_NAMES:
        rendered = prompts.render(name, **context_for(name))
        assert "{{" not in rendered, name


def test_unknown_placeholder_is_an_error_not_a_blank(tmp_path, monkeypatch):
    """A prompt citing a threshold that no longer exists must fail loudly."""
    monkeypatch.setattr(config, "PROMPTS_DIR", tmp_path)
    (tmp_path / "_style.md").write_text("style", encoding="utf-8")
    (tmp_path / "orphan.md").write_text("limit: {{POST_BODY_MAX_CHARS_OLD}}", encoding="utf-8")
    with pytest.raises(prompts.PromptError) as exc:
        prompts.render("orphan")
    assert "POST_BODY_MAX_CHARS_OLD" in str(exc.value)


def test_missing_prompt_file_names_the_path(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "PROMPTS_DIR", tmp_path)
    with pytest.raises(prompts.PromptError) as exc:
        prompts.load("nothing_here")
    assert str(tmp_path) in str(exc.value)


def test_no_prompt_spells_a_number():
    """Thresholds are named, never written. Placeholders are stripped first."""
    for name in PROMPT_NAMES:
        text = prompts.PLACEHOLDER_RE.sub("", prompts.load(name))
        digits = re.findall(r".{0,60}\d.{0,20}", text)
        assert not digits, f"{name} spells a number: {digits}"


def test_thresholds_reach_the_rendered_prompt():
    """The substitution is load-bearing: change config, the prompt text changes."""
    rendered = prompts.render("post_en", **context_for("post_en"))
    assert str(config.POST_BODY_MAX_CHARS) in rendered
    assert str(config.POST_HOOK_MAX_WORDS) in rendered

    plan_prompt = prompts.render("plan", **context_for("plan"))
    assert str(config.ARTICLE_MAX_WORDS) in plan_prompt


def test_spanish_post_gets_the_spanish_band():
    """Rendered without the language context, post_es would carry English numbers."""
    en = prompts.render("post_en", **context_for("post_en"))
    es = prompts.render("post_es", **context_for("post_es"))
    assert str(config.LANG_THRESHOLD_OVERRIDES["es"]["POST_BODY_MAX_CHARS"]) in es
    assert str(config.LANG_THRESHOLD_OVERRIDES["es"]["POST_HOOK_MAX_CHARS"]) in es
    assert str(config.POST_BODY_MAX_CHARS) in en
    # And the Spanish blacklist arrives with it, through the shared style prefix.
    for phrase in config.LANG_EXTRA_BANNED_PHRASES["es"].values():
        assert phrase in es
    for phrase in config.LANG_EXTRA_BANNED_PHRASES["es"].values():
        assert phrase not in en


def test_post_prompt_without_language_context_fails():
    with pytest.raises(prompts.PromptError):
        prompts.render("post_es", **RUNTIME_CONTEXT)


def test_tag_vocabulary_comes_from_the_content_schema_source():
    vocabulary = prompts.tag_vocabulary()
    source = config.TAGS_SOURCE.read_text(encoding="utf-8")
    for slug in re.findall(r"slug:\s*'([a-z0-9-]+)'", source):
        assert f"`{slug}`" in vocabulary
    assert "voice-multimodal" not in vocabulary  # the reserve list is not the enum


def test_write_prompt_names_the_frontmatter_contract():
    rendered = prompts.render("write", **context_for("write"))
    for key in config.ARTICLE_REQUIRED_FRONTMATTER:
        assert f"`{key}`" in rendered


def test_critic_prompt_defers_measurable_properties_to_the_gates():
    rendered = prompts.render("critic", **context_for("critic"))
    assert "gate's verdict is authoritative" in rendered
    assert str(config.CRITIC_SCORE_MAX) in rendered
    assert str(config.CRITIC_SCORE_FLOOR) in rendered


def test_style_prefix_forbids_the_service_pitch():
    """The audience is hiring him, not buying from him. This is the one rule
    that cannot be recovered from a bad draft: it changes what he looks like."""
    style = prompts.load(prompts.STYLE_PROMPT).lower()
    for banned in ("hire me", "available for consulting", "work with me"):
        assert banned in style
    assert "founder" in style


def test_goldens_are_the_voice_reference_where_it_matters():
    for name in ("write", "post_en", "post_es", "critic"):
        assert "GOLDENS" in prompts.placeholders(name)
    text = prompts.goldens()
    assert "articles/" in text and "posts/" in text
