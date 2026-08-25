"""One failing case per gate, plus the two properties every gate must have.

Each case asserts the gate's identifier, the measured value and the configured
limit as they appear in the report, because those three are the revision signal
the pipeline feeds back to a model. A test that only asserted `ok is False`
would pass through a report that said nothing useful.

No literal threshold appears here either. Inputs are built from the configured
value — a hook of `limit + 1` words — so the tests keep working when a limit
moves, and cannot quietly restate one.
"""

from __future__ import annotations

import datetime
import socket
from pathlib import Path

import pytest
import yaml

from agent import config
from agent.gates import antislop, article, build, post, repetition, run, tags

FIXTURES = Path(__file__).parent / "fixtures"
VALID_POST = FIXTURES / "post_valid.en.md"
GOLDEN_ARTICLE = config.GOLDENS_DIR / "articles" / "temperature-zero-is-not-deterministic.md"


def result(results, gate):
    """The one result for this gate, asserting it is present exactly once."""
    matching = [r for r in results if r.gate == gate]
    assert len(matching) == 1, f"expected exactly one {gate} result, got {len(matching)}"
    return matching[0]


def failure(results, gate):
    found = result(results, gate)
    assert not found.ok, f"{gate} passed, expected a failure: {found.message}"
    assert str(found.limit) in found.message, f"{gate} message does not name its limit: {found.message}"
    return found


# ── Post gates ──────────────────────────────────────────────────────────────

LIMITS = config.thresholds_for("en")


def build_post(hook="Latency fell by 41% when we deleted a step.", body=None, tags_line="#LLMOps"):
    filler = "The classifier read two sentences and answered from a lookup table. " * 22
    return f"{hook}\n\n{body if body is not None else filler}\n\n{tags_line}\n"


def test_hook_line_fails_when_the_opening_paragraph_runs_on():
    text = build_post(hook="A hook that runs on\ninto a second line before the blank one")
    found = failure(post.check_post(text, "en"), "post.hook_line")
    assert found.measured == 2
    assert found.limit == 1


def test_hook_chars_fails_above_the_configured_ceiling():
    limit = LIMITS["POST_HOOK_MAX_CHARS"]
    hook = "Latency fell by 41% on the day we deleted one step from the chain, " + "x" * limit
    found = failure(post.check_post(build_post(hook=hook), "en"), "post.hook_chars")
    assert found.measured == len(hook)
    assert found.limit == limit


def test_hook_words_fails_above_the_configured_word_limit():
    limit = LIMITS["POST_HOOK_MAX_WORDS"]
    hook = " ".join(["step"] * (limit + 1)) + " 41%"
    found = failure(post.check_post(build_post(hook=hook), "en"), "post.hook_words")
    assert found.measured == limit + 2
    assert found.limit == limit


def test_hook_question_fails():
    found = failure(
        post.check_post(build_post(hook="Why did p95 latency fall by 41%?"), "en"),
        "post.hook_question",
    )
    assert found.measured == 1
    assert found.limit == 0


def test_banned_opener_names_the_construction_and_its_position():
    found = failure(
        post.check_post(build_post(hook="Unpopular opinion: 41% of your chain is dead weight."), "en"),
        "post.banned_opener",
    )
    assert found.measured == 1
    assert found.limit == 0
    assert found.detail["matches"][0]["construction"] == config.BANNED_OPENERS[r"^unpopular opinion\b"]
    assert found.detail["matches"][0]["char_offset"] == 0


def test_body_chars_fails_below_the_band():
    text = build_post(body="One short paragraph carrying 1 number and nothing else.")
    found = failure(post.check_post(text, "en"), "post.body_chars")
    assert found.measured == len(post.split_post(text).body)
    assert found.limit == f"{LIMITS['POST_BODY_MIN_CHARS']}-{LIMITS['POST_BODY_MAX_CHARS']}"


