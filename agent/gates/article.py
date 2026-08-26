"""Article gates.

The build is the article's real acceptance test, but it is slow and its error
messages are Zod's. These gates fail first, in under a second, naming the field
and the distance to the limit — which is what a revision pass can act on.

Frontmatter is parsed with the same YAML the content collection reads, so a file
that parses here parses there.
"""

from __future__ import annotations

import datetime as _datetime
import re
from dataclasses import dataclass
from typing import Any

import yaml

from .. import config
from . import GateResult, failed, passed, skipped
from . import antislop
from . import tags as tags_gate

__all__ = ["ArticleParts", "split_article", "check_article"]

_FRONTMATTER = re.compile(r"\A---\r?\n(?P<yaml>.*?)\r?\n---\r?\n?(?P<body>.*)\Z", re.S)

# The type each required field must carry once YAML has parsed it. Not a
# threshold: it mirrors `src/content.config.ts`, which is where the authority
# for it lives, and the build gate is the backstop if the two ever disagree.
_FIELD_TYPES: dict[str, tuple[type, ...]] = {
    "title": (str,),
    "date": (_datetime.date, _datetime.datetime),
    "tags": (list,),
    "excerpt": (str,),
    "readingTime": (int,),
}


@dataclass(frozen=True)
class ArticleParts:
    text: str
    frontmatter: dict[str, Any] | None
    body: str
    error: str | None = None


def split_article(text: str) -> ArticleParts:
    match = _FRONTMATTER.match(text)
    if match is None:
        return ArticleParts(text=text, frontmatter=None, body=text, error="no `---` frontmatter block")
    try:
        data = yaml.safe_load(match.group("yaml"))
    except yaml.YAMLError as exc:
        return ArticleParts(
            text=text,
            frontmatter=None,
            body=match.group("body"),
            error=f"frontmatter is not valid YAML: {exc}",
        )
    if not isinstance(data, dict):
        return ArticleParts(
            text=text,
            frontmatter=None,
            body=match.group("body"),
            error=f"frontmatter parses to {type(data).__name__}, expected a mapping",
        )
    return ArticleParts(text=text, frontmatter=data, body=match.group("body"))


def check_article(text: str) -> list[GateResult]:
    """Every article gate except the build, cheapest first. Pure: no model, no network."""
    parts = split_article(text)
    results: list[GateResult] = [_check_frontmatter(parts)]

    if parts.frontmatter is None:
        # Everything downstream reads a field. Reported as skipped, not passed:
        # a report that omitted them could be read as "everything was checked".
        for gate in (
            "article.frontmatter_required",
            "article.frontmatter_unknown",
            "article.tag_vocabulary",
            "article.tag_count",
            "article.excerpt_chars",
        ):
            results.append(skipped(gate, "frontmatter did not parse"))
    else:
        results.append(_check_required(parts.frontmatter))
        results.append(_check_unknown(parts.frontmatter))
        results.extend(_check_tags(parts.frontmatter.get("tags")))
        results.append(_check_excerpt(parts.frontmatter))

    results.append(_check_word_count(parts))
    results.append(_check_placeholders(parts))
    results.append(
        antislop.check_em_dash_density(
            parts.body, config.ARTICLE_MAX_EM_DASHES_PER_100_WORDS, "article.em_dash_density"
        )
    )
    results.append(antislop.check_emoji(parts.text, config.ARTICLE_MAX_EMOJI, "article.emoji"))
    results.append(
        antislop.check_banned_phrases(
            parts.text, config.ARTICLE_BANNED_PHRASES, "article.banned_phrases"
        )
    )
    return results


def _check_tags(declared: Any) -> list[GateResult]:
    """`src/tags.ts` is the vocabulary. Losing it is a failure, not a crash."""
    try:
        return tags_gate.check_tags(declared)
    except tags_gate.TagVocabularyError as exc:
        return [
            failed("article.tag_vocabulary", str(exc), measured="unreadable", limit="1 TAGS array"),
            skipped("article.tag_count", "the tag vocabulary could not be read"),
        ]


def _check_frontmatter(parts: ArticleParts) -> GateResult:
    gate = "article.frontmatter"
    if parts.error:
        return failed(
            gate,
            f"frontmatter is unreadable, 1 parseable block required: {parts.error}",
            measured=0,
            limit=1,
        )
    return passed(
        gate,
        f"frontmatter parsed, {len(parts.frontmatter or {})} keys",
        measured=1,
        limit=1,
    )


