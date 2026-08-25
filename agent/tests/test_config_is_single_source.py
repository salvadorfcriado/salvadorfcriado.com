"""No threshold literal survives outside `agent/config.py`.

The rule this enforces is the one that makes "raise the post maximum" a
one-file change: a gate, a report message and a prompt all read the value, none
of them restates it.

What it catches: any number declared as a threshold in `config.py` reappearing
as a bare numeric literal in a gate, a backend, a hook, the driver, or a prompt
file. It names the file, the line and the value.

What it does NOT catch, deliberately, because the false-positive rate would make
the test useless and therefore ignored:

* values of 2 or less — 0, 1 and 2 are indices, arities and empty-set limits far
  more often than they are thresholds;
* numbers inside a slice (`[:80]`), a regular-expression quantifier (`{1,6}`) or
  a unicode escape (`\\u2600`), which are structure rather than policy;
* lines that handle an HTTP status, where 200 is the protocol's number and not
  the repository's;
* a threshold spelled out in words ("fourteen hundred characters") in a prompt.
  Nothing stops that; only review does.
"""

from __future__ import annotations

import re
from pathlib import Path

from agent import config

# 0, 1 and 2 carry no information as evidence of a restated threshold.
IGNORED_BELOW = 3

# Structure, not policy. Masked out before the scan rather than filtered after,
# so a threshold that happens to sit next to one is still found.
_MASKS = (
    re.compile(r"\[\s*-?\d*\s*:\s*-?\d*\s*\]"),   # slices: [:80], [-3:]
    re.compile(r"\{\s*\d+\s*(?:,\s*\d*\s*)?\}"),  # regex quantifiers: {1,6}
    re.compile(r"\\[uU][0-9A-Fa-f]{4,8}"),        # unicode escapes
)

_STATUS_LINE = re.compile(r"status", re.IGNORECASE)

# A bare number: not part of an identifier, a dotted attribute or a version.
_NUMBER = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?)(?![\w.])")


def declared_thresholds() -> dict[float, list[str]]:
    """Every numeric value config declares, mapped back to the names that hold it."""
    found: dict[float, list[str]] = {}

    def record(value, name) -> None:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return
        if abs(value) < IGNORED_BELOW:
            return
        found.setdefault(float(value), []).append(name)

    for name, value in vars(config).items():
        if name.startswith("_") or not name.isupper():
            continue
        if isinstance(value, dict):
            for key, nested in value.items():
                if isinstance(nested, dict):
                    for inner_key, inner in nested.items():
                        record(inner, f"{name}[{key!r}][{inner_key!r}]")
                else:
                    record(nested, f"{name}[{key!r}]")
        else:
            record(value, name)
    return found


def scanned_files() -> list[Path]:
    skipped = {".venv", "__pycache__", "tests", "goldens", "state", "node_modules"}
    files = [
        path
        for path in sorted(config.AGENT_DIR.rglob("*.py"))
        if not skipped & set(path.parts) and path.name != "config.py"
    ]
    if config.PROMPTS_DIR.exists():
        files += sorted(config.PROMPTS_DIR.rglob("*.md"))
    return files


def literals_in(path: Path) -> list[tuple[int, float, str]]:
    found = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if _STATUS_LINE.search(line):
            continue
        masked = line
        for mask in _MASKS:
            masked = mask.sub(" ", masked)
        for hit in _NUMBER.finditer(masked):
            found.append((number, float(hit.group(1)), line.strip()))
    return found


def test_config_declares_something_to_check():
    thresholds = declared_thresholds()
    assert config.POST_BODY_MAX_CHARS in thresholds
    assert config.ARTICLE_MAX_EM_DASHES_PER_100_WORDS not in thresholds, "below the ignore floor"
    assert len(thresholds) > len(config.STAGES)


def test_the_scan_covers_the_gates_and_the_prompts():
    names = {path.name for path in scanned_files()}
    assert {"antislop.py", "post.py", "article.py", "tags.py", "repetition.py", "build.py", "run.py"} <= names
    assert "config.py" not in names
    assert not any(".venv" in str(path) for path in scanned_files())


def test_no_threshold_literal_appears_outside_config():
    thresholds = declared_thresholds()
    offences = []
    for path in scanned_files():
        for line_number, value, line in literals_in(path):
            if value in thresholds:
                names = ", ".join(thresholds[value])
                shown = int(value) if value.is_integer() else value
                offences.append(
                    f"{path.relative_to(config.REPO_ROOT)}:{line_number}: {shown} is "
                    f"config.{names}; import it instead\n    {line}"
                )
    assert not offences, "threshold literal(s) restated outside config.py:\n" + "\n".join(offences)
