"""The driver: one linear state machine over the stages declared in `config.STAGES`.

This module deliberately replaces an orchestration framework. The flow is linear
with two bounded loops, so checkpointing is a JSON file, human-in-the-loop is an
approval field, and a conditional edge is an `if`. The interesting engineering in
this repository is `agent/gates/`; this file only orders the work and refuses to
let a model reorder it.

The stage sequence is the table at the bottom, and `STAGE_TABLE` is asserted at
import time to be exactly `config.STAGES`. Nothing here reads a stage name out of
a model response: a model can propose skipping the critique and the critique
still runs, because `RunState.advance()` is the only thing that moves the run and
it walks the declared tuple.

Both entry points sit on top of this module. The Claude Code skill presents and
collects; the CLI below prints and parses. Neither owns any stage logic.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from . import config
from .backends import BackendError, BackendUnavailable, extract_json
from .backends import for_stage as _default_backend_for_stage
from .gates import GateReport
from .state import RunState, StateError, list_runs

__all__ = [
    "Stage",
    "STAGE_TABLE",
    "DriverError",
    "advance_run",
    "pending_approval",
    "record_decision",
    "run_gates",
    "main",
]

# What the driver sends for a runtime placeholder that has no value this round.
# `agent/prompts.py` documents these as "a statement that there was none": an
# empty substitution reads to a model as a truncated prompt.
NO_BRIEF = "The operator gave no brief beyond the topic."
NO_OPERATOR_FEEDBACK = "The operator has not asked for any change."
NO_CRITIQUE = "No critique has been recorded yet."
NO_GATE_REPORT = "The gates have not run on this stage yet."
NO_GATE_FAILURES = "Every gate passed on the previous attempt."

EXIT_OK = 0
EXIT_HALTED = 1
EXIT_USAGE = 2

# The gate CLI's own exit codes, as documented in `agent/gates/run.py`.
GATE_EXIT_PASS = 0
GATE_EXIT_FAIL = 1


class DriverError(RuntimeError):
    """The run cannot proceed and the operator has to act."""


# ── Seams ───────────────────────────────────────────────────────────────────
# The four things the driver does not implement: the model, the prompts, the
# gates and the publishing sequence. Each is one delegating call, so nothing
# here duplicates them and a test can substitute any of them.


def backend_for(stage: str):
    return _default_backend_for_stage(stage)


def render_prompt(stage: str, **context: Any) -> str:
    # Imported at call time so the driver stays importable on its own, and so
    # prompt loading has exactly one implementation.
    from . import prompts

    return prompts.render_stage(stage, **context)


def lang_context(lang: str) -> dict[str, Any]:
    """The overridden band and blacklist a post prompt is rendered with."""
    from . import prompts

    return prompts.lang_context(lang)


def publish_run(state: RunState) -> Any:
    from . import publish

    return publish.publish(state)


def run_gates(kind: str, lang: str | None, path: Path, *, build: bool = True) -> dict[str, Any]:
    """Shell out to the gate CLI and return its JSON report.

    A process boundary with an exit code is the one interface a `Stop` hook, this
    driver and a pytest case all consume unchanged — and the one a model cannot
    satisfy by asserting that it checked.
    """
    cmd = [
        sys.executable,
        "-m",
        "agent.gates.run",
        "--kind",
        kind,
        "--file",
        str(path),
        "--json-only",
    ]
    if lang:
        cmd += ["--lang", lang]
    if not build:
        cmd.append("--no-build")
    proc = subprocess.run(cmd, cwd=str(config.REPO_ROOT), capture_output=True, text=True)
    if proc.returncode not in (GATE_EXIT_PASS, GATE_EXIT_FAIL):
        raise DriverError(f"gate CLI usage error ({proc.returncode}): {proc.stderr.strip()}")
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise DriverError(f"gate CLI printed no JSON report: {proc.stdout[:400]!r}") from exc


# ── The stage table ─────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Stage:
    """One declared stage, as data.

    `store`/`key` say where the stage's result lands on the state; `gate_*` say
    which gate CLI invocation decides whether it may complete; `critique_key`
    marks the stage whose acceptance also depends on the critic's score. The
    approval point is not a field here — it lives in `config.APPROVAL_POINTS`,
    keyed by stage name, so there is one declaration of it.
    """

    name: str
    handler: Callable[[RunState], Any]
    store: str
    key: str
    gate_kind: str | None = None
    gate_lang: str | None = None
    gate_key: str | None = None
    build_gate: bool = False
    critique_key: str | None = None


def _stored(state: RunState, entry: Stage) -> Any:
    return getattr(state, entry.store).get(entry.key)


def _store(state: RunState, entry: Stage, value: Any) -> None:
    getattr(state, entry.store)[entry.key] = value


def _discard(state: RunState, entry: Stage) -> None:
    """Drop everything a stage produced so that it regenerates."""
    getattr(state, entry.store).pop(entry.key, None)
    if entry.gate_key:
        state.gate_reports.pop(entry.gate_key, None)
    if entry.critique_key:
        state.critiques.pop(entry.critique_key, None)


def _satisfied(state: RunState, entry: Stage) -> bool:
    """Whether the stage's work is already accepted, so a resume does not redo it."""
    if _stored(state, entry) is None:
        return False
    if entry.gate_key and not state.gates_passing(entry.gate_key):
        return False
    if entry.critique_key:
        total = (state.critiques.get(entry.critique_key) or {}).get("total")
        if total is None or total < config.CRITIC_SCORE_FLOOR:
            return False
    return True