def _check_required(data: dict[str, Any]) -> GateResult:
    gate = "article.frontmatter_required"
    required = list(config.ARTICLE_REQUIRED_FRONTMATTER)
    missing = [k for k in required if data.get(k) in (None, "", [])]
    mistyped = [
        f"{k}: {type(data[k]).__name__}, expected {'/'.join(t.__name__ for t in _FIELD_TYPES[k])}"
        for k in required
        if k not in missing and k in _FIELD_TYPES and not isinstance(data[k], _FIELD_TYPES[k])
    ]
    present = len(required) - len(missing) - len(mistyped)
    if missing or mistyped:
        problems = []
        if missing:
            problems.append(f"missing {missing}")
        if mistyped:
            problems.append("mistyped " + "; ".join(mistyped))
        return failed(
            gate,
            f"{present} of {len(required)} required frontmatter fields usable ({', '.join(problems)}); "
            f"required: {required}",
            measured=present,
            limit=len(required),
            detail={"missing": missing, "mistyped": mistyped},
        )
    return passed(
        gate,
        f"{present} of {len(required)} required frontmatter fields present and typed",
        measured=present,
        limit=len(required),
    )


def _check_unknown(data: dict[str, Any]) -> GateResult:
    """`.strict()` on the content schema turns an unknown key into a build failure."""
    gate = "article.frontmatter_unknown"
    allowed = list(config.ARTICLE_ALLOWED_FRONTMATTER)
    unknown = [k for k in data if k not in allowed]
    if unknown:
        return failed(
            gate,
            f"{len(unknown)} frontmatter key(s) outside the schema, limit 0: {unknown}; "
            f"allowed: {allowed}",
            measured=len(unknown),
            limit=0,
            detail={"unknown": unknown, "allowed": allowed},
        )
    return passed(gate, f"no frontmatter key outside {allowed}", measured=0, limit=0)


def _check_excerpt(data: dict[str, Any]) -> GateResult:
    gate = "article.excerpt_chars"
    low, high = config.ARTICLE_EXCERPT_MIN_CHARS, config.ARTICLE_EXCERPT_MAX_CHARS
    band = f"{low}-{high}"
    excerpt = data.get("excerpt")
    if not isinstance(excerpt, str) or not excerpt.strip():
        return failed(
            gate,
            f"no excerpt; it is rendered verbatim as the meta description, band {band} characters",
            measured=0,
            limit=band,
        )
    measured = len(excerpt.strip())
    if measured < low:
        return failed(
            gate,
            f"excerpt is {measured} characters, band {band}: {low - measured} short",
            measured=measured,
            limit=band,
        )
    if measured > high:
        return failed(
            gate,
            f"excerpt is {measured} characters, band {band}: {measured - high} over, and the "
            "content schema rejects it at build time",
            measured=measured,
            limit=band,
        )
    return passed(gate, f"excerpt is {measured} characters, band {band}", measured=measured, limit=band)


def _check_word_count(parts: ArticleParts) -> GateResult:
    gate = "article.word_count"
    low, high = config.ARTICLE_MIN_WORDS, config.ARTICLE_MAX_WORDS
    band = f"{low}-{high}"
    measured = antislop.word_count(parts.body)
    if measured < low:
        return failed(
            gate,
            f"{measured} words, band {band}: {low - measured} short",
            measured=measured,
            limit=band,
        )
    if measured > high:
        return failed(
            gate,
            f"{measured} words, band {band}: {measured - high} over",
            measured=measured,
            limit=band,
        )
    return passed(gate, f"{measured} words, band {band}", measured=measured, limit=band)


def _check_placeholders(parts: ArticleParts) -> GateResult:
    """A marker that survives to a gate is a draft that was handed over by accident."""
    gate = "article.placeholders"
    patterns = {pattern: pattern for pattern in config.PLACEHOLDER_MARKERS}
    matches = antislop.find_matches(parts.text, patterns)
    if matches:
        listed = "; ".join(
            f"{m.text!r} at char {m.start} (line {m.line}, col {m.column})" for m in matches
        )
        return failed(
            gate,
            f"{len(matches)} unresolved placeholder marker(s), limit 0: {listed}",
            measured=len(matches),
            limit=0,
            detail={"matches": [m.to_dict() for m in matches]},
        )
    return passed(gate, "no unresolved placeholder marker", measured=0, limit=0)
