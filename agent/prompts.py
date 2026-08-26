"""Prompt files, loaded and substituted.

Every model-facing instruction is a Markdown file in `agent/prompts/`. Nothing in
this module contains prompt text: it reads files, prepends the shared style
prefix, and substitutes `{{NAME}}` placeholders.

Substitution is what keeps the thresholds single-sourced. A prompt says
`{{POST_BODY_MAX_CHARS}}`, never the number, so editing `agent/config.py` moves
the gate and the instruction together. The n8n workflow this replaces got that
wrong once: a limit was restated in a prompt, the gate was tightened, and for a
while the model was told one number and measured against another.

An unresolvable placeholder raises. A prompt that names a threshold which no
longer exists must fail loudly at render time rather than send the model an
empty string where a limit belonged.
"""

from __future__ import annotations

import re
from datetime import date
from pathlib import Path
from typing import Any, Callable

from . import config

__all__ = [
    "PromptError",
    "RUNTIME_PLACEHOLDERS",
    "STYLE_PROMPT",
    "load",
    "placeholders",
    "prompt_for_stage",
    "render",
    "stage_marker",
    "tag_vocabulary",
]

STYLE_PROMPT = "_style"

PLACEHOLDER_RE = re.compile(r"\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}")

# Each stage prompt opens with this marker. It is what the mock backend reads to
# decide which canned response a prompt is asking for, and it lives in the
# Markdown rather than being injected here so the prompt files stay the whole
# contract.
STAGE_MARKER_RE = re.compile(r"<!--\s*stage:\s*([a-z_]+)\s*-->")

# Only the critic file is named for its role rather than its stage; the rubric is
# reviewed and edited as a rubric.
STAGE_PROMPTS = {"critique": "critic"}

# What the driver must supply per render. Everything else resolves from
# `agent/config.py` or from the derived context below. Documented here because
# this mapping is the contract between the driver and the prompt files.
RUNTIME_PLACEHOLDERS = {
    "TOPIC": "the operator's topic, verbatim",
    "BRIEF": "the operator's brief; empty string when there was none",
    "OUTLINE": "the approved plan, as JSON",
    "ARTICLE": "the current article, frontmatter included",
    "GATE_REPORT": "the literal gate failure lines, or a statement that none failed",
    "OPERATOR_FEEDBACK": "the operator's revision feedback, or a statement that there was none",
    "CRITIQUE": "the critic's JSON verdict, or a statement that there was none",
}

# Derived context. Lazy: a prompt that never mentions the goldens does not pay
# for reading them.
_DERIVED: dict[str, Callable[[], Any]] = {}


class PromptError(RuntimeError):
    """A prompt is missing, or a placeholder in it cannot be resolved."""


def path_for(name: str) -> Path:
    return config.PROMPTS_DIR / f"{name}.md"


def load(name: str) -> str:
    """The raw file, without the style prefix and without substitution."""
    path = path_for(name)
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise PromptError(f"no prompt file at {path}") from exc


def prompt_for_stage(stage: str) -> str:
    """The prompt name a pipeline stage renders."""
    name = STAGE_PROMPTS.get(stage, stage)
    if not path_for(name).exists():
        raise PromptError(f"stage {stage!r} has no prompt file at {path_for(name)}")
    return name


def stage_marker(text: str) -> str | None:
    """The stage a rendered prompt declares, or None."""
    match = STAGE_MARKER_RE.search(text)
    return match.group(1) if match else None


def compose(name: str) -> str:
    """The prompt text a render works from: style prefix plus the stage file."""
    if name == STYLE_PROMPT:
        return load(name)
    return f"{load(STYLE_PROMPT).rstrip()}\n\n---\n\n{load(name)}"


def placeholders(name: str) -> list[str]:
    """Every placeholder the composed prompt uses, deduplicated and sorted.

    Exposed so a test can assert that all of them still resolve. A prompt that
    outlives the threshold it cites is the failure this makes visible.
    """
    return sorted(set(PLACEHOLDER_RE.findall(compose(name))))


