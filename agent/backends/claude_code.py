"""Claude Code, invoked headlessly.

The default backend, because it runs under the operator's own subscription and
the marginal cost of a pipeline run is therefore effectively zero. It is a
subprocess, not an API client: `claude -p <prompt> --output-format text`, one
process per stage, no session carried between them.

No tool grant and no permission flag is passed. The stage prompts ask for text
and nothing else, and a backend that writes files is a backend that can edit the
repository behind the gates. Headless mode denies anything that would need
approval rather than waiting for a terminal that is not there.
"""

from __future__ import annotations

import shutil
import subprocess
import time

from .. import config
from . import BackendError, BackendUnavailable, Response

__all__ = ["ClaudeCodeBackend"]


class ClaudeCodeBackend:
    name = config.BACKEND_CLAUDE_CODE

    def __init__(self, binary: str | None = None, timeout: int | None = None) -> None:
        self.binary = binary or config.CLAUDE_CODE_BINARY
        self.timeout = timeout or config.CLAUDE_CODE_TIMEOUT_SECONDS

    def available(self) -> tuple[bool, str]:
        if shutil.which(self.binary) is None:
            return False, f"{self.name}: binary not found on PATH ({self.binary})"
        return True, ""

    def complete(self, prompt: str, *, system: str | None = None) -> Response:
        usable, reason = self.available()
        if not usable:
            raise BackendUnavailable(reason)

        argv = [self.binary, "-p", prompt, "--output-format", "text"]
        if system:
            argv += ["--append-system-prompt", system]

        started = time.monotonic()
        try:
            proc = subprocess.run(
                argv,
                capture_output=True,
                text=True,
                timeout=self.timeout,
                check=False,
            )
        except FileNotFoundError as exc:
            # Lost the race with `available()`, or PATH changed under us.
            raise BackendUnavailable(f"{self.name}: binary not found on PATH ({self.binary})") from exc
        except subprocess.TimeoutExpired as exc:
            raise BackendError(
                f"{self.name}: no response within {self.timeout}s "
                f"(config.CLAUDE_CODE_TIMEOUT_SECONDS)"
            ) from exc
        elapsed = round(time.monotonic() - started, 1)

        if proc.returncode != 0:
            # Never a bare CalledProcessError: the driver distinguishes "cannot
            # run" from "ran and failed", and only the second one is retried.
            detail = (proc.stderr or proc.stdout or "").strip()[-500:]
            raise BackendError(f"{self.name}: exit {proc.returncode}: {detail or 'no output'}")

        text = (proc.stdout or "").strip()
        if not text:
            raise BackendError(f"{self.name}: empty response after {elapsed}s")

        return Response(
            text=text,
            backend=self.name,
            meta={"binary": self.binary, "seconds": elapsed, "exit_code": proc.returncode},
        )
