"""File-backed run state.

`agent/state/<slug>/state.json` is the authoritative record of a run. Progress is
never inferred from conversation history, which is compacted, truncated or lost
between sessions; it is read from here, by both entry points, without conversion.

Writes are atomic — the file is written to a sibling temporary path and renamed —
because a run interrupted mid-write must resume from the last good state rather
than from a half-serialised one.
"""

from __future__ import annotations

import json
import os
import re
import tempfile
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import config
from .config import SLUG_MAX_CHARS

__all__ = ["RunState", "slugify", "state_path", "list_runs"]

SCHEMA_VERSION = 1


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def slugify(text: str) -> str:
    """The slug is the run's identity, the article's filename and its URL.

    Truncation cuts at a word boundary rather than mid-word, and the trailing
    separator is stripped after the cut, not before: `...code-instead-` is a
    published URL that reads as a mistake, and renaming it later costs a
    redirect rule on the zone.
    """
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    if len(slug) > SLUG_MAX_CHARS:
        slug = slug[:SLUG_MAX_CHARS].rsplit("-", 1)[0]
    return slug.strip("-")


def state_path(slug: str) -> Path:
    return config.STATE_DIR / slug / "state.json"


def list_runs() -> list[str]:
    if not config.STATE_DIR.exists():
        return []
    return sorted(d.name for d in config.STATE_DIR.iterdir() if (d / "state.json").exists())


class StateError(RuntimeError):
    """The state file is unreadable, invalid, or describes an impossible run."""


