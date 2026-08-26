"""The single home for every threshold, blacklist and stage->backend mapping.

Nothing numeric that a gate enforces, and nothing a prompt asserts, is written
anywhere else in this repository. `agent/tests/test_config_is_single_source.py`
fails the suite if a threshold literal reappears in a gate or a prompt.

Provenance of the values below:

* The LinkedIn post rules — length band, hook limits, the opener ban, the
  blacklists, the em-dash and emoji ceilings, the hashtag maximum, the
  at-least-one-digit rule — are transcribed from the publishing rules in the
  author's private hub (`linkedin/content.md` section "Reglas de publicación",
  revised 2026-08-24 against measured studies) and from the `Validate Post`
  node of the n8n workflow `BWwqfgrwtJWDCD40` that implemented them. Each
  carries its measured justification in a comment.
* The article bands are calibrated against the three published articles that
  live in `agent/goldens/`, not chosen in the abstract. `test_goldens.py`
  is the brake: tighten one of these past what the author already published
  and the suite says so.
"""

from __future__ import annotations

import os
from pathlib import Path

# ── Repository geography ────────────────────────────────────────────────────
# Everything is derived from this file's own location so the gates work from
# any working directory: a hook runs them from the session cwd, pytest runs
# them from `agent/`, the driver runs them from the repository root.

AGENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = AGENT_DIR.parent

CONTENT_DIR = REPO_ROOT / "src" / "content" / "blog"
TAGS_SOURCE = REPO_ROOT / "src" / "tags.ts"
STATE_DIR = AGENT_DIR / "state"
PROMPTS_DIR = AGENT_DIR / "prompts"
GOLDENS_DIR = AGENT_DIR / "goldens"

SITE_URL = "https://salvadorfcriado.com"

# The build gate runs the repository's own build. `prebuild` renders the Open
# Graph card, so `npm run build` is the whole acceptance test for an article.
BUILD_COMMAND = ["npm", "run", "build"]
BUILD_TIMEOUT_SECONDS = 300


# ── Shared text limits ──────────────────────────────────────────────────────

# LinkedIn's own hard ceiling is 3000 characters. The measured engagement peak
# sits at 1301-2500 (AuthoredUp, 372126 posts), so the band is drawn inside it.
POST_BODY_MIN_CHARS = 1400
POST_BODY_MAX_CHARS = 2400

# The mobile truncation point, and the "…see more" tap is the dwell-time signal
# that decides distribution. Both limits bind: a 15-word hook can still be long.
POST_HOOK_MAX_CHARS = 140
POST_HOOK_MAX_WORDS = 15

# Umbrella tags add no reach; the ranker reads the body. Three niche ones is
# the ceiling the rules settled on.
POST_MAX_HASHTAGS = 3

# A post carries at least one measurement, threshold, version or named failure
# mode. It is the one thing a model cannot fabricate without lying.
POST_MIN_DIGITS = 1

# One em dash per post, preferably none. Machine prose reaches for them.
POST_MAX_EM_DASHES = 1

# One emoji in total, never as a bullet.
POST_MAX_EMOJI = 1

# Articles are long-form and the author's own published prose runs a little
# over one em dash per hundred words. The ceiling is a density rather than a
# count so length does not mechanically fail a piece, set above the goldens'
# observed maximum (1.02 per 100 words) and well below the 3-4 per 100 words
# that unedited model prose produces.
ARTICLE_MAX_EM_DASHES_PER_100_WORDS = 1.5

ARTICLE_MAX_EMOJI = 0

# The three published articles run 1816-2408 words. The band gives room either
# side without admitting a listicle or an unreadable wall.
ARTICLE_MIN_WORDS = 1200
ARTICLE_MAX_WORDS = 3500

# `excerpt` is rendered verbatim as the meta description, og:description, the
# RSS item description and the BlogPosting description. The 160 ceiling is the
# content schema's own (src/content.config.ts) and is restated here only
# because the gate must fail before the build does; the floor is the site's,
# to keep a one-clause excerpt out.
ARTICLE_EXCERPT_MIN_CHARS = 80
ARTICLE_EXCERPT_MAX_CHARS = 160

# src/tags.ts: a post declares 1-3 tags, the first one primary.
ARTICLE_MIN_TAGS = 1
ARTICLE_MAX_TAGS = 3

# The slug becomes the article's filename and its public URL. Renaming an
# active one breaks the URL and needs a redirect rule on the zone, so the cap is
# applied at a word boundary rather than mid-word.
SLUG_MAX_CHARS = 70