# ── Stage handlers ──────────────────────────────────────────────────────────


def _complete(stage: str, prompt: str) -> str:
    backend = backend_for(stage)
    usable, reason = backend.available()
    if not usable:
        # Spec: name the backend and the missing prerequisite, and leave the state
        # file where it was. Raised before anything is written, deliberately.
        raise BackendUnavailable(
            f"backend {backend.name!r} for stage {stage!r} is unavailable: {reason}"
        )
    return backend.complete(prompt).text


def _article_text(state: RunState) -> str:
    return state.artifacts.get("revise") or state.artifacts.get("write", "")


def _latest_critique(state: RunState) -> dict[str, Any]:
    return state.critiques.get("revise") or state.critiques.get("write") or {}


def _operator_feedback(state: RunState, stage: str) -> str:
    point = config.APPROVAL_POINTS.get(stage)
    record = state.approval_for(point) if point else None
    if record and record.get("decision") == "revise" and record.get("feedback"):
        return record["feedback"]
    return NO_OPERATOR_FEEDBACK


def _gate_report_text(state: RunState, entry: Stage) -> str:
    """The literal gate failure lines from the last attempt at this stage.

    A measured value against a named limit is the revision signal; self-critique
    without one plateaus after about a round. It goes back verbatim.
    """
    report = state.gate_reports.get(entry.gate_key) if entry.gate_key else None
    if not report:
        return NO_GATE_REPORT
    return GateReport.from_dict(report).reason_text() or NO_GATE_FAILURES


def _context(state: RunState, entry: Stage) -> dict[str, Any]:
    """Every runtime placeholder `agent/prompts.py` documents, for every stage.

    Supplied uniformly rather than per stage: a prompt that does not cite one
    ignores it, and a prompt that starts citing one needs no change here.
    """
    critique = _latest_critique(state)
    context: dict[str, Any] = {
        "TOPIC": state.topic,
        "BRIEF": state.brief or NO_BRIEF,
        "OUTLINE": json.dumps(state.artifacts.get("plan") or {}, indent=2, ensure_ascii=False),
        "ARTICLE": _article_text(state),
        "GATE_REPORT": _gate_report_text(state, entry),
        "OPERATOR_FEEDBACK": _operator_feedback(state, entry.name),
        "CRITIQUE": json.dumps(critique, indent=2, ensure_ascii=False) if critique else NO_CRITIQUE,
    }
    if entry.gate_lang:
        context.update(lang_context(entry.gate_lang))
    return context


def _prompt_for(state: RunState, stage: str, **overrides: Any) -> str:
    context = _context(state, STAGE_TABLE[stage])
    context.update(overrides)
    return render_prompt(stage, **context)


def _critique(state: RunState, key: str, text: str) -> dict[str, Any]:
    """One clean-context critic pass, recorded against the stage it reviewed."""
    verdict = extract_json(_complete("critique", _prompt_for(state, "critique", ARTICLE=text)))
    if not isinstance(verdict, dict) or not isinstance(verdict.get("total"), (int, float)):
        raise BackendError("critic returned no numeric total")
    state.critiques[key] = verdict
    return verdict


def _prose(stage: str) -> Callable[[RunState], str]:
    """The four stages whose output is the text itself."""

    def handler(state: RunState) -> str:
        return _complete(stage, _prompt_for(state, stage)).strip()

    return handler


def _plan(state: RunState) -> dict[str, Any]:
    outline = extract_json(_complete("plan", _prompt_for(state, "plan")))
    if not isinstance(outline, dict):
        raise BackendError("plan stage did not return a JSON object")
    return outline