def test_digits_fails_when_the_body_carries_no_number():
    text = build_post(hook="Latency fell on the day we deleted a step.")
    found = failure(post.check_post(text, "en"), "post.digits")
    assert found.measured == 0
    assert found.limit == LIMITS["POST_MIN_DIGITS"]


def test_hashtags_fails_above_the_maximum():
    limit = LIMITS["POST_MAX_HASHTAGS"]
    line = " ".join(f"#Tag{i}" for i in range(limit + 1))
    found = failure(post.check_post(build_post(tags_line=line), "en"), "post.hashtags")
    assert found.measured == limit + 1
    assert found.limit == limit


def test_markdown_fails_and_a_hashtag_is_not_a_heading():
    text = build_post(body="## A heading\n\nAnd **bold** and a [link](https://example.com) and 41%.")
    found = failure(post.check_post(text, "en"), "post.markdown")
    assert found.measured == len(found.detail["matches"])
    assert found.limit == 0
    assert {m["construction"] for m in found.detail["matches"]} == {
        "Markdown heading",
        "Markdown bold",
        "Markdown link",
    }
    assert post.check_post(build_post(tags_line="#RAG"), "en")
    assert result(post.check_post(build_post(tags_line="#RAG"), "en"), "post.markdown").ok


def test_em_dashes_fails_above_the_ceiling():
    limit = LIMITS["POST_MAX_EM_DASHES"]
    body = " and 41% ".join(["prose"] * (limit + 2)).replace("and", "—")
    found = failure(post.check_post(build_post(body=body), "en"), "post.em_dashes")
    assert found.measured == limit + 1
    assert found.limit == limit


def test_emoji_fails_above_the_ceiling():
    limit = LIMITS["POST_MAX_EMOJI"]
    body = "Shipped 41% faster " + "\U0001f680" * (limit + 1)
    found = failure(post.check_post(build_post(body=body), "en"), "post.emoji")
    assert found.measured == limit + 1
    assert found.limit == limit


def test_banned_phrases_names_the_construction_and_its_position():
    text = build_post(body="Let us delve into the 41% and what it costs.")
    found = failure(post.check_post(text, "en"), "post.banned_phrases")
    assert found.measured == 1
    assert found.limit == 0
    assert found.detail["matches"][0]["construction"] == "delve"
    assert found.detail["matches"][0]["char_offset"] == text.index("delve")


def test_engagement_bait_fails():
    found = failure(post.check_post(build_post(body="41% cheaper. Thoughts?"), "en"), "post.engagement_bait")
    assert found.measured == 1
    assert found.limit == 0


def test_language_overrides_apply_without_a_second_gate():
    """Spanish carries its own band and its own tells; English-only entries lapse."""
    assert config.thresholds_for("es")["POST_BODY_MIN_CHARS"] > LIMITS["POST_BODY_MIN_CHARS"]

    hook = "Bajamos un 41% la latencia al borrar un paso."
    between = (LIMITS["POST_BODY_MIN_CHARS"] + config.thresholds_for("es")["POST_BODY_MIN_CHARS"]) // 2
    text = build_post(hook=hook, body="x" * (between - len(hook) - len("\n\n")))
    assert len(post.split_post(text).body) == between
    assert result(post.check_post(text, "en"), "post.body_chars").ok
    assert not result(post.check_post(text, "es"), "post.body_chars").ok

    spanish_tell = build_post(body="Cabe destacar que bajamos 41% la latencia.")
    assert not result(post.check_post(spanish_tell, "es"), "post.banned_phrases").ok
    assert result(post.check_post(spanish_tell, "en"), "post.banned_phrases").ok

    english_only = build_post(body="That said, we cut 41% of the latency.")
    assert not result(post.check_post(english_only, "en"), "post.banned_phrases").ok
    assert result(post.check_post(english_only, "es"), "post.banned_phrases").ok


# ── Article gates ───────────────────────────────────────────────────────────

