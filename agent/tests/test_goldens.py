"""The golden-set regression.

The goldens are the brake on the gates. Every gate change runs against work the
operator already produced and stands behind; a gate that rejects a published
article is a miscalibrated gate, and this file is where that is said out loud.

No model is invoked here. That is what makes it cheap enough to run on every
change, and it is asserted rather than assumed.

── Declared deviations ──────────────────────────────────────────────────────
The three golden POSTS are drafts, not published posts, and they predate rules
the operator adopted on 2026-08-24 (the em-dash ceiling, the body floor, the
hook word limit). Editing someone's drafts so they pass and then calling them
"operator-approved goldens" would be fabricating an approval, so instead each
known violation is declared in `manifest.json` with the rule it breaks and why.

A declared deviation is not a waiver of the gate. The assertion is exact: a
golden must fail EXACTLY its declared deviations. A new failure fails the suite,
and a declared deviation that stops firing also fails the suite — a stale
exception is how a golden set quietly stops being a brake.
"""

from __future__ import annotations

import json
import subprocess
import sys

import pytest

from agent import config

MANIFEST = json.loads((config.GOLDENS_DIR / "manifest.json").read_text(encoding="utf-8"))
ARTICLES = MANIFEST["articles"]
POSTS = MANIFEST["posts"]


def run_gates(kind: str, path, lang: str | None = None) -> dict:
    """Drive the gate CLI exactly as the hook and the driver do."""
    argv = [sys.executable, "-m", "agent.gates.run", "--kind", kind, "--file", str(path), "--no-build"]
    if lang:
        argv += ["--lang", lang]
    proc = subprocess.run(argv, cwd=config.REPO_ROOT, capture_output=True, text=True)
    assert proc.returncode in (0, 1), f"gate CLI errored: {proc.returncode}\n{proc.stderr}"
    return json.loads(proc.stdout)


def failing_gate_ids(report: dict) -> set[str]:
    return {f["gate"] for f in report["failures"]}


@pytest.mark.parametrize("entry", ARTICLES, ids=[a["file"] for a in ARTICLES])
def test_golden_article_passes_every_gate(entry):
    """A published, live article passes the article gates unchanged.

    These three are the real thing: they are on the site, they were approved,
    and nothing about them was adjusted to satisfy a gate. If one starts
    failing, the gate moved, not the article.
    """
    report = run_gates("article", config.GOLDENS_DIR / entry["file"])
    declared = set(entry.get("deviations", {}))
    actual = failing_gate_ids(report)
    assert actual == declared, (
        f"{entry['file']}\n"
        f"  unexpected failures: {sorted(actual - declared)}\n"
        f"  declared but no longer firing: {sorted(declared - actual)}\n"
        f"  messages: {[f['message'] for f in report['failures']]}"
    )


@pytest.mark.parametrize("entry", POSTS, ids=[p["file"] for p in POSTS])
def test_golden_post_fails_exactly_its_declared_deviations(entry):
    report = run_gates("post", config.GOLDENS_DIR / entry["file"], lang=entry["lang"])
    declared = set(entry.get("deviations", {}))
    actual = failing_gate_ids(report)
    assert actual == declared, (
        f"{entry['file']}\n"
        f"  unexpected failures: {sorted(actual - declared)}\n"
        f"  declared but no longer firing: {sorted(declared - actual)}\n"
        f"  messages: {[f['message'] for f in report['failures']]}"
    )


def test_every_declared_deviation_carries_a_reason():
    """A deviation without a stated reason is a waiver wearing a disguise."""
    for entry in ARTICLES + POSTS:
        for gate, reason in entry.get("deviations", {}).items():
            assert reason.strip(), f"{entry['file']}: deviation {gate} has no reason"


def test_the_suite_invokes_no_model(monkeypatch):
    """The golden regression is free to run. Prove it rather than claim it."""
    import agent.backends as backends

    def refuse(name):
        raise AssertionError(f"a golden test reached for the {name!r} backend")

    monkeypatch.setattr(backends, "get_backend", refuse)
    for entry in ARTICLES:
        run_gates("article", config.GOLDENS_DIR / entry["file"])
