"""LinkedIn post gates.

The post is the piece that has to work on its own, inside LinkedIn, without the
reader leaving. Every rule here is a publishing rule with a measured
justification recorded next to its value in `agent/config.py`; this module only
measures and reports.

Language is a parameter, never a branch: thresholds come from
`config.thresholds_for(lang)` and blacklists from the `*_for(lang)` helpers, so
Spanish carries its own band and its own tells without a second copy of the
logic.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .. import config
from . import GateResult, failed, passed
from . import antislop

__all__ = ["PostParts", "split_post", "check_post"]

# A trailing line made of nothing but hashtags. It is the tag block, not prose,
# and it does not count towards the body's length band.
_HASHTAG_LINE = re.compile(r"^\s*(?:#[^\s#]+\s*)+$")
_HASHTAG = re.compile(r"(?<![\w#])#[A-Za-z0-9_À-ÿ]+")

# Markdown constructions. LinkedIn renders none of them: they reach the reader
# as literal asterisks and brackets. `#RAG` is a hashtag, not a heading, which
# is why the heading pattern demands whitespace after the hashes.
_MARKDOWN = {
    r"^#{1,6}[ \t]\S": "Markdown heading",
    r"\*\*[^\s*][^*]*\*\*": "Markdown bold",
    r"\[[^\]\n]+\]\([^)\n]+\)": "Markdown link",
    r"^```": "fenced code block",
}


@dataclass(frozen=True)
class PostParts:
    """The post decomposed once, so every gate measures the same thing."""

    text: str
    hook: str
    hook_line: int
    opening_paragraph: list[str]
    body: str
    hashtags: list[str]
    leading_blank: bool


def split_post(text: str) -> PostParts:
    lines = text.rstrip().split("\n")

    trailing_tags: list[str] = []
    while lines and (not lines[-1].strip() or _HASHTAG_LINE.match(lines[-1])):
        line = lines.pop()
        if line.strip():
            trailing_tags.insert(0, line)

    body = "\n".join(lines).strip()

    first = next((i for i, line in enumerate(text.split("\n")) if line.strip()), None)
    all_lines = text.split("\n")
    hook = all_lines[first].strip() if first is not None else ""

    paragraph: list[str] = []
    if first is not None:
        for line in all_lines[first:]:
            if not line.strip():
                break
            paragraph.append(line.strip())

    return PostParts(
        text=text,
        hook=hook,
        hook_line=(first or 0) + 1,
        opening_paragraph=paragraph,
        body=body,
        hashtags=_HASHTAG.findall(text),
        leading_blank=bool(first),
    )


def check_post(text: str, lang: str | None = None) -> list[GateResult]:
    """Every post gate, cheapest first. Pure: no model, no network."""
    limits = config.thresholds_for(lang)
    parts = split_post(text)

    results: list[GateResult] = [
        _check_hook_line(parts),
        _check_hook_chars(parts, limits),
        _check_hook_words(parts, limits),
        _check_hook_question(parts),
        antislop.check_banned_openers(parts.hook, parts.text, lang, "post.banned_opener"),
        _check_body_chars(parts, limits),
        _check_digits(parts, limits),
        _check_hashtags(parts, limits),
        _check_markdown(parts),
        antislop.check_em_dashes(parts.text, limits["POST_MAX_EM_DASHES"], "post.em_dashes"),
        antislop.check_emoji(parts.text, limits["POST_MAX_EMOJI"], "post.emoji"),
        antislop.check_banned_phrases(
            parts.text, config.banned_phrases_for(lang), "post.banned_phrases"
        ),
        antislop.check_engagement_bait(parts.text, lang, "post.engagement_bait"),
    ]
    return results


def _check_hook_line(parts: PostParts) -> GateResult:
    """The hook is the first line and stands alone.

    LinkedIn truncates around the hook and the "…see more" tap is the dwell
    signal, so a hook that runs into a second line before the first blank one
    has no truncation point to work with.
    """
    gate = "post.hook_line"
    lines = len(parts.opening_paragraph)
    if not parts.hook:
        return failed(gate, "the post is empty: no hook line", measured=0, limit=1)
    if parts.leading_blank:
        return failed(
            gate,
            f"the hook starts on line {parts.hook_line}, expected line 1",
            measured=lines,
            limit=1,
            detail={"hook": parts.hook},
        )
    if lines > 1:
        return failed(
            gate,
            f"the opening paragraph runs to {lines} lines, limit 1: the hook must be the whole "
            "first line and nothing else",
            measured=lines,
            limit=1,
            detail={"opening_paragraph": parts.opening_paragraph},
        )
    return passed(gate, "the hook is the first line and stands alone", measured=lines, limit=1)


def _check_hook_chars(parts: PostParts, limits: dict[str, int]) -> GateResult:
    gate = "post.hook_chars"
    limit = limits["POST_HOOK_MAX_CHARS"]
    measured = len(parts.hook)
    if measured > limit:
        return failed(
            gate,
            f"hook is {measured} characters, limit {limit}: {parts.hook!r}",
            measured=measured,
            limit=limit,
            detail={"hook": parts.hook},
        )
    return passed(gate, f"hook is {measured} characters, limit {limit}", measured=measured, limit=limit)


def _check_hook_words(parts: PostParts, limits: dict[str, int]) -> GateResult:
    gate = "post.hook_words"
    limit = limits["POST_HOOK_MAX_WORDS"]
    measured = antislop.word_count(parts.hook)
    if measured > limit:
        return failed(
            gate,
            f"hook is {measured} words, limit {limit}: {parts.hook!r}",
            measured=measured,
            limit=limit,
            detail={"hook": parts.hook},
        )
    return passed(gate, f"hook is {measured} words, limit {limit}", measured=measured, limit=limit)


def _check_hook_question(parts: PostParts) -> GateResult:
    """A question opener asks the reader for work before it has earned any."""
    gate = "post.hook_question"
    asks = parts.hook.endswith("?") or parts.hook.startswith("¿")
    if asks:
        return failed(
            gate,
            f"the hook is a question and a post opens with none, limit 0: {parts.hook!r}",
            measured=1,
            limit=0,
            detail={"hook": parts.hook},
        )
    return passed(gate, "the hook is not a question, limit 0", measured=0, limit=0)


def _check_body_chars(parts: PostParts, limits: dict[str, int]) -> GateResult:
    """Length of the body, hashtag block excluded — the tags are not the post."""
    gate = "post.body_chars"
    low, high = limits["POST_BODY_MIN_CHARS"], limits["POST_BODY_MAX_CHARS"]
    measured = len(parts.body)
    band = f"{low}-{high}"
    if measured < low:
        return failed(
            gate,
            f"body is {measured} characters, band {band}: {low - measured} short",
            measured=measured,
            limit=band,
        )
    if measured > high:
        return failed(
            gate,
            f"body is {measured} characters, band {band}: {measured - high} over",
            measured=measured,
            limit=band,
        )
    return passed(gate, f"body is {measured} characters, band {band}", measured=measured, limit=band)


def _check_digits(parts: PostParts, limits: dict[str, int]) -> GateResult:
    """At least one measurement. It is the thing a model cannot invent honestly."""
    gate = "post.digits"
    limit = limits["POST_MIN_DIGITS"]
    measured = sum(1 for ch in parts.body if ch.isdigit())
    if measured < limit:
        return failed(
            gate,
            f"{measured} digits in the body, minimum {limit}: the post carries no measurement, "
            "threshold, version or named number",
            measured=measured,
            limit=limit,
        )
    return passed(gate, f"{measured} digits in the body, minimum {limit}", measured=measured, limit=limit)


def _check_hashtags(parts: PostParts, limits: dict[str, int]) -> GateResult:
    gate = "post.hashtags"
    limit = limits["POST_MAX_HASHTAGS"]
    measured = len(parts.hashtags)
    if measured > limit:
        return failed(
            gate,
            f"{measured} hashtags, limit {limit}: {parts.hashtags}",
            measured=measured,
            limit=limit,
            detail={"hashtags": parts.hashtags},
        )
    return passed(
        gate,
        f"{measured} hashtags, limit {limit}",
        measured=measured,
        limit=limit,
        detail={"hashtags": parts.hashtags},
    )


def _check_markdown(parts: PostParts) -> GateResult:
    """LinkedIn has no Markdown renderer; the syntax reaches the reader as noise."""
    gate = "post.markdown"
    matches = antislop.find_matches(parts.text, _MARKDOWN)
    if matches:
        return failed(
            gate,
            f"{len(matches)} Markdown construction(s), limit 0: "
            + "; ".join(m.describe() for m in matches),
            measured=len(matches),
            limit=0,
            detail={"matches": [m.to_dict() for m in matches]},
        )
    return passed(gate, "no Markdown syntax", measured=0, limit=0)
