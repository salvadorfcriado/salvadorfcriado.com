"""Machine-writing checks shared by articles and posts.

Nothing here decides what is banned: every pattern, every ceiling and every
per-language override is read from `agent/config.py`. The module supplies the
matching, the counting and the failure wording, so that raising a limit or
retiring a blacklist entry is a one-file change.

A failure names the construction and the character offset at which it was
found, because the model revising against the report has to locate the thing,
not guess at it.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Iterable

from .. import config
from . import GateResult, failed, passed

__all__ = [
    "Match",
    "find_matches",
    "word_count",
    "count_em_dashes",
    "count_emoji",
    "check_banned_openers",
    "check_banned_phrases",
    "check_engagement_bait",
    "check_em_dashes",
    "check_em_dash_density",
    "check_emoji",
]

EM_DASH = "—"

# Emoji, without the arrows and the mathematical operators that legitimate
# technical prose uses (a golden post draws a table with U+2192). Pictographs,
# dingbats, miscellaneous symbols, flags, and any codepoint explicitly presented
# as emoji by a variation selector.
_EMOJI = re.compile(
    "["
    "\U0001F300-\U0001FAFF"  # pictographs, emoticons, transport, supplemental
    "\U0001F1E6-\U0001F1FF"  # regional indicators (flags)
    "\u2600-\u26FF"          # miscellaneous symbols
    "\u2700-\u27BF"          # dingbats
    "\u2B00-\u2BFF"          # arrows and stars presented as emoji
    "\uFE0F"                 # variation selector: emoji presentation, explicitly
    "]"
)


class Match:
    """One blacklist hit: the human name of the construction and where it is.

    `line` and `column` are 1-based because the offsets are read by a person or
    quoted back to a model, never used to index into the string.
    """

    __slots__ = ("name", "pattern", "text", "start", "line", "column")

    def __init__(self, name: str, pattern: str, text: str, start: int, source: str) -> None:
        self.name = name
        self.pattern = pattern
        self.text = text
        self.start = start
        self.line = source.count("\n", 0, start) + 1
        self.column = start - (source.rfind("\n", 0, start) + 1) + 1

    def to_dict(self) -> dict[str, Any]:
        return {
            "construction": self.name,
            "matched": self.text,
            "char_offset": self.start,
            "line": self.line,
            "column": self.column,
        }

    def describe(self) -> str:
        return f"{self.name!r} as {self.text!r} at char {self.start} (line {self.line}, col {self.column})"


def find_matches(text: str, patterns: dict[str, str], source: str | None = None) -> list[Match]:
    """Every hit of every pattern, ordered by position then by name.

    Sorted rather than dict-ordered so two runs over the same text produce the
    same report regardless of how the patterns were assembled.
    """
    origin = source if source is not None else text
    offset = origin.find(text) if source is not None else 0
    offset = max(offset, 0)
    found: list[Match] = []
    for pattern, name in patterns.items():
        for hit in re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE):
            found.append(Match(name, pattern, hit.group(0), hit.start() + offset, origin))
    found.sort(key=lambda m: (m.start, m.name))
    return found


def _detail(matches: Iterable[Match]) -> dict[str, Any]:
    return {"matches": [m.to_dict() for m in matches]}


def count_em_dashes(text: str) -> int:
    return text.count(EM_DASH)


def count_emoji(text: str) -> int:
    return len(_EMOJI.findall(text))


def word_count(text: str) -> int:
    """Whitespace-separated tokens — the same count the config band was drawn from."""
    return len(text.split())


def check_banned_openers(hook: str, full_text: str, lang: str | None, gate: str) -> GateResult:
    """The opener list against the hook, plus the unanchored entries everywhere.

    An entry anchored with `^` is a rule about how a piece opens and is checked
    only against the hook. An unanchored one — "It's not X, it's Y" is the case
    LinkedIn named — is a construction wherever it appears, so it is checked
    against the whole text as well.
    """
    openers = config.banned_openers_for(lang)
    anchored = {p: n for p, n in openers.items() if p.startswith("^")}
    floating = {p: n for p, n in openers.items() if not p.startswith("^")}

    matches = find_matches(hook, anchored, source=full_text)
    matches += find_matches(full_text, floating)
    matches.sort(key=lambda m: (m.start, m.name))

    if matches:
        return failed(
            gate,
            f"{len(matches)} banned opener construction(s), limit 0: "
            + "; ".join(m.describe() for m in matches),
            measured=len(matches),
            limit=0,
            detail=_detail(matches),
        )
    return passed(
        gate,
        f"no banned opener construction among the {len(openers)} configured",
        measured=0,
        limit=0,
    )


def check_banned_phrases(text: str, patterns: dict[str, str], gate: str) -> GateResult:
    matches = find_matches(text, patterns)
    if matches:
        return failed(
            gate,
            f"{len(matches)} blacklisted construction(s), limit 0: "
            + "; ".join(m.describe() for m in matches),
            measured=len(matches),
            limit=0,
            detail=_detail(matches),
        )
    return passed(
        gate,
        f"no blacklisted construction among the {len(patterns)} configured",
        measured=0,
        limit=0,
    )


def check_engagement_bait(text: str, lang: str | None, gate: str) -> GateResult:
    bait = config.engagement_bait_for(lang)
    matches = find_matches(text, bait)
    if matches:
        return failed(
            gate,
            f"{len(matches)} engagement-bait construction(s), limit 0: "
            + "; ".join(m.describe() for m in matches),
            measured=len(matches),
            limit=0,
            detail=_detail(matches),
        )
    return passed(gate, "no engagement-bait construction", measured=0, limit=0)


def _positions(text: str, needle: str) -> list[int]:
    return [m.start() for m in re.finditer(re.escape(needle), text)]


def check_em_dashes(text: str, limit: int, gate: str) -> GateResult:
    count = count_em_dashes(text)
    positions = _positions(text, EM_DASH)
    if count > limit:
        return failed(
            gate,
            f"{count} em dashes, limit {limit}; at char offsets {positions}",
            measured=count,
            limit=limit,
            detail={"char_offsets": positions},
        )
    return passed(gate, f"{count} em dashes, limit {limit}", measured=count, limit=limit)


def check_em_dash_density(text: str, limit: float, gate: str) -> GateResult:
    """Density rather than a count, so length alone cannot fail a long piece."""
    words = word_count(text)
    count = count_em_dashes(text)
    density = (count * 100 / words) if words else 0.0
    shown = f"{density:.2f}"
    if density > limit:
        return failed(
            gate,
            f"{shown} em dashes per 100 words ({count} across {words} words), limit {limit}",
            measured=density,
            limit=limit,
            detail={"em_dashes": count, "words": words, "char_offsets": _positions(text, EM_DASH)},
        )
    return passed(
        gate,
        f"{shown} em dashes per 100 words ({count} across {words} words), limit {limit}",
        measured=density,
        limit=limit,
        detail={"em_dashes": count, "words": words},
    )


def check_emoji(text: str, limit: int, gate: str) -> GateResult:
    found = [(m.start(), m.group(0)) for m in _EMOJI.finditer(text)]
    count = len(found)
    if count > limit:
        listed = ", ".join(
            f"{unicodedata.name(ch, 'U+%04X' % ord(ch))} at char {pos}" for pos, ch in found
        )
        return failed(
            gate,
            f"{count} emoji, limit {limit}: {listed}",
            measured=count,
            limit=limit,
            detail={"emoji": [{"char": ch, "char_offset": pos} for pos, ch in found]},
        )
    return passed(gate, f"{count} emoji, limit {limit}", measured=count, limit=limit)
