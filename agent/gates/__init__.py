"""Gate result and report types.

A gate is a pure function of its input text and the values in `agent/config.py`.
It does not call a model, it does not reach the network, and it returns the same
verdict for the same input on every run. The build gate is the single exception
to the network rule and is marked as such.

Every gate returns a `GateResult`. The CLI collects them into a `GateReport`,
which is what is printed as JSON, stored in the state file, and read back by the
`Stop` hook and by the publish precondition check.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from typing import Any

__all__ = ["GateResult", "GateReport", "passed", "failed", "skipped"]


@dataclass(frozen=True)
class GateResult:
    """One gate's verdict.

    `gate` is a stable dotted identifier (`post.hook_chars`). `measured` and
    `limit` are the two numbers the failure message must name, so that the
    model revising against this report is given a distance rather than an
    opinion. `note` records anything the verdict depends on that is not a
    failure — the repetition gate uses it to say the corpus was empty.
    """

    gate: str
    ok: bool
    message: str
    measured: Any = None
    limit: Any = None
    note: str | None = None
    ran: bool = True
    detail: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def passed(gate: str, message: str, **kw: Any) -> GateResult:
    return GateResult(gate=gate, ok=True, message=message, **kw)


def failed(gate: str, message: str, **kw: Any) -> GateResult:
    return GateResult(gate=gate, ok=False, message=message, **kw)


def skipped(gate: str, reason: str) -> GateResult:
    """A gate that did not run because a cheaper gate already failed.

    A skipped gate is not a passing gate. It is reported as `ran: false` so the
    report can never be read as "everything was checked".
    """
    return GateResult(gate=gate, ok=True, message=reason, ran=False, note=reason)


@dataclass
class GateReport:
    """The whole verdict for one artefact.

    `ok` is true only when every gate that ran passed. The exit code of the CLI
    is derived from it and from nothing else.
    """

    kind: str
    lang: str | None
    path: str
    results: list[GateResult] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return all(r.ok for r in self.results)

    @property
    def failures(self) -> list[GateResult]:
        return [r for r in self.results if not r.ok]

    def add(self, result: GateResult) -> GateResult:
        self.results.append(result)
        return result

    def extend(self, results: list[GateResult]) -> None:
        self.results.extend(results)

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "lang": self.lang,
            "path": self.path,
            "ok": self.ok,
            "gates_run": sum(1 for r in self.results if r.ran),
            "failures": [r.to_dict() for r in self.failures],
            "results": [r.to_dict() for r in self.results],
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    def reason_text(self) -> str:
        """The per-gate failure messages, as the `Stop` hook feeds them back.

        One line per failure, each naming the gate, the measured value and the
        configured limit. This is the revision signal; it is deliberately not a
        summary.
        """
        if self.ok:
            return ""
        lines = [f"{len(self.failures)} gate(s) failed on {self.path}:"]
        lines += [f"  - [{r.gate}] {r.message}" for r in self.failures]
        return "\n".join(lines)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "GateReport":
        report = cls(kind=data["kind"], lang=data.get("lang"), path=data["path"])
        report.results = [GateResult(**r) for r in data.get("results", [])]
        return report