def _critique_stage(state: RunState) -> dict[str, Any]:
    return _critique(state, "write", state.artifacts.get("write", ""))


def _package(state: RunState) -> dict[str, Any]:
    """The manifest the operator approves as one bundle.

    It names what is in the package rather than copying it: every artefact is
    already on the state, and a second copy is a second thing that can disagree.
    """
    return {
        "article": "revise" if "revise" in state.artifacts else "write",
        "posts": ["post_en", "post_es"],
        "gate_reports": sorted(state.gate_reports),
    }


def _publish(state: RunState) -> dict[str, Any] | None:
    """Emit, open the pull request, probe, hand over — and return the handoff.

    `agent/publish.py` withholds the handoff until the article's own URL answers,
    so a first call almost always returns None. That is not a failure and does
    not spend an attempt: the stage stays where it is and a later `resume` picks
    up from the pull request it already opened.
    """
    point = config.APPROVAL_POINTS["package"]
    # The loop already refuses to reach this stage unapproved. Restated here
    # because publishing is the one irreversible step in the pipeline.
    if not state.is_approved(point):
        raise DriverError(f"publish refused: no recorded {point!r} approval")
    result = publish_run(state)
    record = result.to_dict() if hasattr(result, "to_dict") else dict(result)
    # `publish.py` owns `state.publish`; merge so a resumed publish still finds
    # the branch and the pull request it opened.
    state.publish.update({k: v for k, v in record.items() if v is not None})
    return state.publish.get("handoff")


STAGE_TABLE: dict[str, Stage] = {
    entry.name: entry
    for entry in (
        Stage("plan", _plan, store="artifacts", key="plan"),
        Stage(
            "write",
            _prose("write"),
            store="artifacts",
            key="write",
            gate_kind="article",
            gate_key="article",
            build_gate=True,
        ),
        Stage("critique", _critique_stage, store="critiques", key="write"),
        Stage(
            "revise",
            _prose("revise"),
            store="artifacts",
            key="revise",
            gate_kind="article",
            gate_key="article",
            build_gate=True,
            critique_key="revise",
        ),
        Stage(
            "post_en",
            _prose("post_en"),
            store="artifacts",
            key="post_en",
            gate_kind="post",
            gate_lang="en",
            gate_key="post_en",
        ),
        Stage(
            "post_es",
            _prose("post_es"),
            store="artifacts",
            key="post_es",
            gate_kind="post",
            gate_lang="es",
            gate_key="post_es",
        ),
        Stage("package", _package, store="artifacts", key="package"),
        Stage("publish", _publish, store="publish", key="handoff"),
    )
}

if tuple(STAGE_TABLE) != config.STAGES:
    raise RuntimeError(f"stage table {tuple(STAGE_TABLE)} does not match config.STAGES {config.STAGES}")


# ── Acceptance and the retry cap ────────────────────────────────────────────


def _candidate_path(state: RunState, entry: Stage, artifact: str) -> Path:
    """Where the gate CLI reads the candidate from.

    Articles keep the run's slug and `.md` because the build gate places the file
    in `src/content/blog/` and the filename becomes the URL.
    """
    name = f"{state.slug}.md" if entry.gate_kind == "article" else f"{entry.name}.txt"
    path = config.STATE_DIR / state.slug / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(artifact, encoding="utf-8")
    return path


def _accept(state: RunState, entry: Stage, artifact: Any) -> str | None:
    """None when the stage may complete, otherwise the failure text to feed back."""
    if entry.gate_kind:
        report = run_gates(
            entry.gate_kind,
            entry.gate_lang,
            _candidate_path(state, entry, artifact),
            build=entry.build_gate,
        )
        state.record_gate_report(entry.gate_key, report)
        if not report.get("ok"):
            return GateReport.from_dict(report).reason_text()
    if entry.critique_key:
        # Below the floor the run goes back through this same stage, not to the
        # operator: a piece the critic already rejects does not deserve an
        # interruption.
        verdict = _critique(state, entry.critique_key, artifact)
        if verdict["total"] < config.CRITIC_SCORE_FLOOR:
            findings = "\n".join(f"  - {f}" for f in verdict.get("findings", []))
            return (
                f"critic scored {verdict['total']} of {config.CRITIC_SCORE_MAX}, "
                f"below the floor of {config.CRITIC_SCORE_FLOOR}:\n{findings}"
            )
    return None


