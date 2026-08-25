"""The build gate: the site's own build, run against the candidate article.

This is the one gate that is not pure. It shells out to the repository's build
command and that command may reach the network, write to `dist/` and render the
Open Graph card. It is therefore the last gate to run, and every cheaper gate
that fails first saves it.

The verdict is cached against a sha256 of the article's content, so re-gating an
unchanged article between stages costs nothing. Content, not path: moving the
file changes nothing the build cares about, and editing one word invalidates it.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any

from .. import config
from . import GateResult, failed, passed

__all__ = ["GATE", "check_build", "cache_path", "content_hash"]

GATE = "article.build"

# Build logs run long and the useful part is at the end. The report keeps the
# tail; the operator has the full log in their terminal.
_MAX_OUTPUT_CHARS = 6000


def cache_path() -> Path:
    return config.STATE_DIR / ".build-cache.json"


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _load_cache() -> dict[str, Any]:
    path = cache_path()
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        # A corrupt cache is a cache miss, never a failed build.
        return {}
    return data if isinstance(data, dict) else {}


def _store(digest: str, ok: bool, message: str, detail: dict[str, Any]) -> None:
    path = cache_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    cache = _load_cache()
    cache[digest] = {"ok": ok, "message": message, "detail": detail, "at": int(time.time())}
    path.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")


def _tail(text: str) -> str:
    text = text.strip()
    if len(text) <= _MAX_OUTPUT_CHARS:
        return text
    return "…\n" + text[-_MAX_OUTPUT_CHARS:]


def check_build(path: Path | str, text: str | None = None, use_cache: bool = True) -> GateResult:
    """Run `npm run build` with the candidate in the content collection.

    A candidate whose content is already at its place in `src/content/blog` is
    built where it is. Anything else is written in for the duration and undone
    afterwards, displaced file restored: the gate never leaves the collection
    changed.
    """
    source = Path(path)
    try:
        content = text if text is not None else source.read_text(encoding="utf-8")
    except OSError as exc:
        return failed(
            GATE,
            f"cannot read the candidate at {source}: {exc}",
            measured="unreadable",
            limit="readable",
        )

    digest = content_hash(content)
    if use_cache:
        cached = _load_cache().get(digest)
        if isinstance(cached, dict) and "ok" in cached:
            note = f"verdict cached against content sha256 {digest[:12]}"
            factory = passed if cached["ok"] else failed
            return factory(
                GATE,
                cached.get("message", ""),
                measured=cached.get("detail", {}).get("returncode", 0),
                limit=0,
                note=note,
                detail=cached.get("detail", {}),
            )

    target = config.CONTENT_DIR / source.name
    displaced = target.read_text(encoding="utf-8") if target.exists() else None
    write = displaced != content

    if write:
        config.CONTENT_DIR.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    try:
        result = _run()
    finally:
        if write:
            if displaced is None:
                target.unlink(missing_ok=True)
            else:
                target.write_text(displaced, encoding="utf-8")

    verdict = _verdict(result)
    _store(digest, verdict.ok, verdict.message, verdict.detail)
    return verdict


def _run() -> subprocess.CompletedProcess | subprocess.TimeoutExpired:
    try:
        return subprocess.run(
            config.BUILD_COMMAND,
            cwd=str(config.REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=config.BUILD_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired as expired:
        return expired
    except (OSError, FileNotFoundError) as exc:
        raise BuildUnavailable(str(exc)) from exc


class BuildUnavailable(RuntimeError):
    """The build command could not be started at all."""


def _verdict(result) -> GateResult:
    command = " ".join(config.BUILD_COMMAND)

    if isinstance(result, subprocess.TimeoutExpired):
        return failed(
            GATE,
            f"`{command}` did not finish within {config.BUILD_TIMEOUT_SECONDS}s",
            measured=config.BUILD_TIMEOUT_SECONDS,
            limit=config.BUILD_TIMEOUT_SECONDS,
            detail={"output": _tail(_decode(result.stdout) + _decode(result.stderr))},
        )

    output = _tail((result.stdout or "") + (result.stderr or ""))
    if result.returncode != 0:
        return failed(
            GATE,
            f"`{command}` exited {result.returncode}, expected 0:\n{output}",
            measured=result.returncode,
            limit=0,
            detail={"returncode": result.returncode, "output": output},
        )
    return passed(
        GATE,
        f"`{command}` exited 0",
        measured=result.returncode,
        limit=0,
        detail={"returncode": result.returncode},
    )


def _decode(stream) -> str:
    if stream is None:
        return ""
    return stream if isinstance(stream, str) else stream.decode("utf-8", "replace")
