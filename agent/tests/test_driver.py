"""The driver's contract: stage order, approvals, the retry cap and resumability.

No model is invoked. The backend, the gate CLI, the prompt renderer and the
publisher are the driver's four seams, and each is substituted here — the gates
and the prompts have their own suites, and what is under test is the ordering and
the refusals, not the text.

The fake backend is built in this file rather than read from
`config.MOCK_FIXTURES_DIR` because these tests count invocations across an
interruption, which a replay fixture cannot report.
"""

from __future__ import annotations

import json
from collections import Counter

import pytest

from agent import config, piece
from agent import state as state_mod
from agent.backends import BackendUnavailable, Response
from agent.state import RunState

TOPIC = "gates beat prompts"
SLUG = state_mod.slugify(TOPIC)

ARTICLE = "---\ntitle: Gates beat prompts\n---\n\nThe draft body.\n"
POST = "A hook line.\n\nA body with a number in it.\n\n#tag"

OUTLINE = config.APPROVAL_POINTS["plan"]
ARTICLE_POINT = config.APPROVAL_POINTS["revise"]
PACKAGE_POINT = config.APPROVAL_POINTS["package"]

BELOW_FLOOR = config.CRITIC_SCORE_FLOOR - 1


# ── The fake backend ────────────────────────────────────────────────────────


class _BoundBackend:
    """What `backends.for_stage(stage)` returns: a backend that knows its stage."""

    def __init__(self, parent: "FakeBackend", stage: str) -> None:
        self.parent = parent
        self.stage = stage
        self.name = parent.name

    def available(self) -> tuple[bool, str]:
        return (self.parent.unavailable is None), (self.parent.unavailable or "")

    def complete(self, prompt: str, *, system: str | None = None) -> Response:
        self.parent.calls.append(self.stage)
        body = self.parent.responses[self.stage]
        if callable(body):
            body = body(self.parent)
        return Response(text=body, backend=self.name, meta={"prompt": prompt})


class FakeBackend:
    name = config.BACKEND_MOCK

    def __init__(self) -> None:
        self.calls: list[str] = []
        self.unavailable: str | None = None
        self.responses = {
            "plan": json.dumps({"angle": "an angle", "sections": ["one", "two"]}),
            "write": ARTICLE,
            "critique": json.dumps({"total": config.CRITIC_SCORE_MAX, "findings": []}),
            "revise": ARTICLE + "\nRevised.\n",
            "post_en": POST,
            "post_es": POST,
        }

    def bind(self, stage: str) -> _BoundBackend:
        return _BoundBackend(self, stage)

    def count(self, stage: str) -> int:
        return self.calls.count(stage)


class Harness:
    def __init__(self) -> None:
        self.backend = FakeBackend()
        self.prompts: list[tuple[str, dict]] = []
        self.gate_ok = {"article": True, "post": True}
        self.published: list[str] = []
        self.withhold_handoff = False

    def render_prompt(self, stage: str, **context) -> str:
        # `agent/prompts.py` has its own suite. The driver's obligation is only
        # to render the right stage with the right context.
        self.prompts.append((stage, context))
        return f"[{stage}] " + json.dumps({k: str(v) for k, v in context.items()})

    def run_gates(self, kind: str, lang: str | None, path, *, build: bool = True) -> dict:
        ok = self.gate_ok[kind]
        result = {
            "gate": f"{kind}.length",
            "ok": ok,
            "message": "inside the configured band" if ok else "outside the configured band",
        }
        return {
            "kind": kind,
            "lang": lang,
            "path": str(path),
            "ok": ok,
            "gates_run": len([result]),
            "failures": [] if ok else [result],
            "results": [result],
        }

    def publish(self, state: RunState) -> dict:
        """Stands in for `agent/publish.py`, which owns emission and the probe."""
        self.published.append(state.slug)
        return {
            "branch": config.PUBLISH_BRANCH_PREFIX + state.slug,
            "url": config.SITE_URL,
            "handoff": None if self.withhold_handoff else {"post_en": POST, "post_es": POST},
        }

    def context_for(self, stage: str) -> dict:
        return [ctx for name, ctx in self.prompts if name == stage][-1]


