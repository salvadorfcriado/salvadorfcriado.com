"""A deterministic backend that reads canned responses from disk.

Why it exists: the end-to-end verification has to run in CI and on every commit,
and a pipeline whose test suite calls a model is a pipeline nobody runs the
tests for. Every response here is a file that a human wrote and that passes the
same gates as generated text, so the test proves the wiring rather than the
model.

Stage resolution, simplest thing that works: each stage prompt opens with an
HTML comment marker (`<!-- stage: write -->`), which survives rendering because
the style prefix is prepended, not merged. The backend reads that marker from
the prompt it is handed. A caller with no prompt to hand — a unit test — passes
`MockBackend(stage="write")` instead, and the explicit argument wins.
"""

from __future__ import annotations

from pathlib import Path

from .. import config, prompts
from . import BackendError, BackendUnavailable, Response

__all__ = ["MockBackend"]

# Fixtures are named for their stage. The extension is documentation: `.json`
# for the structured stages, `.md` for prose.
FIXTURE_SUFFIXES = (".md", ".json", ".txt")


class MockBackend:
    name = config.BACKEND_MOCK

    def __init__(self, stage: str | None = None, fixtures_dir: Path | None = None) -> None:
        self.stage = stage
        self.fixtures_dir = fixtures_dir or config.MOCK_FIXTURES_DIR

    def available(self) -> tuple[bool, str]:
        if not self.fixtures_dir.is_dir():
            return False, f"{self.name}: no fixtures directory at {self.fixtures_dir}"
        return True, ""

    def fixture_path(self, stage: str) -> Path:
        for suffix in FIXTURE_SUFFIXES:
            candidate = self.fixtures_dir / f"{stage}{suffix}"
            if candidate.is_file():
                return candidate
        raise BackendError(
            f"{self.name}: no fixture for stage {stage!r} in {self.fixtures_dir} "
            f"(expected one of {', '.join(stage + s for s in FIXTURE_SUFFIXES)})"
        )

    def complete(self, prompt: str, *, system: str | None = None) -> Response:
        usable, reason = self.available()
        if not usable:
            raise BackendUnavailable(reason)

        stage = self.stage or prompts.stage_marker(prompt)
        if not stage:
            raise BackendError(
                f"{self.name}: the prompt declares no stage marker and none was given; "
                "pass MockBackend(stage=...) or render a prompt file that opens with one"
            )

        path = self.fixture_path(stage)
        return Response(
            text=path.read_text(encoding="utf-8").strip(),
            backend=self.name,
            meta={"stage": stage, "fixture": str(path)},
        )
