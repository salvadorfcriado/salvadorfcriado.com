"""Repetition against what has already been published.

A voice becomes a formula one reused opener at a time. The gate compares the
candidate's opening line and its closing move against every piece the repository
can see — the goldens and everything already in `src/content/blog` — and fails
when either is too close to something that ran before.

Comparison is on normalised tokens, so punctuation and capitalisation do not
disguise a repeat and do not manufacture one either.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Callable

from .. import config
from . import GateResult, failed, passed

__all__ = ["CorpusPiece", "load_corpus", "check_repetition"]

_FRONTMATTER = re.compile(r"\A---\r?\n.*?\r?\n---\r?\n?", re.S)
_TOKEN = re.compile(r"[\w']+", re.UNICODE)
_HASHTAG_LINE = re.compile(r"^\s*(?:#[^\s#]+\s*)+$")


@dataclass(frozen=True)
class CorpusPiece:
    name: str
    slug: str
    opening: str
    closing: str
    fingerprint: str


def _normalise(text: str) -> list[str]:
    return _TOKEN.findall(text.lower())


def _strip(text: str) -> list[str]:
    """Prose lines only: no frontmatter, no hashtag block, no blank lines."""
    body = _FRONTMATTER.sub("", text)
    return [
        line.strip()
        for line in body.split("\n")
        if line.strip() and not _HASHTAG_LINE.match(line)
    ]


def opening_line(text: str) -> str:
    lines = _strip(text)
    return lines[0] if lines else ""


def closing_move(text: str) -> str:
    """The tail, as many lines of it as the configuration counts as a close."""
    lines = _strip(text)
    return "\n".join(lines[-config.REPETITION_CLOSING_LINES :])


def _fingerprint(text: str) -> str:
    return " ".join(_normalise(text))


def slug_of(path: Path | str | None) -> str:
    """The piece's identity, with any language suffix removed.

    `the-half-nobody-put-on-call.md` and `the-half-nobody-put-on-call.en.md` are
    one piece in two forms: the article and the post that announces it. They are
    written to share an opening line, so they are never each other's repetition.
    """
    if path is None:
        return ""
    stem = Path(path).name
    stem = re.sub(r"\.md\Z", "", stem)
    return re.sub(r"\.[a-z]{2}\Z", "", stem)


def _read(path: Path) -> CorpusPiece | None:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    if not text.strip():
        return None
    return CorpusPiece(
        name=str(path),
        slug=slug_of(path),
        opening=opening_line(text),
        closing=closing_move(text),
        fingerprint=_fingerprint(text),
    )


def load_corpus(extra_dirs: list[Path] | None = None) -> list[CorpusPiece]:
    """Published pieces, goldens included. Sorted so the report is stable."""
    directories = [
        config.GOLDENS_DIR / "articles",
        config.GOLDENS_DIR / "posts",
        config.CONTENT_DIR,
        *(extra_dirs or []),
    ]
    pieces: list[CorpusPiece] = []
    for directory in directories:
        if not directory.exists():
            continue
        for path in sorted(directory.rglob("*.md")):
            piece = _read(path)
            if piece is not None:
                pieces.append(piece)
    return pieces


def _ratio(left: str, right: str) -> float:
    a, b = _normalise(left), _normalise(right)
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def check_repetition(
    text: str, corpus: list[CorpusPiece] | None = None, path: Path | str | None = None
) -> list[GateResult]:
    """The opener and the close, each against the whole corpus.

    Two kinds of corpus entry are dropped first. One whose whole normalised text
    equals the candidate's is the candidate itself — a golden being re-gated, or
    the published copy of the file under test. One that shares the candidate's
    slug is the same piece in its other form; comparing either with itself
    measures nothing.
    """
    pieces = load_corpus() if corpus is None else corpus
    own = _fingerprint(text)
    own_slug = slug_of(path)
    pieces = [
        p for p in pieces if p.fingerprint != own and not (own_slug and p.slug == own_slug)
    ]

    if not pieces:
        note = "no published piece to compare against; the corpus was empty"
        return [
            passed(gate, note, measured=0.0, limit=config.REPETITION_SIMILARITY_THRESHOLD, note=note)
            for gate in ("repetition.opening", "repetition.closing")
        ]

    return [
        _compare("repetition.opening", "opening line", opening_line(text), pieces, lambda p: p.opening),
        _compare("repetition.closing", "closing move", closing_move(text), pieces, lambda p: p.closing),
    ]


def _compare(
    gate: str,
    label: str,
    candidate: str,
    pieces: list[CorpusPiece],
    select: Callable[[CorpusPiece], str],
) -> GateResult:
    """The closest piece wins; ties break on the name, so the report is stable."""
    limit = config.REPETITION_SIMILARITY_THRESHOLD
    scored = sorted(
        ((_ratio(candidate, select(p)), p) for p in pieces),
        key=lambda pair: (-pair[0], pair[1].name),
    )
    best, closest = scored[0]
    if best > limit:
        return failed(
            gate,
            f"{label} is {best:.2f} similar to {closest.name}, limit {limit:.2f}",
            measured=best,
            limit=limit,
            detail={"matched": closest.name, "candidate": candidate, "against": select(closest)},
        )
    return passed(
        gate,
        f"{label} is at most {best:.2f} similar to the corpus ({len(pieces)} pieces), limit {limit:.2f}",
        measured=best,
        limit=limit,
        detail={"closest": closest.name},
    )