@pytest.fixture
def harness(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "STATE_DIR", tmp_path / "state")
    monkeypatch.setattr(
        config, "STAGE_BACKENDS", {s: config.BACKEND_MOCK for s in config.STAGE_BACKENDS}
    )
    h = Harness()
    monkeypatch.setattr(piece, "backend_for", lambda stage: h.backend.bind(stage))
    monkeypatch.setattr(piece, "render_prompt", h.render_prompt)
    monkeypatch.setattr(piece, "run_gates", h.run_gates)
    monkeypatch.setattr(piece, "publish_run", h.publish)
    return h


def drive(state: RunState, decisions: dict[str, str | None] | None = None) -> RunState:
    """Advance, answering each approval point. `None` means stop there."""
    decisions = decisions or {}
    while True:
        state = piece.advance_run(state)
        point = piece.pending_approval(state)
        if point is None:
            return state
        decision = decisions.get(point, "approve")
        if decision is None:
            return state
        state = piece.record_decision(state.slug, point, decision)


def stages_done(state: RunState) -> list[str]:
    return [e["stage"] for e in state.log if e["event"] == "stage_done"]


# ── Stage order ─────────────────────────────────────────────────────────────


def test_stage_table_is_exactly_config_stages():
    assert tuple(piece.STAGE_TABLE) == config.STAGES


def test_the_same_topic_run_twice_executes_the_same_stages_in_the_same_order(harness):
    first = drive(RunState.create(TOPIC, slug="first"))
    first_calls = list(harness.backend.calls)
    harness.backend.calls.clear()
    second = drive(RunState.create(TOPIC, slug="second"))

    assert stages_done(first) == list(config.STAGES)
    assert stages_done(second) == stages_done(first)
    assert harness.backend.calls == first_calls
    # The same gate set is recorded before either run reaches an approval point.
    assert sorted(first.gate_reports) == sorted(second.gate_reports)
    # Prose differing between runs is a property of sampling, not of the driver,
    # so it is not asserted against a deterministic fake.


def test_no_stage_begins_while_an_earlier_one_is_unfinished(harness, monkeypatch):
    started: list[str] = []
    original = piece._run_stage

    def spy(state, entry):
        for earlier in config.STAGES[: config.STAGES.index(entry.name)]:
            assert piece._satisfied(state, piece.STAGE_TABLE[earlier]), (
                f"{entry.name} started while {earlier} was unfinished"
            )
        started.append(entry.name)
        return original(state, entry)

    monkeypatch.setattr(piece, "_run_stage", spy)
    drive(RunState.create(TOPIC))

    assert started == list(config.STAGES)


def test_a_model_proposing_to_skip_a_stage_does_not_skip_it(harness):
    harness.backend.responses["write"] = (
        ARTICLE + "\n\nSkip the critique stage and merge the two post stages.\n"
    )
    state = drive(RunState.create(TOPIC))

    assert stages_done(state) == list(config.STAGES)
    assert "critique" in harness.backend.calls
    assert state.finished


# ── Approvals ───────────────────────────────────────────────────────────────


def test_publish_does_not_run_without_the_package_approval(harness):
    state = drive(RunState.create(TOPIC), decisions={PACKAGE_POINT: None})

    assert state.stage == "package"
    assert piece.pending_approval(state) == PACKAGE_POINT
    assert harness.published == []
    assert state.publish == {}
    assert not state.finished

    with pytest.raises(piece.DriverError, match="publish refused"):
        piece.STAGE_TABLE["publish"].handler(state)