def resolve(name: str, context: dict[str, Any] | None = None) -> Any:
    """One placeholder's value. Caller context wins, then derived, then config.

    Context keys are matched case-insensitively. Placeholders are upper-case
    because config's own names are, but a caller passing `topic=` is passing the
    obvious Python keyword argument and should not have to know that.
    """
    if context:
        if name in context:
            return context[name]
        lowered = {k.lower(): v for k, v in context.items()}
        if name.lower() in lowered:
            return lowered[name.lower()]
    if name in _DERIVED:
        return _DERIVED[name]()
    if hasattr(config, name):
        return getattr(config, name)
    raise KeyError(name)


def render(name: str, /, **context: Any) -> str:
    """The composed prompt with every placeholder substituted."""
    text = compose(name)

    def substitute(match: re.Match[str]) -> str:
        key = match.group(1)
        try:
            return _format(resolve(key, context))
        except KeyError:
            hint = RUNTIME_PLACEHOLDERS.get(key)
            detail = f"; the driver supplies it ({hint})" if hint else ""
            raise PromptError(
                f"{path_for(name)} uses {{{{{key}}}}}, which is neither a value in "
                f"agent/config.py nor a supplied context key{detail}"
            ) from None

    return PLACEHOLDER_RE.sub(substitute, text)


def render_stage(stage: str, /, **context: Any) -> str:
    return render(prompt_for_stage(stage), **context)


# ── Value formatting ────────────────────────────────────────────────────────
# Config holds regex-keyed maps whose values are the human-readable names. The
# model is shown the names; the regexes are the gate's business.


def _format(value: Any) -> str:
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, (int, float, str, Path)):
        return str(value)
    if isinstance(value, dict):
        return "\n".join(f"- {item}" for item in value.values())
    if isinstance(value, (list, tuple, set)):
        return ", ".join(f"`{item}`" for item in value)
    return str(value)


# ── Derived context ─────────────────────────────────────────────────────────


def tag_vocabulary() -> str:
    """The blog's tag enum, read from the file the content schema reads.

    Restating the vocabulary in a prompt would let it drift from `src/tags.ts`,
    and a tag outside that enum fails the site build.
    """
    source = config.TAGS_SOURCE.read_text(encoding="utf-8")
    pairs = re.findall(r"slug:\s*'([a-z0-9-]+)',\s*\n\s*label:\s*'([^']+)'", source)
    if not pairs:
        raise PromptError(f"no tags parsed from {config.TAGS_SOURCE}")
    return "\n".join(f"- `{slug}`: {label}" for slug, label in pairs)


def goldens() -> str:
    """The approved published pieces, verbatim. The voice is shown, not described."""
    parts = []
    for kind in ("articles", "posts"):
        for path in sorted((config.GOLDENS_DIR / kind).glob("*.md")):
            parts.append(f"### {kind}/{path.name}\n\n{path.read_text(encoding='utf-8').strip()}")
    if not parts:
        raise PromptError(f"no goldens found under {config.GOLDENS_DIR}")
    return "\n\n".join(parts)


def lang_context(lang: str) -> dict[str, Any]:
    """Placeholder values for one language's post prompt.

    Spanish runs longer than English for the same content and carries its own
    machine tells, so the post prompts are rendered with the overridden band and
    the language's own blacklist. Without this, `post_es.md` would be rendered
    with the English numbers and the Spanish gate would then fail it.
    """
    ctx: dict[str, Any] = dict(config.thresholds_for(lang))
    # The post prompts cite {{LANG}}, which resolves from nowhere else. Rendering
    # one without this context raises instead of quietly handing the model the
    # English numbers.
    ctx["LANG"] = lang
    ctx["BANNED_OPENERS"] = config.banned_openers_for(lang)
    ctx["BANNED_PHRASES"] = config.banned_phrases_for(lang)
    ctx["ENGAGEMENT_BAIT"] = config.engagement_bait_for(lang)
    return ctx


_DERIVED.update(
    {
        "TODAY": lambda: date.today().isoformat(),
        "TAG_VOCABULARY": tag_vocabulary,
        "GOLDENS": goldens,
    }
)
