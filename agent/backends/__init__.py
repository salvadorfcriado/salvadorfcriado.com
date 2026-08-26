"""Model backends behind one interface.

A stage names a backend in `config.STAGE_BACKENDS`; nothing else in the codebase
knows which one it got. Reassigning a stage to another backend is a one-line
edit to that map — there is no `if backend ==` anywhere outside this package.

Every backend returns text, and every structured stage validates that text
against a JSON Schema before it reaches the state file. A subprocess gives
weaker structured-output guarantees than an API call, so the validation is not
optional: a malformed response is a stage failure with its own retry, never a
corrupted run.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Protocol

from .. import config

__all__ = ["Backend", "BackendError", "BackendUnavailable", "Response", "get_backend", "for_stage"]


class BackendError(RuntimeError):
    """The backend ran and returned something unusable."""


class BackendUnavailable(BackendError):
    """The backend cannot be reached or is not authenticated.

    Raised with a message naming the backend and the missing prerequisite. The
    driver does not advance the state file when it sees this.
    """


@dataclass(frozen=True)
class Response:
    text: str
    backend: str
    meta: dict[str, Any]


class Backend(Protocol):
    name: str

    def available(self) -> tuple[bool, str]:
        """(usable, reason). `reason` names the missing prerequisite when not."""

    def complete(self, prompt: str, *, system: str | None = None) -> Response:
        """Run the prompt and return the model's text."""


def extract_json(text: str) -> Any:
    """Pull the JSON object out of a model response.

    Headless invocations wrap JSON in prose or a fenced block often enough that
    parsing has to tolerate it. Anything that is not recoverable JSON is a
    `BackendError`, so it is retried rather than written to the state file.
    """
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(.+?)```", text, re.S)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start = min((i for i in (text.find("{"), text.find("[")) if i != -1), default=-1)
    if start != -1:
        for end in range(len(text), start, -1):
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                continue
    raise BackendError(f"response is not JSON: {text[:200]!r}")


def get_backend(name: str) -> Backend:
    """Resolve a backend by the name used in `config.STAGE_BACKENDS`."""
    if name == config.BACKEND_CLAUDE_CODE:
        from .claude_code import ClaudeCodeBackend

        return ClaudeCodeBackend()
    if name == config.BACKEND_API:
        from .api import ApiBackend

        return ApiBackend()
    if name == config.BACKEND_MOCK:
        from .mock import MockBackend

        return MockBackend()
    raise BackendError(f"unknown backend {name!r}; expected one of claude_code, api, mock")


def for_stage(stage: str) -> Backend:
    return get_backend(config.STAGE_BACKENDS.get(stage, config.DEFAULT_BACKEND))