@dataclass
class RunState:
    """One run, from topic to handoff.

    Every field here is something a resumed run needs and cannot recover from
    anywhere else. Anything derivable — the article's path from the slug, the
    next stage from the current one — is derived, not stored, so the file cannot
    contradict itself.
    """

    slug: str
    topic: str
    brief: str = ""
    schema_version: int = SCHEMA_VERSION
    created_at: str = field(default_factory=_now)
    updated_at: str = field(default_factory=_now)

    # Where the run is. `stage` is always a member of config.STAGES; `done` is
    # the terminal value written once handoff is recorded.
    stage: str = config.STAGES[0]
    finished: bool = False
    halted_reason: str | None = None

    # Per-stage revision attempts, against config.MAX_STAGE_ATTEMPTS.
    attempts: dict[str, int] = field(default_factory=dict)

    # What each stage produced. Keyed by stage name; the value shape is the
    # stage's own (an outline is a dict, an article is Markdown text).
    artifacts: dict[str, Any] = field(default_factory=dict)

    # The latest gate report per artefact key ("article", "post_en", "post_es").
    # The publish precondition reads these and nothing else.
    gate_reports: dict[str, dict[str, Any]] = field(default_factory=dict)

    # The critic's scored verdict, keyed by the stage it reviewed.
    critiques: dict[str, Any] = field(default_factory=dict)

    # Recorded approvals, keyed by approval point ("outline", "article",
    # "package"). Each is {decision, feedback, at, waived}. The pipeline never
    # advances past a point that has no entry here.
    approvals: dict[str, dict[str, Any]] = field(default_factory=dict)

    # The published record: branch, pull request URL, probed URL, handoff text.
    publish: dict[str, Any] = field(default_factory=dict)

    # Append-only trail of what happened, for the operator and for debugging a
    # resumed run. Not read by any control flow.
    log: list[dict[str, Any]] = field(default_factory=list)

    # ── Persistence ─────────────────────────────────────────────────────────

    @property
    def path(self) -> Path:
        return state_path(self.slug)

    @classmethod
    def create(cls, topic: str, brief: str = "", slug: str | None = None) -> "RunState":
        state = cls(slug=slug or slugify(topic), topic=topic, brief=brief)
        if state.path.exists():
            raise StateError(f"a run already exists at {state.path}; resume it or pick another slug")
        state.save()
        return state

    @classmethod
    def load(cls, slug: str) -> "RunState":
        path = state_path(slug)
        if not path.exists():
            raise StateError(f"no run at {path}")
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise StateError(f"state file at {path} is not valid JSON: {exc}") from exc
        known = {f for f in cls.__dataclass_fields__}
        state = cls(**{k: v for k, v in data.items() if k in known})
        state.validate()
        return state

    def save(self) -> Path:
        """Atomic write: temp file in the same directory, then rename."""
        self.updated_at = _now()
        self.validate()
        path = self.path
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(self.to_dict(), indent=2, ensure_ascii=False)
        fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=".state-", suffix=".json")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(payload)
                fh.flush()
                os.fsync(fh.fileno())
            os.replace(tmp, path)
        except BaseException:
            Path(tmp).unlink(missing_ok=True)
            raise
        return path

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "slug": self.slug,
            "topic": self.topic,
            "brief": self.brief,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "stage": self.stage,
            "finished": self.finished,
            "halted_reason": self.halted_reason,
            "attempts": self.attempts,
            "artifacts": self.artifacts,
            "gate_reports": self.gate_reports,
            "critiques": self.critiques,
            "approvals": self.approvals,
            "publish": self.publish,
            "log": self.log,
        }

    def validate(self) -> None:
        if self.schema_version != SCHEMA_VERSION:
            raise StateError(
                f"state schema version {self.schema_version} != {SCHEMA_VERSION}; "
                "this run was written by a different version of the driver"
            )
        if not self.slug:
            raise StateError("state has no slug")
        if self.stage not in config.STAGES and self.stage != "done":
            raise StateError(f"unknown stage {self.stage!r}; expected one of {config.STAGES}")
        for point, record in self.approvals.items():
            if point not in config.APPROVAL_POINTS.values():
                raise StateError(f"unknown approval point {point!r}")
            if record.get("decision") not in {"approve", "revise", "reject"}:
                raise StateError(f"approval {point!r} has no valid decision")

    # ── Mutation ────────────────────────────────────────────────────────────

    def note(self, event: str, **detail: Any) -> None:
        self.log.append({"at": _now(), "event": event, **detail})

    def attempt_count(self, stage: str) -> int:
        return self.attempts.get(stage, 0)

    def record_attempt(self, stage: str) -> int:
        self.attempts[stage] = self.attempt_count(stage) + 1
        return self.attempts[stage]

    def attempts_exhausted(self, stage: str) -> bool:
        return self.attempt_count(stage) >= config.MAX_STAGE_ATTEMPTS

    def record_gate_report(self, key: str, report: dict[str, Any]) -> None:
        self.gate_reports[key] = report

    def gates_passing(self, key: str) -> bool:
        report = self.gate_reports.get(key)
        return bool(report) and bool(report.get("ok"))

    def record_approval(
        self, point: str, decision: str, feedback: str = "", waived: bool = False
    ) -> None:
        if point not in config.APPROVAL_POINTS.values():
            raise StateError(f"unknown approval point {point!r}")
        if decision not in {"approve", "revise", "reject"}:
            raise StateError(f"unknown approval decision {decision!r}")
        if waived and point not in config.WAIVABLE_APPROVALS:
            raise StateError(f"approval point {point!r} is not waivable")
        self.approvals[point] = {
            "decision": decision,
            "feedback": feedback,
            "waived": waived,
            "at": _now(),
        }
        self.note("approval", point=point, decision=decision, waived=waived)

    def approval_for(self, point: str) -> dict[str, Any] | None:
        return self.approvals.get(point)

    def is_approved(self, point: str) -> bool:
        record = self.approvals.get(point)
        return bool(record) and record.get("decision") == "approve"

    def halt(self, reason: str) -> None:
        self.halted_reason = reason
        self.note("halted", reason=reason)

    def clear_halt(self) -> None:
        self.halted_reason = None

    # ── Stage sequence ──────────────────────────────────────────────────────

    def next_stage(self) -> str | None:
        if self.stage == "done":
            return None
        index = config.STAGES.index(self.stage)
        if index + 1 >= len(config.STAGES):
            return None
        return config.STAGES[index + 1]

    def advance(self) -> str:
        """Move to the next declared stage. Approval gating lives in the driver."""
        nxt = self.next_stage()
        self.stage = nxt or "done"
        if nxt is None:
            self.finished = True
        self.note("stage", stage=self.stage)
        return self.stage