FRONTMATTER = {
    "title": "A candidate article",
    "date": datetime.date(2026, 8, 25),
    "tags": [tags.vocabulary()[0]],
    "excerpt": "An excerpt long enough to serve as the meta description, the OG description and the RSS item description.",
    "readingTime": 9,
}


def build_article(body=None, **overrides):
    data = {**FRONTMATTER, **overrides}
    for key in [k for k, v in overrides.items() if v is None]:
        data.pop(key, None)
    words = " ".join(["prose"] * (config.ARTICLE_MIN_WORDS + config.ARTICLE_MIN_TAGS))
    front = yaml.safe_dump(data, sort_keys=False, allow_unicode=True).strip()
    return f"---\n{front}\n---\n\n{body if body is not None else words}\n"


def test_the_article_builder_passes_every_gate():
    """The base the mutations start from, so each failure below has one cause."""
    assert [r.gate for r in article.check_article(build_article()) if not r.ok] == []


def test_frontmatter_fails_when_there_is_no_block():
    found = failure(article.check_article("A body with no frontmatter at all.\n"), "article.frontmatter")
    assert found.measured == 0
    assert found.limit == 1


def test_frontmatter_required_names_the_missing_field():
    required = config.ARTICLE_REQUIRED_FRONTMATTER
    found = failure(article.check_article(build_article(excerpt=None)), "article.frontmatter_required")
    assert found.measured == len(required) - 1
    assert found.limit == len(required)
    assert found.detail["missing"] == ["excerpt"]


def test_frontmatter_required_names_a_mistyped_field():
    found = failure(article.check_article(build_article(readingTime="nine")), "article.frontmatter_required")
    assert found.detail["mistyped"] == ["readingTime: str, expected int"]


def test_frontmatter_unknown_names_the_key_outside_the_schema():
    found = failure(article.check_article(build_article(subtitle="not a schema key")), "article.frontmatter_unknown")
    assert found.measured == 1
    assert found.limit == 0
    assert found.detail["unknown"] == ["subtitle"]


def test_tag_vocabulary_fails_naming_the_offending_slug():
    found = failure(article.check_article(build_article(tags=["not-a-tag"])), "article.tag_vocabulary")
    assert found.measured == ["not-a-tag"]
    assert found.limit == list(tags.vocabulary())


def test_tag_count_fails_above_the_maximum():
    too_many = list(tags.vocabulary())[: config.ARTICLE_MAX_TAGS + 1]
    found = failure(article.check_article(build_article(tags=too_many)), "article.tag_count")
    assert found.measured == config.ARTICLE_MAX_TAGS + 1
    assert found.limit == f"{config.ARTICLE_MIN_TAGS}-{config.ARTICLE_MAX_TAGS}"


def test_excerpt_fails_below_the_band():
    excerpt = "x" * (config.ARTICLE_EXCERPT_MIN_CHARS - 1)
    found = failure(article.check_article(build_article(excerpt=excerpt)), "article.excerpt_chars")
    assert found.measured == len(excerpt)
    assert found.limit == f"{config.ARTICLE_EXCERPT_MIN_CHARS}-{config.ARTICLE_EXCERPT_MAX_CHARS}"


def test_word_count_fails_below_the_band():
    body = " ".join(["prose"] * (config.ARTICLE_MIN_WORDS - 1))
    found = failure(article.check_article(build_article(body=body)), "article.word_count")
    assert found.measured == config.ARTICLE_MIN_WORDS - 1
    assert found.limit == f"{config.ARTICLE_MIN_WORDS}-{config.ARTICLE_MAX_WORDS}"


def test_placeholders_fails_naming_the_marker_and_its_position():
    body = " ".join(["prose"] * config.ARTICLE_MIN_WORDS) + " TODO: the number goes here"
    text = build_article(body=body)
    found = failure(article.check_article(text), "article.placeholders")
    assert found.measured == 1
    assert found.limit == 0
    assert found.detail["matches"][0]["char_offset"] == text.index("TODO")


