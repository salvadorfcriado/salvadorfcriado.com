"""The tag vocabulary, read from the site's own source of truth.

`src/tags.ts` feeds the content schema's enum. Restating the slugs in Python
would create a second vocabulary that drifts from the first in silence, so this
module parses them out of the TypeScript instead: a tag added to `src/tags.ts`
is accepted by the gate with no edit here.

Only the `TAGS` array is read. The file carries a reserve vocabulary in a
comment above it — deliberately not in the enum — and a parser that swept the
whole file would admit slugs the build rejects.
"""

from __future__ import annotations

import re
from pathlib import Path

from .. import config
from . import GateResult, failed, passed

__all__ = ["vocabulary", "check_tags", "TagVocabularyError"]

# `export const TAGS = [ ... ] as const` — non-greedy to the first `as const`,
# which is what keeps the reserve-vocabulary comment out of the match.
_TAGS_BLOCK = re.compile(r"export\s+const\s+TAGS\s*=\s*\[(?P<body>.*?)\]\s*as\s+const", re.S)
_SLUG = re.compile(r"""\bslug\s*:\s*['"](?P<slug>[^'"]+)['"]""")


class TagVocabularyError(RuntimeError):
    """`src/tags.ts` is missing or its TAGS array cannot be located."""


def vocabulary(source: Path | None = None) -> tuple[str, ...]:
    """The declared slugs, in declaration order — which is the vocabulary order."""
    path = Path(source) if source is not None else config.TAGS_SOURCE
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise TagVocabularyError(f"cannot read the tag vocabulary at {path}: {exc}") from exc

    block = _TAGS_BLOCK.search(text)
    if block is None:
        raise TagVocabularyError(f"no `export const TAGS = [...] as const` block in {path}")

    slugs = tuple(m.group("slug") for m in _SLUG.finditer(block.group("body")))
    if not slugs:
        raise TagVocabularyError(f"the TAGS block in {path} declares no slugs")
    return slugs


def check_tags(tags: object, source: Path | None = None) -> list[GateResult]:
    """Vocabulary membership and count, as two separate verdicts.

    They fail for different reasons and are fixed by different edits, so they
    are not collapsed into one message.
    """
    known = vocabulary(source)

    if not isinstance(tags, list) or not all(isinstance(t, str) for t in tags):
        return [
            failed(
                "article.tag_vocabulary",
                f"`tags` is {type(tags).__name__}, expected a list of slugs from {list(known)}",
                measured=type(tags).__name__,
                limit="list[str]",
            )
        ]

    results = []

    unknown = [t for t in tags if t not in known]
    if unknown:
        results.append(
            failed(
                "article.tag_vocabulary",
                f"tag(s) {unknown} are not in src/tags.ts; the vocabulary is {list(known)}",
                measured=unknown,
                limit=list(known),
                detail={"declared": list(tags), "unknown": unknown, "vocabulary": list(known)},
            )
        )
    else:
        results.append(
            passed(
                "article.tag_vocabulary",
                f"all {len(tags)} tag(s) are in src/tags.ts",
                measured=list(tags),
                limit=list(known),
            )
        )

    count = len(tags)
    band = f"{config.ARTICLE_MIN_TAGS}-{config.ARTICLE_MAX_TAGS}"
    if count < config.ARTICLE_MIN_TAGS or count > config.ARTICLE_MAX_TAGS:
        results.append(
            failed(
                "article.tag_count",
                f"{count} tags, allowed {band}",
                measured=count,
                limit=band,
                detail={"declared": list(tags)},
            )
        )
    else:
        results.append(
            passed("article.tag_count", f"{count} tags, allowed {band}", measured=count, limit=band)
        )

    return results