def _run_stage(state: RunState, entry: Stage) -> None:
    """Generate, gate, retry — bounded by `config.MAX_STAGE_ATTEMPTS`."""
    while True:
        try:
            artifact = entry.handler(state)
        except BackendUnavailable:
            # Nothing is recorded: the spec requires the state file not to advance,
            # so the run is re-runnable unchanged once the prerequisite is fixed.
            raise
        except BackendError as exc:
            failure: str | None = str(exc)
        else:
            failure = _accept(state, entry, artifact)
            if failure is None:
                _store(state, entry, artifact)
                state.note("stage_done", stage=entry.name)
                state.save()
                return
        attempt = state.record_attempt(entry.name)
        state.note("stage_failed", stage=entry.name, attempt=attempt, reason=failure)
        state.save()
        if state.attempts_exhausted(entry.name):
            state.halt(f"{entry.name}: stopped after {attempt} attempts.\n{failure}")
            state.save()
            return


# ── The run loop ────────────────────────────────────────────────────────────


def pending_approval(state: RunState) -> str | None:
    """The approval point the run is waiting on, or None."""
    if state.finished or state.halted_reason:
        return None
    entry = STAGE_TABLE.get(state.stage)
    if entry is None or not _satisfied(state, entry):
        return None
    point = config.APPROVAL_POINTS.get(entry.name)
    return point if point and not state.is_approved(point) else None


def advance_run(state: RunState) -> RunState:
    """Run until the pipeline finishes, halts, or stops for an approval.

    Never blocks on stdin. Headless approval arrives as a separate command; the
    interactive skill calls `record_decision` and then this again.
    """
    while not state.finished:
        if state.halted_reason:
            return state
        entry = STAGE_TABLE[state.stage]
        if not _satisfied(state, entry):
            _run_stage(state, entry)
            if state.halted_reason or not _satisfied(state, entry):
                return state
        if pending_approval(state):
            return state
        state.advance()
        state.save()
    return state


def record_decision(slug: str, point: str, decision: str, feedback: str = "") -> RunState:
    """Write an approval decision, then move the run to where it now belongs.

    The decision is on disk before anything advances, so a crash between the two
    loses at most the resumption, never the operator's answer.
    """
    if point not in config.APPROVAL_POINTS.values():
        raise DriverError(f"unknown approval point {point!r}")
    state = RunState.load(slug)
    state.record_approval(point, decision, feedback=feedback)
    if decision == "reject":
        state.halt(f"rejected by the operator at the {point!r} approval point")
    elif decision == "revise":
        state.clear_halt()
        stage = _stage_for_point(point)
        # Re-enter the generation stage that owns this point, and drop everything
        # downstream of it: the posts and the package derive from the article, so
        # keeping them would ship work assembled from a draft that no longer exists.
        for later in config.STAGES[config.STAGES.index(stage) :]:
            _discard(state, STAGE_TABLE[later])
            # The cap bounds an unattended model loop. An operator re-entering the
            # stage starts a new loop, so the counter starts again with it.
            state.attempts.pop(later, None)
            later_point = config.APPROVAL_POINTS.get(later)
            if later_point and later_point != point:
                state.approvals.pop(later_point, None)
        state.stage = stage
        state.note("stage", stage=stage)
    else:
        state.clear_halt()
    state.save()
    return state


def _stage_for_point(point: str) -> str:
    for stage, name in config.APPROVAL_POINTS.items():
        if name == point:
            return stage
    raise DriverError(f"unknown approval point {point!r}")


# ── CLI ─────────────────────────────────────────────────────────────────────


def _format_status(state: RunState) -> str:
    lines = [
        f"{state.slug}",
        f"  topic     {state.topic}",
        f"  stage     {state.stage}" + ("  (finished)" if state.finished else ""),
    ]
    if state.halted_reason:
        lines.append(f"  HALTED    {state.halted_reason}")
    attempts = ", ".join(f"{s}={n}/{config.MAX_STAGE_ATTEMPTS}" for s, n in state.attempts.items())
    lines.append(f"  attempts  {attempts or 'none'}")
    approvals = ", ".join(
        f"{p}={r['decision']}" + (" (waived)" if r.get("waived") else "")
        for p, r in state.approvals.items()
    )
    lines.append(f"  approvals {approvals or 'none'}")
    gates = ", ".join(
        f"{k}={'pass' if r.get('ok') else 'FAIL'}" for k, r in state.gate_reports.items()
    )
    lines.append(f"  gates     {gates or 'none'}")
    critiques = ", ".join(
        f"{k}={v.get('total')}/{config.CRITIC_SCORE_MAX}" for k, v in state.critiques.items()
    )
    lines.append(f"  critique  {critiques or 'none'}")
    for key, report in state.gate_reports.items():
        if not report.get("ok"):
            lines.append(GateReport.from_dict(report).reason_text())
    if state.publish and not state.publish.get("handoff"):
        probe = state.publish.get("probe") or {}
        lines.append(
            "  publish   the LinkedIn text is withheld until the article URL answers"
            + (f" ({probe.get('url')})" if probe.get("url") else "")
            + f"; merge the pull request, then `piece resume {state.slug}`"
        )
    point = pending_approval(state)
    if point:
        lines.append(
            f"  awaiting the {point!r} approval: "
            f"`piece approve {state.slug} {point}` / "
            f"`piece revise {state.slug} {point} --feedback ...` / "
            f"`piece reject {state.slug} {point}`"
        )
    return "\n".join(lines)


