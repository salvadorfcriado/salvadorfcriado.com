"""The `Stop` hook: the interactive entry point's enforcement of the gates.

Claude Code runs this when the agent tries to finish a turn. It reads the active
run's state file, shells out to the gate CLI for the artefact the current stage
produces, and translates the exit code into the hook's JSON contract:
`{"decision": "block", "reason": ...}` while gates fail, an empty object to
allow. The reason is `GateReport.reason_text()` verbatim — measured values
against named limits, which is the revision signal; a summary is not.

Nothing else happens here. Attempt counting, stage advancement and halting are
the driver's; every gate is the CLI's. A hook is the hardest thing in this
repository to test, so it holds the least worth testing.

It fails open, always. A hook that blocks on its own bug traps the operator in a
turn they cannot end, which is worse than a gate that silently did not run: the
driver re-checks the same artefact before it publishes anything. So every
unexpected condition — no active run, a corrupt state file, a missing gate CLI,
a timeout — is logged to stderr and allows.
"""

from __future__ import annotations

import json
import os
import shlex
import subprocess
import sys
from pathlib import Path
from typing import Any

# Claude Code invokes this as a script, not as a module, so the repository root
# is not on the path and `agent` would not import.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from agent import config  # noqa: E402
from agent import state as state_mod  # noqa: E402
from agent.gates import GateReport  # noqa: E402

# Process protocol of `python -m agent.gates.run`, not thresholds: pass, gates
# failed, usage error. Anything else is a crash and is treated as one.
GATE_EXIT_PASS = 0
GATE_EXIT_FAIL = 1
GATE_EXIT_USAGE = 2

# Which gate measures what a stage produced, as (kind, lang) for the CLI. A
# stage absent from this map produces no gated text — `plan` writes an outline,
# `critique` a verdict, `package` and `publish` move text that was already
# gated — and the hook allows. Keys are `config.STAGES` members; the driver
# keeps the matching `gate_reports` keys.
GATED_STAGES: dict[str, tuple[str, str | None]] = {
    "write": ("article", None),
    "revise": ("article", None),
    "post_en": ("post", "en"),
    "post_es": ("post", "es"),
}

ALLOW: dict[str, Any] = {}


def _log(message: str) -> None:
    print(f"stop_gate: {message}", file=sys.stderr)


def _active_slug() -> str | None:
    """`AGENT_ACTIVE_SLUG` first, the most recently updated state file second.

    The environment variable is authoritative because more than one run can be
    open at a time and modification time would then gate the wrong one. It is
    set by whoever starts the Claude Code process — the headless backend on the
    child it spawns, or the operator on the interactive session — because a hook
    reads the environment of the process it was launched from, and a shell
    command inside a turn cannot reach it.

    Modification time is the fallback, and the ordinary case: the driver saves
    the state file at every stage, so the run being worked on is the run that
    was written last.
    """
    slug = os.environ.get("AGENT_ACTIVE_SLUG", "").strip()
    if slug:
        return slug
    paths = [state_mod.state_path(s) for s in state_mod.list_runs()]
    if not paths:
        return None
    return max(paths, key=lambda p: p.stat().st_mtime).parent.name


def _artefact_path(run: state_mod.RunState) -> Path | None:
    """The file the gate CLI reads for the current stage.

    The driver may record the artefact either as a path or as the prose itself
    (`state.artifacts` holds each stage's own shape). Prose is materialised into
    the run's own state directory — deterministic rather than a temporary file,
    so a blocked operator can open exactly what the gates measured.
    """
    record = run.artifacts.get(run.stage)
    if isinstance(record, dict):
        recorded = record.get("path")
        return Path(recorded) if recorded else None
    if not isinstance(record, str) or not record.strip():
        return None
    candidate = Path(record)
    if candidate.suffix and candidate.exists():
        return candidate
    path = config.STATE_DIR / run.slug / f"{run.stage}.candidate.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(record, encoding="utf-8")
    return path


def _gate_command(kind: str, lang: str | None, path: Path) -> list[str]:
    # `AGENT_GATE_CMD` exists so the test suite can point the hook at a stub and
    # stay free of a build and a model. Nothing in the pipeline sets it.
    override = os.environ.get("AGENT_GATE_CMD")
    base = shlex.split(override) if override else [sys.executable, "-m", "agent.gates.run"]
    command = [*base, "--kind", kind, "--file", str(path)]
    if lang:
        command += ["--lang", lang]
    return command


def decide() -> dict[str, Any]:
    slug = _active_slug()
    if not slug:
        return ALLOW

    run = state_mod.RunState.load(slug)
    if run.finished or run.stage == "done":
        return ALLOW

    gated = GATED_STAGES.get(run.stage)
    if gated is None:
        return ALLOW

    # The cap is the driver's to enforce; it halts and hands the operator the
    # outstanding report. The hook stands down at the same point so a run that
    # cannot pass its gates does not become a turn that cannot end.
    if run.attempts_exhausted(run.stage):
        _log(f"attempt cap reached on stage {run.stage!r}; the driver halts this run")
        return ALLOW

    path = _artefact_path(run)
    if path is None:
        _log(f"stage {run.stage!r} has produced no text yet")
        return ALLOW

    kind, lang = gated
    proc = subprocess.run(
        _gate_command(kind, lang, path),
        cwd=str(config.REPO_ROOT),
        capture_output=True,
        text=True,
        timeout=config.BUILD_TIMEOUT_SECONDS,
    )
    if proc.returncode == GATE_EXIT_PASS:
        return ALLOW
    if proc.returncode != GATE_EXIT_FAIL:
        _log(f"gate CLI exited {proc.returncode}: {proc.stderr.strip()}")
        return ALLOW

    report = GateReport.from_dict(json.loads(proc.stdout))
    return {"decision": "block", "reason": report.reason_text()}


def main() -> int:
    try:
        # The event payload is read because the contract says the hook is fed
        # one, and used for nothing: the decision comes from the state file and
        # the gate CLI, never from the transcript the model just wrote.
        sys.stdin.read()
    except Exception:  # noqa: BLE001 - see the module docstring: fail open.
        pass

    try:
        decision = decide()
    except Exception as exc:  # noqa: BLE001 - see the module docstring: fail open.
        _log(f"allowing the turn to end after an unexpected error: {exc!r}")
        decision = ALLOW

    print(json.dumps(decision))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
