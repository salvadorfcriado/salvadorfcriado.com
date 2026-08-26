"""The CLI contract: exit codes, report shape, gate order, short circuit.

Three callers depend on this and none of them adapts to it — the `Stop` hook
reads the exit code and the failure messages, the driver stores the report, the
suite asserts on it. What is tested here is the contract itself, not the gates'
verdicts, which `test_gates.py` covers.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from agent import config
from agent.gates import build as build_gate
from agent.gates import run

FIXTURES = Path(__file__).parent / "fixtures"
VALID_POST = FIXTURES / "post_valid.en.md"
GOLDEN_ARTICLE = config.GOLDENS_DIR / "articles" / "temperature-zero-is-not-deterministic.md"
FAILING_POST = config.GOLDENS_DIR / "posts" / "the-half-nobody-put-on-call.en.md"


def invoke(capsys, *argv):
    code = run.main(list(argv))
    captured = capsys.readouterr()
    return code, captured


def report_of(captured):
    return json.loads(captured.out)


def test_exit_zero_and_no_failures_when_every_gate_passes(capsys):
    code, captured = invoke(capsys, "--kind", "post", "--lang", "en", "--file", str(VALID_POST))
    report = report_of(captured)
    assert code == run.EXIT_OK
    assert report["ok"] is True
    assert report["failures"] == []
    assert captured.err == ""


def test_exit_one_and_the_failure_carries_gate_measured_and_limit(capsys):
    code, captured = invoke(capsys, "--kind", "post", "--lang", "en", "--file", str(FAILING_POST))
    report = report_of(captured)
    assert code == run.EXIT_FAILED
    assert report["ok"] is False
    assert report["failures"], "a failing run must list its failures"
    for failure in report["failures"]:
        assert failure["gate"]
        assert failure["measured"] is not None
        assert failure["limit"] is not None
        assert str(failure["limit"]) in failure["message"]
        assert failure["gate"] in captured.err, "the hook reads its reason text from stderr"


def test_json_only_keeps_stderr_clean(capsys):
    code, captured = invoke(
        capsys, "--kind", "post", "--lang", "en", "--file", str(FAILING_POST), "--json-only"
    )
    assert code == run.EXIT_FAILED
    assert captured.err == ""
    assert report_of(captured)["ok"] is False


def test_exit_two_on_a_missing_file(capsys):
    code, captured = invoke(capsys, "--kind", "article", "--file", "does/not/exist.md")
    assert code == run.EXIT_USAGE
    assert captured.out == ""
    assert "does/not/exist.md" in captured.err


def test_exit_two_on_an_unknown_kind(capsys):
    code, _ = invoke(capsys, "--kind", "novel", "--file", str(VALID_POST))
    assert code == run.EXIT_USAGE


def test_report_shape(capsys):
    _, captured = invoke(capsys, "--kind", "article", "--file", str(GOLDEN_ARTICLE), "--no-build")
    report = report_of(captured)
    assert set(report) == {"kind", "lang", "path", "ok", "gates_run", "failures", "results"}
    assert report["kind"] == "article"
    assert report["path"] == str(GOLDEN_ARTICLE)
    assert report["gates_run"] == sum(1 for r in report["results"] if r["ran"])
    for result in report["results"]:
        assert set(result) == {"gate", "ok", "message", "measured", "limit", "note", "ran", "detail"}


def test_the_post_language_reaches_the_report(capsys):
    _, captured = invoke(capsys, "--kind", "post", "--lang", "es", "--file", str(VALID_POST))
    assert report_of(captured)["lang"] == "es"

    _, captured = invoke(capsys, "--kind", "post", "--file", str(VALID_POST))
    assert report_of(captured)["lang"] == "en", "a post defaults to English"


def test_gate_order_is_cheapest_first_and_the_build_is_last(capsys):
    _, captured = invoke(capsys, "--kind", "article", "--file", str(GOLDEN_ARTICLE), "--no-build")
    gates = [r["gate"] for r in report_of(captured)["results"]]
    assert gates[-1] == build_gate.GATE
    assert gates.index("article.frontmatter") == 0
    assert gates.index("article.word_count") < gates.index("repetition.opening")
    assert gates.index("repetition.closing") < gates.index(build_gate.GATE)

    _, captured = invoke(capsys, "--kind", "post", "--lang", "en", "--file", str(VALID_POST))
    gates = [r["gate"] for r in report_of(captured)["results"]]
    assert gates[0] == "post.hook_line"
    assert gates.index("post.hook_chars") < gates.index("post.body_chars")
    assert build_gate.GATE not in gates, "a post is not built"


def test_the_build_gate_is_skipped_when_a_cheaper_gate_failed(tmp_path, capsys, monkeypatch):
    """Skipped, not passed: `ran: false` is what stops the report reading as clean."""

    def refuse(*_args, **_kw):
        raise AssertionError("the build ran after a cheaper gate had already failed")

    monkeypatch.setattr(build_gate.subprocess, "run", refuse)

    candidate = tmp_path / "candidate.md"
    candidate.write_text(
        GOLDEN_ARTICLE.read_text().replace("tags: [llm-serving", "tags: [not-a-tag"), encoding="utf-8"
    )

    code, captured = invoke(capsys, "--kind", "article", "--file", str(candidate))
    report = report_of(captured)
    assert code == run.EXIT_FAILED

    build_result = [r for r in report["results"] if r["gate"] == build_gate.GATE][0]
    assert build_result["ran"] is False
    assert "article.tag_vocabulary" in build_result["message"]
    assert build_result["gate"] not in [f["gate"] for f in report["failures"]]
    assert "article.tag_vocabulary" in [f["gate"] for f in report["failures"]]


def test_no_build_records_the_build_gate_as_not_run(capsys):
    _, captured = invoke(capsys, "--kind", "article", "--file", str(GOLDEN_ARTICLE), "--no-build")
    build_result = [r for r in report_of(captured)["results"] if r["gate"] == build_gate.GATE][0]
    assert build_result["ran"] is False
    assert "--no-build" in build_result["message"]