ARTICLE_REQUIRED_FRONTMATTER = ("title", "date", "tags", "excerpt", "readingTime")

# `.strict()` on the content schema drops nothing in silence, so an unknown key
# is a build failure. The gate names it first, in less than a second.
ARTICLE_ALLOWED_FRONTMATTER = ARTICLE_REQUIRED_FRONTMATTER + ("cover", "draft")


# ── Machine-writing blacklists ──────────────────────────────────────────────
# Every entry is a regular expression, matched case-insensitively. The value is
# the human-readable name the failure message uses.

# Openers. All of these read as a model or as a 2023 growth hacker. The
# "It's not X, it's Y" pattern is named explicitly in LinkedIn's May 2026
# announcement about downranking generic content.
BANNED_OPENERS = {
    r"^everyone\s+\w+.{0,40}\balmost nobody\b": "Everyone X. Almost nobody Y.",
    r"^most people (think|believe|assume)\b": "Most people think X.",
    r"\bit'?s not\b[^.!?]{1,60}\bit'?s\b": "It's not X, it's Y.",
    r"^here'?s the thing\b": "Here's the thing:",
    r"^let that sink in\b": "Let that sink in.",
    r"^read that again\b": "Read that again.",
    r"^unpopular opinion\b": "Unpopular opinion:",
    r"^hot take\b": "Hot take:",
    r"^plot twist\b": "Plot twist:",
    r"^here'?s what nobody tells you\b": "Here's what nobody tells you.",
    r"^let me explain\b": "Let me explain.",
    r"^buckle up\b": "Buckle up.",
    r"^in today'?s fast[- ]paced world\b": "In today's fast-paced world",
    r"^in the ever[- ]evolving\b": "In the ever-evolving landscape",
    r"^\w+\.$": "one-word dramatic fragment (Silence. / Wrong.)",
}

# Vocabulary and tics. Anchored where the literal use is legitimate: the
# author's own published articles use "replay harness" (a noun), "robust"
# (a technical claim) and "highest-leverage" (a compound adjective), and a
# blacklist that rejects work already published is a miscalibrated blacklist.
BANNED_PHRASES = {
    r"\bdelv(e|es|ed|ing)\b": "delve",
    r"\b(the|a|this|that|our|its)\s+\w*\s*landscape\b": "landscape (figurative)",
    r"\b(the|a|this|my|our|your)\s+journey\b": "journey",
    r"\btapestry\b": "tapestry",
    r"\bmultifaceted\b": "multifaceted",
    r"\bpivotal\b": "pivotal",
    r"\brealm\b": "realm",
    r"(?<![-\w])leverag(e|es|ed|ing)\s+(the|a|our|your|this)\b": "leverage (verb)",
    r"\bunderscor(e|es|ed|ing)\b": "underscore",
    r"\bstreamlin(e|es|ed|ing)\b": "streamline",
    r"\bseamless(ly)?\b": "seamless",
    r"\bharness(es|ing|ed)?\s+the\b": "harness (verb)",
    r"\bunlock(s|ing|ed)?\s+(the|a|new|your)\b": "unlock (figurative)",
    r"\ba testament to\b": "testament",
    r"\bnavigat(e|es|ed|ing)\s+(the|this|a)\s+(complex|challeng|land|world|maze)": "navigate (figurative)",
    r"\bgame[- ]chang(er|ing)\b": "game-changer",
    r"\bfoster(s|ing|ed)?\s+(a|an|the)\b": "foster",
    r"\bat the end of the day\b": "at the end of the day",
    r"\bthe reality is\b": "the reality is",
    r"\bthat said,": "that said,",
    r"\bit'?s important to note\b": "it's important to note",
}

# LinkedIn actively suppresses these.
ENGAGEMENT_BAIT = {
    r"\bcomment\s+(yes|below)\b": "Comment YES",
    r"\bagree\?": "Agree?",
    r"\bthoughts\?": "Thoughts?",
    r"\bsave this\b": "Save this",
    r"\bfollow (me )?for more\b": "Follow for more",
    r"\bdouble tap\b": "Double tap",
    r"\bdrop a\s+\w+\s+(below|in the comments)\b": "Drop a X below",
    r"\btag someone\b": "Tag someone",
}

# Applied to articles as well as posts. The subset is the unambiguous machine
# tells: constructions that carry no legitimate technical reading, so they can
# be enforced on long-form prose without fighting the goldens.
ARTICLE_BANNED_PHRASES = {
    key: name
    for key, name in BANNED_PHRASES.items()
    if name
    in {
        "delve",
        "tapestry",
        "multifaceted",
        "pivotal",
        "realm",
        "testament",
        "game-changer",
        "at the end of the day",
        "the reality is",
        "it's important to note",
    }
}

