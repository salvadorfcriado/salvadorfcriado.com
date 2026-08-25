"""The state file is the only authoritative record of a run.

These tests hold it to that: a write that is interrupted leaves the previous good
file in place, a file describing an impossible run is refused rather than
half-understood, and `advance()` walks the declared stage tuple and nothing else.
"""

from __future__ import annotations

import json

import pytest

from agent import config, state as state_mod
from agent.state import RunState, StateError


@pytest.fixture(autouse=True)
def isolated_state_dir(tmp_path, monkeypatch):
    """Never touch the real `agent/state/`."""
    monkeypatch.setattr(config, "STATE_DIR", tmp_path / "state")


def _write_raw(slug: str, payload: dict) -> None:
    path = state_mod.state_path(slug)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def _valid_payload(slug: str = "topic") -> dict:
    return RunState(slug=slug, topic="a topic").to_dict()


# ── Atomic save ─────────────────────────────────────────────────────────────


def test_interrupted_write_leaves_the_previous_state_intact(monkeypatch):
    state = RunState.create("first topic")
    good = state.path.read_text(encoding="utf-8")

    state.topic = "clobbered"

    def boom(src, dst):
        raise OSError("interrupted before the rename")

    monkeypatch.setattr(state_mod.os, "replace", boom)
    with pytest.raises(OSError):
        state.save()

    assert state.path.read_text(encoding="utf-8") == good
    assert RunState.load(state.slug).topic == "first topic"


def test_interrupted_write_leaves_no_temporary_file_behind(monkeypatch):
    state = RunState.create("first topic")

    monkeypatch.setattr(
        state_mod.os, "replace", lambda src, dst: (_ for _ in ()).throw(OSError("interrupted"))
    )
    with pytest.raises(OSError):
        state.save()

    leftovers = [p.name for p in state.path.parent.iterdir() if p.name.startswith(".state-")]
    assert leftovers == []


def test_save_is_a_rename_so_a_reader_never_sees_a_partial_file():
    state = RunState.create("a topic")
    seen = {}

    def spy(src, dst):
        # At the moment of the rename the destination must already hold the
        # previous complete document, not a truncated one.
        seen["before"] = json.loads(open(dst, encoding="utf-8").read())
        state_mod.os.rename(src, dst)

    original = state_mod.os.replace
    try:
        state_mod.os.replace = spy
        state.topic = "second topic"
        state.save()
    finally:
        state_mod.os.replace = original

    assert seen["before"]["topic"] == "a topic"
    assert RunState.load(state.slug).topic == "second topic"


# ── Validation ──────────────────────────────────────────────────────────────


def test_load_rejects_an_unknown_stage():
    payload = _valid_payload()
    payload["stage"] = "brainstorm"
    _write_raw("topic", payload)
    with pytest.raises(StateError, match="unknown stage"):
        RunState.load("topic")


def test_load_rejects_an_unknown_approval_point():
    payload = _valid_payload()
    payload["approvals"] = {"vibes": {"decision": "approve"}}
    _write_raw("topic", payload)
    with pytest.raises(StateError, match="unknown approval point"):
        RunState.load("topic")


def test_load_rejects_an_invalid_approval_decision():
    point = config.APPROVAL_POINTS[config.STAGES[0]]
    payload = _valid_payload()
    payload["approvals"] = {point: {"decision": "probably"}}
    _write_raw("topic", payload)
    with pytest.raises(StateError, match="no valid decision"):
        RunState.load("topic")


def test_load_rejects_a_missing_run():
    with pytest.raises(StateError, match="no run at"):
        RunState.load("never-existed")


def test_record_approval_rejects_an_unknown_point():
    state = RunState.create("a topic")
    with pytest.raises(StateError, match="unknown approval point"):
        state.record_approval("vibes", "approve")


def test_record_approval_rejects_a_waiver_on_a_non_waivable_point():
    state = RunState.create("a topic")
    point = next(p for p in config.APPROVAL_POINTS.values() if p not in config.WAIVABLE_APPROVALS)
    with pytest.raises(StateError, match="not waivable"):
        state.record_approval(point, "approve", waived=True)


# ── Stage sequence ──────────────────────────────────────────────────────────


def test_advance_walks_config_stages_exactly():
    state = RunState.create("a topic")
    assert state.stage == config.STAGES[0]

    walked = []
    while not state.finished:
        walked.append(state.advance())

    assert walked == list(config.STAGES[1:]) + ["done"]
    assert state.stage == "done"
    assert state.next_stage() is None


def test_advance_never_skips_a_stage():
    state = RunState.create("a topic")
    visited = [state.stage]
    while not state.finished:
        visited.append(state.advance())
    assert visited[:-1] == list(config.STAGES)


def test_a_run_reloaded_from_disk_resumes_at_the_recorded_stage():
    state = RunState.create("a topic")
    state.advance()
    state.advance()
    state.save()

    assert RunState.load(state.slug).stage == config.STAGES[2]


def test_attempt_counting_is_per_stage():
    state = RunState.create("a topic")
    stage = config.STAGES[1]
    for _ in range(config.MAX_STAGE_ATTEMPTS):
        assert not state.attempts_exhausted(stage)
        state.record_attempt(stage)
    assert state.attempts_exhausted(stage)
    assert not state.attempts_exhausted(config.STAGES[2])