def test_em_dash_density_fails_above_the_ceiling():
    words = ["prose"] * config.ARTICLE_MIN_WORDS
    over = int(config.ARTICLE_MAX_EM_DASHES_PER_100_WORDS * config.ARTICLE_MIN_WORDS / 100) + 1
    for i in range(over):
        words[i] = "—"
    found = failure(article.check_article(build_article(body=" ".join(words))), "article.em_dash_density")
    assert found.measured > config.ARTICLE_MAX_EM_DASHES_PER_100_WORDS
    assert found.limit == config.ARTICLE_MAX_EM_DASHES_PER_100_WORDS
    assert found.detail["em_dashes"] == over


def test_article_emoji_fails_above_the_ceiling():
    body = " ".join(["prose"] * config.ARTICLE_MIN_WORDS) + " \U0001f680" * (config.ARTICLE_MAX_EMOJI + 1)
    found = failure(article.check_article(build_article(body=body)), "article.emoji")
    assert found.measured == config.ARTICLE_MAX_EMOJI + 1
    assert found.limit == config.ARTICLE_MAX_EMOJI


def test_article_banned_phrases_uses_the_subset():
    subset = list(config.ARTICLE_BANNED_PHRASES.values())
    assert "pivotal" in subset and "seamless" not in subset
    body = " ".join(["prose"] * config.ARTICLE_MIN_WORDS) + " a pivotal moment"
    found = failure(article.check_article(build_article(body=body)), "article.banned_phrases")
    assert found.measured == 1
    assert found.limit == 0
    assert found.detail["matches"][0]["construction"] == "pivotal"


def test_a_new_tag_in_the_source_is_accepted_without_editing_the_gate(tmp_path):
    """The vocabulary is parsed from src/tags.ts, reserve comment excluded."""
    source = tmp_path / "tags.ts"
    source.write_text(
        "/* Reserve vocabulary, deliberately not in the enum:\n"
        "     slug: 'reserved-and-not-real'\n"
        "*/\n"
        "export const TAGS = [\n"
        "  { slug: 'rag', label: 'RAG', blurb: 'x' },\n"
        "  { slug: 'brand-new-tag', label: 'New', blurb: 'y' },\n"
        "] as const satisfies readonly Tag[];\n",
        encoding="utf-8",
    )
    assert tags.vocabulary(source) == ("rag", "brand-new-tag")
    assert result(tags.check_tags(["brand-new-tag"], source), "article.tag_vocabulary").ok


# ── Repetition ──────────────────────────────────────────────────────────────


def corpus_piece(name, opening, closing):
    return repetition.CorpusPiece(
        name=name, slug=name, opening=opening, closing=closing, fingerprint=name
    )


def test_repetition_opening_fails_naming_the_matched_piece():
    opener = "Nobody's pipeline breaks, it quietly stops being right."
    corpus = [corpus_piece("published/earlier.md", opener, "an unrelated close")]
    found = failure(
        repetition.check_repetition(f"{opener}\n\nA different body entirely.\n", corpus=corpus),
        "repetition.opening",
    )
    assert found.measured > config.REPETITION_SIMILARITY_THRESHOLD
    assert found.limit == config.REPETITION_SIMILARITY_THRESHOLD
    assert found.detail["matched"] == "published/earlier.md"


def test_repetition_closing_fails_naming_the_matched_piece():
    close = "Do that multiplication before your roadmap does it for you."
    corpus = [corpus_piece("published/earlier.md", "an unrelated opener", close)]
    found = failure(
        repetition.check_repetition(f"An opener of its own.\n\n{close}\n", corpus=corpus),
        "repetition.closing",
    )
    assert found.detail["matched"] == "published/earlier.md"
    assert found.limit == config.REPETITION_SIMILARITY_THRESHOLD


def test_repetition_passes_and_records_an_empty_corpus():
    results = repetition.check_repetition("An opener.\n\nA close.\n", corpus=[])
    assert [r.ok for r in results] == [True, True]
    assert all("corpus was empty" in (r.note or "") for r in results)


