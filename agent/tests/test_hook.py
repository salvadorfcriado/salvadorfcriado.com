"""The `Stop` hook, driven the way Claude Code drives it: a subprocess, an event
on stdin, a JSON decision on stdout.

The hook is the one component here that cannot be unit tested honestly — it is
defined by a process contract — so it is exercised through that contract and
nothing else. The gate CLI is stubbed: what the gates decide is `test_gates.py`
and `test_cli.py`; what this file asserts is only the translation, and above all
that every ambiguous case allows the turn to end.

Isolation: the subprocess gets a `sitecustomize` that repoints
`config.STATE_DIR` at a temporary directory before the hook imports anything, so
no test touches the operator's real runs.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from agent import config
from agent import state as state_mod
from agent.gates import GateReport, failed

HOOK = config.AGENT_DIR / "hooks" / "stop_gate.py"

# Stands in for `python -m agent.gates.run`. Its verdict is read from the
# environment so a case chooses it without a build, a model or a network.
GATE_STUB = '''
import json, os, sys
mode = os.environ["STUB_MODE"]
if mode == "pass":
    sys.exit(0)
if mode == "usage":
    print("bad usage", file=sys.stderr)
    sys.exit(2)
if mode == "crash":
    print("boom", file=sys.stderr)
    sys.exit(70)
print(os.environ["STUB_REPORT"])
sys.exit(1)
'''

SITECUSTOMIZE = '''
import os
from agent import config
config.STATE_DIR = __import__("pathlib").Path(os.environ["TEST_STATE_DIR"])
'''


@pytest.fixture
def sandbox(tmp_path, monkeypatch):
    """A temporary state directory, shared by this process and the subprocess."""
    state_dir = tmp_path / "state"
    state_dir.mkdir()
    monkeypatch.setattr(config, "STATE_DIR", state_dir)

    (tmp_path / "sitecustomize.py").write_text(SITECUSTOMIZE, encoding="utf-8")
    (tmp_path / "gate_stub.py").write_text(GATE_STUB, encoding="utf-8")
    return tmp_path


def run_hook(sandbox, *, mode="pass", report=None, slug=None):
    env = {
        **os.environ,
        "TEST_STATE_DIR": str(sandbox / "state"),
        "PYTHONPATH": os.pathsep.join([str(sandbox), str(config.REPO_ROOT)]),
        "AGENT_GATE_CMD": f"{sys.executable} {sandbox / 'gate_stub.py'}",
        "STUB_MODE": mode,
        "STUB_REPORT": json.dumps(report or {}),
    }
    env.pop("AGENT_ACTIVE_SLUG", None)
    if slug:
        env["AGENT_ACTIVE_SLUG"] = slug

    proc = subprocess.run(
        [sys.executable, str(HOOK)],
        input=json.dumps({"hook_event_name": "Stop", "stop_hook_active": False}),
        capture_output=True,
        text=True,
        env=env,
        timeout=60,
    )
    assert proc.returncode == 0, proc.stderr
    return json.loads(proc.stdout), proc.stderr


def make_run(sandbox, *, stage="post_en", attempts=None, text="draft body"):
    run = state_mod.RunState.create(topic="a topic", slug="test-run")
    run.stage = stage
    draft = sandbox / "draft.md"
    draft.write_text(text, encoding="utf-8")
    run.artifacts[stage] = {"path": str(draft)}
    run.attempts = attempts or {}
    run.save()
    return run


HOOK_LIMIT = config.POST_HOOK_MAX_CHARS
HOOK_MEASURED = HOOK_LIMIT * 2
HOOK_MESSAGE = f"hook is {HOOK_MEASURED} characters, limit {HOOK_LIMIT}"
OPENER_MESSAGE = "banned opener: Here's the thing:"


def failing_report() -> dict:
    report = GateReport(kind="post", lang="en", path="draft.md")
    report.add(
        failed("post.hook_chars", HOOK_MESSAGE, measured=HOOK_MEASURED, limit=HOOK_LIMIT)
    )
    report.add(failed("antislop.opener", OPENER_MESSAGE))
    return report.to_dict()


# ── Blocking ────────────────────────────────────────────────────────────────


def test_failing_gates_block_with_the_per_gate_messages(sandbox):
    make_run(sandbox)
    report = failing_report()
    decision, _ = run_hook(sandbox, mode="fail", report=report)

    assert decision["decision"] == "block"
    assert decision["reason"] == GateReport.from_dict(report).reason_text()
    # The literal messages, not a summary: this is the revision signal.
    assert HOOK_MESSAGE in decision["reason"]
    assert OPENER_MESSAGE in decision["reason"]
    assert "[post.hook_chars]" in decision["reason"]


def test_the_named_run_wins_over_the_most_recent_one(sandbox):
    make_run(sandbox)
    decision, _ = run_hook(sandbox, mode="fail", report=failing_report(), slug="test-run")
    assert decision["decision"] == "block"


# ── Allowing ────────────────────────────────────────────────────────────────


def test_passing_gates_allow(sandbox):
    make_run(sandbox)
    decision, _ = run_hook(sandbox, mode="pass")
    assert decision == {}


def test_no_active_run_allows(sandbox):
    decision, _ = run_hook(sandbox, mode="fail", report=failing_report())
    assert decision == {}


def test_attempt_cap_reached_allows(sandbox):
    # The driver halts and hands the operator the report; the hook must not
    # leave them in a turn that cannot end.
    make_run(sandbox, attempts={"post_en": config.MAX_STAGE_ATTEMPTS})
    decision, stderr = run_hook(sandbox, mode="fail", report=failing_report())
    assert decision == {}
    assert "attempt cap" in stderr


def test_stage_with_no_gated_text_allows(sandbox):
    make_run(sandbox, stage="plan")
    decision, _ = run_hook(sandbox, mode="fail", report=failing_report())
    assert decision == {}


def test_finished_run_allows(sandbox):
    run = make_run(sandbox)
    run.stage = "done"
    run.finished = True
    run.save()
    decision, _ = run_hook(sandbox, mode="fail", report=failing_report())
    assert decision == {}


def test_stage_without_an_artefact_allows(sandbox):
    run = make_run(sandbox)
    run.artifacts = {}
    run.save()
    decision, stderr = run_hook(sandbox, mode="fail", report=failing_report())
    assert decision == {}
    assert "no text yet" in stderr


@pytest.mark.parametrize("mode", ["usage", "crash"])
def test_a_broken_gate_cli_allows_and_is_logged(sandbox, mode):
    make_run(sandbox)
    decision, stderr = run_hook(sandbox, mode=mode)
    assert decision == {}
    assert "gate CLI exited" in stderr


def test_corrupt_state_file_allows_and_reports_on_stderr(sandbox):
    path = Path(sandbox / "state" / "test-run" / "state.json")
    path.parent.mkdir(parents=True)
    path.write_text("{ not json", encoding="utf-8")

    decision, stderr = run_hook(sandbox, mode="fail", report=failing_report())
    assert decision == {}
    assert stderr.strip()


def test_prose_artefact_is_materialised_for_the_gate(sandbox):
    # The driver may record the draft as text rather than as a path. The gate
    # CLI takes a file, so the hook writes one next to the state file.
    run = make_run(sandbox)
    run.artifacts["post_en"] = "a body with no path"
    run.save()

    decision, _ = run_hook(sandbox, mode="fail", report=failing_report())
    assert decision["decision"] == "block"
    candidate = sandbox / "state" / "test-run" / "post_en.candidate.md"
    assert candidate.read_text(encoding="utf-8") == "a body with no path"
