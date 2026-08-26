"""The gate CLI.

    python -m agent.gates.run --kind article --file src/content/blog/x.md
    python -m agent.gates.run --kind post --lang es --file post.es.md

One contract for three callers: the `Stop` hook, the headless driver and the
test suite. The verdict travels twice — as an exit code, for anything that only
branches on success, and as a JSON report on stdout, for anything that has to
feed the failures back to a model.

Exit codes: 0 every gate passed, 1 a gate failed, 2 the invocation or the file
was wrong. A usage error is not a gate failure and must not be read as one.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .. import config
from . import GateReport, GateResult, failed, skipped
from . import article as article_gates
from . import build as build_gate
from . import post as post_gates
from . import repetition as repetition_gate

__all__ = ["main", "gate_file", "EXIT_OK", "EXIT_FAILED", "EXIT_USAGE"]

EXIT_OK = 0
EXIT_FAILED = 1
EXIT_USAGE = 2

KINDS = ("article", "post")
LANGS = ("en", "es")


def gate_file(
    kind: str, path: Path, text: str, lang: str | None = None, run_build: bool = True
) -> GateReport:
    """Every gate for this kind, cheapest first, the build last.

    The build gate runs only when nothing cheaper has failed. When it is skipped
    the report says so with `ran: false`, so it can never be read as a build that
    passed.
    """
    report = GateReport(kind=kind, lang=lang, path=str(path))

    if kind == "article":
        report.extend(article_gates.check_article(text))
        report.extend(repetition_gate.check_repetition(text, path=path))
        report.add(_build_result(path, text, report, run_build))
    else:
        report.extend(post_gates.check_post(text, lang))
        report.extend(repetition_gate.check_repetition(text, path=path))

    return report


def _build_result(path: Path, text: str, report: GateReport, run_build: bool) -> GateResult:
    if not run_build:
        return skipped(build_gate.GATE, "build gate not requested (--no-build)")
    if report.failures:
        names = ", ".join(r.gate for r in report.failures)
        return skipped(build_gate.GATE, f"not run: cheaper gate(s) already failed ({names})")
    try:
        return build_gate.check_build(path, text)
    except build_gate.BuildUnavailable as exc:
        return failed(
            build_gate.GATE,
            f"`{' '.join(config.BUILD_COMMAND)}` could not be started: {exc}",
            measured="unavailable",
            limit=0,
        )


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m agent.gates.run",
        description="Check a candidate article or LinkedIn post against the configured gates.",
    )
    parser.add_argument("--kind", required=True, choices=KINDS)
    parser.add_argument("--lang", choices=LANGS, default=None)
    parser.add_argument("--file", required=True, help="path to the candidate file")
    parser.add_argument(
        "--no-build",
        action="store_true",
        help="skip the build gate; the report records it as not run",
    )
    parser.add_argument(
        "--json-only",
        action="store_true",
        help="print only the JSON report, no failure summary on stderr",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _parser()
    try:
        args = parser.parse_args(argv)
    except SystemExit as exc:
        # argparse exits non-zero on a usage error and zero on --help; both are
        # already the code this CLI wants to return.
        return EXIT_USAGE if exc.code else EXIT_OK

    path = Path(args.file)
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"cannot read {path}: {exc}", file=sys.stderr)
        return EXIT_USAGE

    lang = args.lang or ("en" if args.kind == "post" else None)
    report = gate_file(args.kind, path, text, lang=lang, run_build=not args.no_build)

    print(report.to_json())
    if not report.ok and not args.json_only:
        print(report.reason_text(), file=sys.stderr)
    return EXIT_OK if report.ok else EXIT_FAILED


if __name__ == "__main__":
    sys.exit(main())