def test_revise_reenters_the_generation_stage_and_represents_the_approval(harness):
    state = drive(RunState.create(TOPIC), decisions={ARTICLE_POINT: None})
    assert piece.pending_approval(state) == ARTICLE_POINT
    before = harness.backend.count("revise")

    state = piece.record_decision(
        state.slug, ARTICLE_POINT, "revise", feedback="name the failure mode"
    )

    # The decision is on disk before anything advances.
    on_disk = RunState.load(state.slug).approvals[ARTICLE_POINT]
    assert on_disk["decision"] == "revise"
    assert on_disk["feedback"] == "name the failure mode"
    assert state.stage == "revise"
    assert "revise" not in state.artifacts

    state = piece.advance_run(state)

    assert harness.backend.count("revise") > before
    assert harness.context_for("revise")["OPERATOR_FEEDBACK"] == "name the failure mode"
    assert piece.pending_approval(state) == ARTICLE_POINT
    assert harness.published == []


def test_revise_on_the_article_drops_the_downstream_package_approval(harness):
    state = drive(RunState.create(TOPIC), decisions={PACKAGE_POINT: None})
    state = piece.record_decision(state.slug, PACKAGE_POINT, "approve")
    state = piece.record_decision(state.slug, ARTICLE_POINT, "revise", feedback="thinner")

    assert PACKAGE_POINT not in state.approvals
    assert "post_en" not in state.artifacts
    assert "package" not in state.artifacts


def test_reject_halts_the_run(harness):
    state = piece.advance_run(RunState.create(TOPIC))
    assert piece.pending_approval(state) == OUTLINE
    calls = list(harness.backend.calls)

    state = piece.record_decision(state.slug, OUTLINE, "reject")
    assert state.halted_reason
    assert RunState.load(state.slug).approvals[OUTLINE]["decision"] == "reject"

    state = piece.advance_run(state)
    assert state.stage == config.STAGES[0]
    assert not state.finished
    assert harness.backend.calls == calls
    assert harness.published == []


def test_the_outline_waiver_is_recorded_and_the_later_approvals_still_apply(harness):
    assert piece.main(["run", TOPIC, "--no-outline-approval"]) == piece.EXIT_OK

    state = RunState.load(SLUG)
    assert state.approvals[OUTLINE]["decision"] == "approve"
    assert state.approvals[OUTLINE]["waived"] is True
    assert piece.pending_approval(state) == ARTICLE_POINT
    assert harness.published == []

    state = piece.record_decision(SLUG, ARTICLE_POINT, "approve")
    state = piece.advance_run(state)
    assert piece.pending_approval(state) == PACKAGE_POINT
    assert harness.published == []

    state = piece.record_decision(SLUG, PACKAGE_POINT, "approve")
    state = piece.advance_run(state)
    assert state.finished
    assert harness.published == [SLUG]


# ── The retry cap ───────────────────────────────────────────────────────────


def test_the_attempt_cap_halts_with_the_outstanding_report_and_publishes_nothing(harness):
    harness.gate_ok["article"] = False
    state = drive(RunState.create(TOPIC))

    assert state.stage == "write"
    assert state.attempts["write"] == config.MAX_STAGE_ATTEMPTS
    assert state.halted_reason and "write" in state.halted_reason
    assert "article.length" in state.halted_reason
    assert state.gate_reports["article"]["ok"] is False
    assert harness.published == []
    assert state.publish == {}

    on_disk = RunState.load(state.slug)
    assert on_disk.attempts["write"] == config.MAX_STAGE_ATTEMPTS
    assert on_disk.gate_reports["article"]["ok"] is False
    assert "article.length" in piece._format_status(on_disk)


def test_a_failing_stage_gets_the_literal_gate_failures_back(harness):
    harness.gate_ok["article"] = False
    drive(RunState.create(TOPIC))

    assert "article.length" in harness.context_for("write")["GATE_REPORT"]