# Language overrides. Spanish carries its own tells and is not subject to the
# English ones that cannot appear in it. A language key absent from either map
# means "shared rules only".
LANG_EXTRA_BANNED_PHRASES = {
    "es": {
        r"\ben el mundo actual\b": "en el mundo actual",
        r"\bcabe destacar\b": "cabe destacar",
        r"\bes importante (señalar|destacar|mencionar)\b": "es importante señalar",
        r"\bsumergirnos\b": "sumergirnos",
        r"\bun antes y un después\b": "un antes y un después",
        r"\bno es X,? es Y\b": "no es X, es Y",
        r"\bel panorama\b": "el panorama (figurado)",
        r"\bpotenciar\s+(el|la|los|las|tu|su)\b": "potenciar",
        r"\bdesbloquea(r|ndo)?\s+(el|la|todo)\b": "desbloquear (figurado)",
    },
}

# Blacklist entries that only make sense in English, skipped for other
# languages so a Spanish post is not measured against grammar it cannot have.
LANG_SKIPPED_BANNED_PHRASES = {
    "es": {"that said,", "it's important to note", "at the end of the day", "the reality is"},
}

LANG_EXTRA_BANNED_OPENERS = {
    "es": {
        r"^todo el mundo\b.{0,40}\bcasi nadie\b": "Todo el mundo X. Casi nadie Y.",
        r"^la mayoría (piensa|cree|asume)\b": "La mayoría piensa X.",
        r"^opinión impopular\b": "Opinión impopular:",
        r"^que eso cale\b": "Que eso cale.",
    },
}

LANG_EXTRA_ENGAGEMENT_BAIT = {
    "es": {
        r"\bcomenta\s+(sí|si|abajo)\b": "Comenta SÍ",
        r"\b¿(estás de acuerdo|opiniones)\?": "¿Estás de acuerdo?",
        r"\bguarda este post\b": "Guarda este post",
        r"\bsígueme para más\b": "Sígueme para más",
    },
}

# Per-language threshold overrides. Spanish runs about 15-25% longer than
# English for the same content, so the body band and the hook character limit
# would otherwise force a thinner Spanish post. The word limit does not move:
# it is a reading-speed limit, not a typography one.
LANG_THRESHOLD_OVERRIDES = {
    "es": {
        "POST_BODY_MIN_CHARS": 1500,
        "POST_BODY_MAX_CHARS": 2600,
        "POST_HOOK_MAX_CHARS": 150,
    },
}


# ── Repetition ──────────────────────────────────────────────────────────────
# Similarity is a token-level ratio in [0, 1]. The threshold is a first
# plausible value, flagged as such in the proposal's open questions; the
# goldens are the calibration set that will move it.

REPETITION_SIMILARITY_THRESHOLD = 0.60

# How much of the tail counts as "the closing move".
REPETITION_CLOSING_LINES = 3


# ── Placeholders ────────────────────────────────────────────────────────────
# Markers a draft may legitimately carry mid-flight and may never carry at a
# gate. `Huecos por rellenar` is the author's own convention for the block that
# records what only he can supply; it must never survive into a published file.

PLACEHOLDER_MARKERS = (
    r"\bTODO\b",
    r"\bTKTK\b",
    r"\bFIXME\b",
    r"\bXXX\b",
    r"\[[^\]]*\b(placeholder|insert|fill in|your \w+ here)\b[^\]]*\]",
    r"\{\{[^}]+\}\}",
    r"<[A-Z_]{3,}>",
    r"Huecos por rellenar",
    r"\bLorem ipsum\b",
)


# ── Pipeline ────────────────────────────────────────────────────────────────

STAGES = (
    "plan",
    "write",
    "critique",
    "revise",
    "post_en",
    "post_es",
    "package",
    "publish",
)

# Approval points, keyed by the stage after which the pipeline stops.
APPROVAL_POINTS = {
    "plan": "outline",
    "revise": "article",
    "package": "package",
}

# Only the outline approval is waivable, and only by an explicit flag that is
# recorded in the state file.
WAIVABLE_APPROVALS = ("outline",)

# Revision attempts per stage before the run halts and hands the outstanding
# gate report to the operator. Enforced revision plateaus fast; a cap of three
# spends one round on the mechanical failure, one on its consequences, and one
# on a genuine rewrite.
MAX_STAGE_ATTEMPTS = 3