def _drive(state: RunState) -> int:
    try:
        state = advance_run(state)
    except BackendUnavailable as exc:
        print(f"error: {exc}", file=sys.stderr)
        print("the run was not advanced; fix the prerequisite and resume", file=sys.stderr)
        return EXIT_HALTED
    print(_format_status(state))
    return EXIT_HALTED if state.halted_reason else EXIT_OK


def _cmd_run(args: argparse.Namespace) -> int:
    state = RunState.create(args.topic, brief=args.brief or "", slug=args.slug)
    if args.no_outline_approval:
        point = config.APPROVAL_POINTS["plan"]
        state.record_approval(
            point, "approve", feedback="waived by --no-outline-approval", waived=True
        )
        state.save()
    return _drive(state)


def _cmd_resume(args: argparse.Namespace) -> int:
    state = RunState.load(args.slug)
    if args.retry and state.halted_reason:
        state.attempts.pop(state.stage, None)
        state.clear_halt()
        state.note("retry", stage=state.stage)
        state.save()
    return _drive(state)


def _cmd_status(args: argparse.Namespace) -> int:
    print(_format_status(RunState.load(args.slug)))
    return EXIT_OK


def _cmd_list(_args: argparse.Namespace) -> int:
    slugs = list_runs()
    if not slugs:
        print("no runs")
        return EXIT_OK
    for slug in slugs:
        state = RunState.load(slug)
        marker = "halted" if state.halted_reason else ("done" if state.finished else state.stage)
        print(f"{slug}\t{marker}")
    return EXIT_OK


def _cmd_decide(args: argparse.Namespace) -> int:
    # The point is optional because the run already knows which one it is waiting
    # on; naming it is the explicit form the headless entry point prefers.
    point = args.point or pending_approval(RunState.load(args.slug))
    if point is None:
        raise DriverError(f"{args.slug} is not waiting on an approval point")
    state = record_decision(
        args.slug, point, args.decision, feedback=getattr(args, "feedback", "") or ""
    )
    if args.decision == "reject":
        print(_format_status(state))
        return EXIT_HALTED
    return _drive(state)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="piece", description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    points = sorted(set(config.APPROVAL_POINTS.values()))

    run = sub.add_parser("run", help="start a new run from a topic")
    run.add_argument("topic")
    run.add_argument("--brief", default="", help="extra context for the piece")
    run.add_argument("--slug", default=None, help="override the slug derived from the topic")
    run.add_argument(
        "--no-outline-approval",
        action="store_true",
        help="waive the outline approval; the waiver is recorded in the state file",
    )
    run.set_defaults(func=_cmd_run)

    resume = sub.add_parser("resume", help="continue an existing run")
    resume.add_argument("slug")
    resume.add_argument(
        "--retry", action="store_true", help="clear a halt and reset that stage's attempts"
    )
    resume.set_defaults(func=_cmd_resume)

    status = sub.add_parser("status", help="stage, attempts, approvals and gate verdicts")
    status.add_argument("slug")
    status.set_defaults(func=_cmd_status)

    sub.add_parser("list", help="every run on disk").set_defaults(func=_cmd_list)

    for decision, helptext in (
        ("approve", "record approval and continue"),
        ("revise", "record revision feedback and re-enter the generation stage"),
        ("reject", "record a rejection and halt the run"),
    ):
        cmd = sub.add_parser(decision, help=helptext)
        cmd.add_argument("slug")
        cmd.add_argument(
            "point", nargs="?", choices=points, default=None, help="defaults to the pending point"
        )
        if decision == "revise":
            cmd.add_argument("--feedback", required=True, help="what to change, in the operator's words")
        cmd.set_defaults(func=_cmd_decide, decision=decision)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return EXIT_HALTED


if __name__ == "__main__":
    sys.exit(main())