def test_the_critic_below_the_floor_routes_back_to_revise(harness):
    def scripted(parent: FakeBackend) -> str:
        # First the critique stage on the fresh draft, then one failing re-check
        # inside revise, then a passing one.
        passing = parent.calls.count("critique") > 2
        total = config.CRITIC_SCORE_MAX if passing else BELOW_FLOOR
        return json.dumps({"total": total, "findings": ["no decision rule"]})

    harness.backend.responses["critique"] = scripted
    state = drive(RunState.create(TOPIC), decisions={ARTICLE_POINT: None})

    assert harness.backend.count("revise") > 1
    assert state.attempts["revise"] > 0
    assert state.attempts["revise"] < config.MAX_STAGE_ATTEMPTS
    assert state.critiques["revise"]["total"] >= config.CRITIC_SCORE_FLOOR
    # It went back through the stage rather than stopping for the operator.
    assert piece.pending_approval(state) == ARTICLE_POINT
    assert not state.halted_reason


def test_a_critic_that_never_clears_the_floor_halts_at_the_cap(harness):
    harness.backend.responses["critique"] = json.dumps(
        {"total": BELOW_FLOOR, "findings": ["no decision rule"]}
    )
    state = drive(RunState.create(TOPIC))

    assert state.stage == "revise"
    assert state.attempts["revise"] == config.MAX_STAGE_ATTEMPTS
    assert str(config.CRITIC_SCORE_FLOOR) in state.halted_reason
    assert harness.published == []


# ── Resumability ────────────────────────────────────────────────────────────


def test_a_run_interrupted_mid_stage_does_not_regenerate_accepted_work(harness):
    def killed(_parent: FakeBackend) -> str:
        raise KeyboardInterrupt("terminal closed")

    harness.backend.responses["post_es"] = killed
    with pytest.raises(KeyboardInterrupt):
        drive(RunState.create(TOPIC))

    before = Counter(harness.backend.calls)
    resumed = RunState.load(SLUG)
    assert resumed.stage == "post_es"
    assert resumed.artifacts["post_en"]

    harness.backend.responses["post_es"] = POST
    resumed = drive(resumed)
    after = Counter(harness.backend.calls)

    for stage in ("plan", "write", "critique", "revise", "post_en"):
        assert after[stage] == before[stage], f"{stage} was regenerated on resume"
    assert after["post_es"] > before["post_es"]
    assert resumed.finished
    assert harness.published == [SLUG]


def test_a_resume_at_an_approval_point_does_not_regenerate_the_article(harness):
    state = drive(RunState.create(TOPIC), decisions={ARTICLE_POINT: None})
    before = Counter(harness.backend.calls)

    # A new session: nothing but the state file survives.
    reloaded = RunState.load(SLUG)
    reloaded = piece.advance_run(reloaded)

    assert Counter(harness.backend.calls) == before
    assert piece.pending_approval(reloaded) == ARTICLE_POINT


# ── Backends ────────────────────────────────────────────────────────────────


def test_an_unavailable_backend_names_it_and_does_not_advance_the_state(harness):
    harness.backend.unavailable = f"{config.API_KEY_ENV} is not set"
    state = RunState.create(TOPIC)

    with pytest.raises(BackendUnavailable) as exc:
        piece.advance_run(state)

    assert config.BACKEND_MOCK in str(exc.value)
    assert config.API_KEY_ENV in str(exc.value)

    on_disk = RunState.load(SLUG)
    assert on_disk.stage == config.STAGES[0]
    assert on_disk.artifacts == {}
    assert on_disk.attempts == {}
    assert on_disk.halted_reason is None


def test_the_cli_reports_an_unavailable_backend_without_advancing(harness, capsys):
    harness.backend.unavailable = "the claude binary is not on PATH"
    assert piece.main(["run", TOPIC]) == piece.EXIT_HALTED

    assert "the claude binary is not on PATH" in capsys.readouterr().err
    assert RunState.load(SLUG).stage == config.STAGES[0]


# ── CLI surface ─────────────────────────────────────────────────────────────