# The critic scores against a rubric out of this maximum, and a piece below the
# floor goes back to `revise` rather than to the operator.
CRITIC_SCORE_MAX = 25
CRITIC_SCORE_FLOOR = 18


# ── Model backends ──────────────────────────────────────────────────────────
# A stage is reassigned to another backend by editing this map and nothing
# else. `mock` is the deterministic backend the test suite runs against, and
# the reason the end-to-end test spends no tokens.

BACKEND_CLAUDE_CODE = "claude_code"
BACKEND_API = "api"
BACKEND_MOCK = "mock"

DEFAULT_BACKEND = os.environ.get("AGENT_DEFAULT_BACKEND", BACKEND_CLAUDE_CODE)

STAGE_BACKENDS = {
    "plan": DEFAULT_BACKEND,
    "write": DEFAULT_BACKEND,
    "critique": DEFAULT_BACKEND,
    "revise": DEFAULT_BACKEND,
    "post_en": DEFAULT_BACKEND,
    "post_es": DEFAULT_BACKEND,
}

# Claude Code headless. Runs under the operator's own subscription, which is
# why the marginal cost of a run is effectively zero and why it is the default.
CLAUDE_CODE_BINARY = os.environ.get("AGENT_CLAUDE_BINARY", "claude")
CLAUDE_CODE_TIMEOUT_SECONDS = 900

# Hosted API. The documented fallback, so someone who clones this repository
# can run the pipeline with their own key. Nothing here is a credential.
API_BASE_URL = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
API_KEY_ENV = "ANTHROPIC_API_KEY"
API_MODEL = os.environ.get("AGENT_API_MODEL", "claude-sonnet-4-5")
API_MAX_TOKENS = 8000
API_TIMEOUT_SECONDS = 600

# Where the mock backend reads canned stage responses from, for tests and for
# an end-to-end rehearsal that spends nothing.
MOCK_FIXTURES_DIR = AGENT_DIR / "tests" / "fixtures" / "backend"


# ── Publishing ──────────────────────────────────────────────────────────────

PUBLISH_BRANCH_PREFIX = "post/"
PUBLISH_BASE_BRANCH = "main"

# The deployed-URL probe. LinkedIn caches a preview on first fetch, so the
# handoff is withheld until the article's own URL answers.
DEPLOY_PROBE_TIMEOUT_SECONDS = 10
DEPLOY_PROBE_ATTEMPTS = 20
DEPLOY_PROBE_INTERVAL_SECONDS = 15
DEPLOY_PROBE_OK_STATUS = 200

# Where the hashtags sit in the handed-over post text.
HASHTAG_POSITION = "end"


def thresholds_for(lang: str | None) -> dict[str, int]:
    """Shared post thresholds with any per-language override applied."""
    base = {
        "POST_BODY_MIN_CHARS": POST_BODY_MIN_CHARS,
        "POST_BODY_MAX_CHARS": POST_BODY_MAX_CHARS,
        "POST_HOOK_MAX_CHARS": POST_HOOK_MAX_CHARS,
        "POST_HOOK_MAX_WORDS": POST_HOOK_MAX_WORDS,
        "POST_MAX_HASHTAGS": POST_MAX_HASHTAGS,
        "POST_MIN_DIGITS": POST_MIN_DIGITS,
        "POST_MAX_EM_DASHES": POST_MAX_EM_DASHES,
        "POST_MAX_EMOJI": POST_MAX_EMOJI,
    }
    base.update(LANG_THRESHOLD_OVERRIDES.get(lang or "", {}))
    return base


def banned_phrases_for(lang: str | None) -> dict[str, str]:
    """Shared blacklist plus this language's entries, minus what cannot apply."""
    skipped = LANG_SKIPPED_BANNED_PHRASES.get(lang or "", set())
    phrases = {k: v for k, v in BANNED_PHRASES.items() if v not in skipped}
    phrases.update(LANG_EXTRA_BANNED_PHRASES.get(lang or "", {}))
    return phrases


def banned_openers_for(lang: str | None) -> dict[str, str]:
    openers = dict(BANNED_OPENERS)
    openers.update(LANG_EXTRA_BANNED_OPENERS.get(lang or "", {}))
    return openers


def engagement_bait_for(lang: str | None) -> dict[str, str]:
    bait = dict(ENGAGEMENT_BAIT)
    bait.update(LANG_EXTRA_ENGAGEMENT_BAIT.get(lang or "", {}))
    return bait
