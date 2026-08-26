"""The hosted Anthropic API, over the standard library.

The documented fallback: someone who clones this repository has no access to the
owner's Claude Code subscription, and a pipeline whose only backend is one
person's login is not runnable by anyone else. Selecting it is a `.env` entry and
`config.STAGE_BACKENDS`; no code changes.

`urllib.request` rather than the SDK on purpose. The agent's dependency list is
two libraries the gates need, and a backend that only ever POSTs one JSON body
does not justify a third.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request

from .. import config
from . import BackendError, BackendUnavailable, Response

__all__ = ["ApiBackend"]

ANTHROPIC_VERSION = "2023-06-01"


class ApiBackend:
    name = config.BACKEND_API

    def __init__(self, model: str | None = None, timeout: int | None = None) -> None:
        self.model = model or config.API_MODEL
        self.timeout = timeout or config.API_TIMEOUT_SECONDS
        self.base_url = config.API_BASE_URL.rstrip("/")

    @property
    def api_key(self) -> str | None:
        # Read per call, not cached at import: `.env` is loaded by the entry
        # point, which may run after this module is imported.
        return os.environ.get(config.API_KEY_ENV) or None

    def available(self) -> tuple[bool, str]:
        if not self.api_key:
            return False, f"{self.name}: {config.API_KEY_ENV} is not set"
        return True, ""

    def complete(self, prompt: str, *, system: str | None = None) -> Response:
        usable, reason = self.available()
        if not usable:
            raise BackendUnavailable(reason)

        payload: dict[str, object] = {
            "model": self.model,
            "max_tokens": config.API_MAX_TOKENS,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            payload["system"] = system

        request = urllib.request.Request(
            f"{self.base_url}/v1/messages",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "x-api-key": self.api_key or "",
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            method="POST",
        )

        started = time.monotonic()
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = _error_detail(exc)
            if exc.code in (401, 403):
                raise BackendUnavailable(
                    f"{self.name}: {config.API_KEY_ENV} was rejected ({exc.code}): {detail}"
                ) from exc
            raise BackendError(f"{self.name}: HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise BackendUnavailable(f"{self.name}: cannot reach {self.base_url}: {exc.reason}") from exc
        except json.JSONDecodeError as exc:
            raise BackendError(f"{self.name}: response was not JSON: {exc}") from exc
        elapsed = round(time.monotonic() - started, 1)

        text = _text_of(body)
        if not text:
            raise BackendError(f"{self.name}: response carried no text block: {str(body)[:240]}")

        usage = body.get("usage", {}) if isinstance(body, dict) else {}
        return Response(
            text=text,
            backend=self.name,
            meta={
                "model": body.get("model", self.model) if isinstance(body, dict) else self.model,
                "seconds": elapsed,
                "stop_reason": body.get("stop_reason") if isinstance(body, dict) else None,
                "usage": usage,
            },
        )


def _text_of(body: object) -> str:
    """Join the text blocks of a Messages response.

    A response can carry more than one block, and a truncated response carries a
    `stop_reason` the caller records rather than a shape the caller must guess.
    """
    if not isinstance(body, dict):
        return ""
    blocks = body.get("content")
    if not isinstance(blocks, list):
        return ""
    parts = [b.get("text", "") for b in blocks if isinstance(b, dict) and b.get("type") == "text"]
    return "".join(parts).strip()


def _error_detail(exc: urllib.error.HTTPError) -> str:
    try:
        payload = json.loads(exc.read().decode("utf-8"))
    except Exception:
        return exc.reason if isinstance(exc.reason, str) else str(exc.reason)
    error = payload.get("error") if isinstance(payload, dict) else None
    if isinstance(error, dict):
        return str(error.get("message") or error)
    return str(payload)