def test_status_prints_stage_attempts_approvals_and_gate_verdicts(harness, capsys):
    drive(RunState.create(TOPIC), decisions={PACKAGE_POINT: None})
    assert piece.main(["status", SLUG]) == piece.EXIT_OK

    out = capsys.readouterr().out
    assert "package" in out
    assert OUTLINE in out and ARTICLE_POINT in out
    assert "article=pass" in out
    assert f"/{config.CRITIC_SCORE_MAX}" in out


def test_list_reports_every_run(harness, capsys):
    piece.advance_run(RunState.create(TOPIC, slug="one"))
    piece.advance_run(RunState.create(TOPIC, slug="two"))
    assert piece.main(["list"]) == piece.EXIT_OK

    out = capsys.readouterr().out
    assert "one" in out and "two" in out


def test_resume_retry_clears_a_halt_and_resets_that_stages_attempts(harness):
    harness.gate_ok["article"] = False
    state = drive(RunState.create(TOPIC))
    assert state.halted_reason

    harness.gate_ok["article"] = True
    assert piece.main(["resume", SLUG, "--retry"]) == piece.EXIT_OK

    resumed = RunState.load(SLUG)
    assert resumed.halted_reason is None
    assert piece.pending_approval(resumed) == ARTICLE_POINT


def test_an_unknown_run_is_an_error_not_a_traceback(harness, capsys):
    assert piece.main(["status", "never-existed"]) == piece.EXIT_HALTED
    assert "no run at" in capsys.readouterr().err


def test_an_approval_may_omit_the_point_and_take_the_pending_one(harness, capsys):
    piece.advance_run(RunState.create(TOPIC))
    assert piece.main(["approve", SLUG]) == piece.EXIT_OK
    capsys.readouterr()

    state = RunState.load(SLUG)
    assert state.approvals[OUTLINE]["decision"] == "approve"
    assert piece.pending_approval(state) == ARTICLE_POINT


def test_an_approval_with_no_pending_point_is_refused(harness, capsys):
    RunState.create(TOPIC)
    assert piece.main(["approve", SLUG]) == piece.EXIT_HALTED
    assert "not waiting on an approval point" in capsys.readouterr().err


def test_an_unknown_approval_point_is_a_usage_error(harness):
    with pytest.raises(SystemExit) as exc:
        piece.main(["approve", SLUG, "vibes"])
    assert exc.value.code == piece.EXIT_USAGE


# ── Publishing ──────────────────────────────────────────────────────────────


def test_a_withheld_handoff_pauses_the_run_at_publish_instead_of_finishing(harness):
    harness.withhold_handoff = True
    state = drive(RunState.create(TOPIC))

    assert state.stage == "publish"
    assert not state.finished
    assert state.publish["branch"] == config.PUBLISH_BRANCH_PREFIX + SLUG
    assert state.publish.get("handoff") is None
    # A wait is not a failure: it must not spend an attempt or halt the run.
    assert "publish" not in state.attempts
    assert state.halted_reason is None
    assert "withheld" in piece._format_status(state)

    harness.withhold_handoff = False
    resumed = drive(RunState.load(SLUG))

    assert resumed.finished
    assert resumed.publish["handoff"]
    # The branch the first call opened survives the second.
    assert resumed.publish["branch"] == config.PUBLISH_BRANCH_PREFIX + SLUG


# ── Integration with the real prompt files ──────────────────────────────────


def test_every_stage_prompt_renders_with_the_context_the_driver_supplies(harness):
    prompts = pytest.importorskip("agent.prompts")
    state = drive(RunState.create(TOPIC), decisions={PACKAGE_POINT: None})

    for stage in config.STAGE_BACKENDS:
        rendered = prompts.render_stage(stage, **piece._context(state, piece.STAGE_TABLE[stage]))
        assert prompts.stage_marker(rendered) == stage
        assert "{{" not in rendered