def test_repetition_ignores_the_candidate_s_own_pair():
    golden_post = config.GOLDENS_DIR / "posts" / "the-half-nobody-put-on-call.en.md"
    assert [r.ok for r in repetition.check_repetition(golden_post.read_text(), path=golden_post)] == [
        True,
        True,
    ]


# ── Build gate ──────────────────────────────────────────────────────────────


def test_build_failure_carries_the_command_output(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "CONTENT_DIR", tmp_path / "content")
    monkeypatch.setattr(config, "STATE_DIR", tmp_path / "state")
    candidate = tmp_path / "candidate.md"
    candidate.write_text("---\ntitle: x\n---\n\nbody\n", encoding="utf-8")

    import subprocess

    def fake_run(*_args, **_kw):
        return subprocess.CompletedProcess(
            args=config.BUILD_COMMAND, returncode=1, stdout="building\n", stderr="ZodError: tags\n"
        )

    monkeypatch.setattr(build.subprocess, "run", fake_run)
    found = build.check_build(candidate)
    assert found.gate == "article.build"
    assert not found.ok
    assert found.measured == 1
    assert found.limit == 0
    assert "ZodError: tags" in found.detail["output"]
    assert not (tmp_path / "content" / "candidate.md").exists(), "the gate left the collection changed"


def test_build_verdict_is_cached_against_the_content_hash(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "CONTENT_DIR", tmp_path / "content")
    monkeypatch.setattr(config, "STATE_DIR", tmp_path / "state")
    candidate = tmp_path / "candidate.md"
    candidate.write_text("---\ntitle: x\n---\n\nbody\n", encoding="utf-8")

    calls = []

    def fake_run(*_args, **_kw):
        import subprocess

        calls.append(1)
        return subprocess.CompletedProcess(args=config.BUILD_COMMAND, returncode=0, stdout="", stderr="")

    monkeypatch.setattr(build.subprocess, "run", fake_run)
    first = build.check_build(candidate)
    second = build.check_build(candidate)
    assert first.ok and second.ok
    assert calls == [1], "the second run should have been served from the cache"
    assert build.cache_path().exists()
    assert build.content_hash(candidate.read_text()) in build.cache_path().read_text()

    candidate.write_text("---\ntitle: x\n---\n\nbody, edited\n", encoding="utf-8")
    build.check_build(candidate)
    assert len(calls) == 2, "an edit must invalidate the cached verdict"


# ── Properties every gate must have ─────────────────────────────────────────


def test_the_same_input_twice_produces_an_identical_report():
    first = run.gate_file("article", GOLDEN_ARTICLE, GOLDEN_ARTICLE.read_text(), run_build=False)
    second = run.gate_file("article", GOLDEN_ARTICLE, GOLDEN_ARTICLE.read_text(), run_build=False)
    assert first.to_json() == second.to_json()

    text = VALID_POST.read_text()
    assert (
        run.gate_file("post", VALID_POST, text, lang="en").to_json()
        == run.gate_file("post", VALID_POST, text, lang="en").to_json()
    )


def test_no_gate_but_the_build_touches_the_network(monkeypatch):
    def refuse(*_args, **_kw):
        raise AssertionError("a gate opened a socket")

    monkeypatch.setattr(socket, "socket", refuse)
    monkeypatch.setattr(socket, "create_connection", refuse)

    article_report = run.gate_file(
        "article", GOLDEN_ARTICLE, GOLDEN_ARTICLE.read_text(), run_build=False
    )
    post_report = run.gate_file("post", VALID_POST, VALID_POST.read_text(), lang="en")
    assert article_report.ok
    assert post_report.ok


def test_every_golden_article_passes_every_article_gate():
    """The calibration set. A gate that rejects published work is miscalibrated."""
    for path in sorted((config.GOLDENS_DIR / "articles").glob("*.md")):
        report = run.gate_file("article", path, path.read_text(), run_build=False)
        assert report.ok, report.reason_text()
