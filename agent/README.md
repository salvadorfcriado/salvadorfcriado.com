# `agent/` — the content pipeline

**Why Python sits in a TypeScript repository.** This directory is a staged, gated
pipeline that drafts a blog post and its LinkedIn package, and it lives here rather
than in a repository of its own because its acceptance test *is* this working tree:
the build gate runs `npm run build` on the candidate article, publishing is a file
written into `src/content/blog/`, and the preview is a Cloudflare Pages deployment of
the branch. Nothing here touches the Node toolchain. Cloudflare Pages runs
`npm run build`; `.py` files are inert to it. Deleting this directory removes the
pipeline and changes nothing about the site.

**Where the engineering is.** Not in the driver. `piece.py` is a small state machine
that orders work, and it deliberately replaces an orchestration framework — the flow
is linear with two bounded loops, and a JSON state file, an approval field and an `if`
supply everything a framework would have been used for. The part worth reading is
`gates/`: pure, tested, model-free functions that decide whether text ships. The
driver orders work; the gates are what raise quality.

---

## The flow

```
  topic
    │
    ▼
  plan ─────────────► [approval: outline]  ── waivable by flag ──┐
    │                                                            │
    ▼ ◄──────────────────────────────────────────────────────────┘
  write ──► gates(article) ──fail──► revise ──┐
    │            ▲                            │  capped at MAX_STAGE_ATTEMPTS
    │            └────────────────────────────┘  then halt and surface the report
    ▼
  critique  (subagent, clean context, rubric-scored)
    │  below CRITIC_SCORE_FLOOR ──► revise
    ▼
  revise ───────────► [approval: article]
    │
    ▼
  post_en ──► gates(post, en) ──fail──► revise ──┐  same cap
  post_es ──► gates(post, es) ──fail──► revise ──┘
    │
    ▼
  package ──────────► [approval: package]
    │
    ▼
  publish ──► precondition check ──► branch ──► pull request
                                                   │
                                                   ▼
                                        probe the deployed URL
                                                   │  only when it answers
                                                   ▼
                                        handoff: copy-ready post text
```

Three things are true of every run, by construction:

- **The stage order is data, not a decision.** `config.STAGES` is the sequence, both
  entry points walk it, and a model suggesting it skip or merge stages changes
  nothing. A stage does not begin while an earlier one is unfinished.
- **Revision is enforced, not requested.** Interactively a Claude Code `Stop` hook
  refuses to let the turn end while gates fail; headlessly the driver's own control
  flow does the same. Both shell out to the same gate CLI. A model asserting that it
  checked its own output does not advance anything.
- **Progress lives in a file.** `agent/state/<slug>/state.json` is authoritative.
  A run survives a compacted conversation, a closed terminal and a resumed session,
  and it resumes without regenerating work already accepted.

---

## Gates

A gate is a pure function of its input text and the values in `config.py`. It calls
no model, reaches no network, and returns the same verdict for the same input every
time. The build gate is the one exception to the network rule and says so in its
docstring.

```bash
python -m agent.gates.run --kind article --file src/content/blog/my-post.md
python -m agent.gates.run --kind post --lang es --file /tmp/post.es.txt
```

Exit `0` when everything passes, `1` when any gate fails, `2` on a usage error. The
JSON report on stdout names, per failing gate, the gate identifier, the measured
value, the configured limit, and a message carrying all three. That process boundary
is the whole interface: a hook, the headless driver and a pytest case all consume it
without adaptation, and none of them can be satisfied by a model claiming it checked.

### Catalogue

| Gate | What it measures | Where the threshold comes from |
|---|---|---|
| `antislop.*` | banned openers, banned phrases, engagement bait | The publishing rules revised 2026-08-24 against measured studies; the `It's not X, it's Y` pattern is named in LinkedIn's own May 2026 announcement about downranking generic content |
| `post.body_length` | 1400–2400 characters (1500–2600 for Spanish) | Measured engagement peak at 1301–2500 characters, AuthoredUp, 372 126 posts |
| `post.hook_chars` / `post.hook_words` | ≤140 characters and ≤15 words, first line, no internal break | The mobile truncation point; the "…see more" tap is the dwell-time signal that decides distribution |
| `post.hook_question` | the hook is not a question | −34% likes and −33% comments, consistent across follower bands |
| `post.digits` | at least one number in the body | The one thing a model cannot fabricate without lying |
| `post.hashtags` | at most 3, niche | Umbrella tags add no reach; the ranker reads the body |
| `post.markdown` | no Markdown syntax survives into the handoff | LinkedIn renders none of it |
| `post.em_dashes` / `post.emoji` | at most one each | House rule; machine prose reaches for both |
| `article.frontmatter` | parseable, required fields, no key the schema rejects | `src/content.config.ts`, which is `.strict()` |
| `article.tags` | 1–3 slugs drawn from `src/tags.ts` | Read from that file at run time, never restated — a new tag is accepted with no edit here |
| `article.excerpt` | 80–160 characters | The 160 is the content schema's own: the excerpt is rendered verbatim as the meta description, `og:description`, the RSS description and the `BlogPosting` description |
| `article.words` | 1200–3500 words | Calibrated against the three published articles (1816–2408 words) |
| `article.em_dash_density` | ≤1.5 per 100 words | A density, not a count, so length does not mechanically fail a piece. The goldens peak at 1.02; unedited model prose runs 3–4 |
| `article.placeholders` | no `TODO`, `TKTK`, `{{…}}`, `Huecos por rellenar` | A draft may carry these; a gated artefact may not |
| `repetition.*` | opener and closing move against the published corpus | First plausible threshold, flagged as such — the goldens are what will move it |
| `build` | `npm run build` with the candidate in place | The site's own acceptance test. `prebuild` renders the Open Graph card and refuses a stale one |

The build gate runs **last**, after every cheap gate has had a chance to fail, and its
verdict is cached against a hash of the article's content.

### Thresholds are declared once

Every number and every blacklist above lives in `config.py` and nowhere else — prompts
included, which reference values by name and have them substituted at call time. This
is not tidiness. The n8n workflow this pipeline replaces already demonstrated the
failure mode: its image prompt still specified a colour palette retired months earlier,
because the value was written in two places and only one was updated.
`tests/test_config_is_single_source.py` fails the suite if a threshold literal
reappears anywhere else.

### The goldens are the brake

`goldens/` holds the operator's own published articles and posts, and the test suite
asserts every one of them against the gates that apply to its kind. Gates ratchet
tighter over time until nothing passes; the golden set is what stops that being
invisible. A threshold tightened past what the operator already published fails the
suite naming the golden and the gate, and the choice — relax the gate, or consciously
retire the golden — becomes a deliberate act rather than silent drift.

The three golden posts carry **declared deviations**: they are drafts written before
the 2026-08-24 rules and they genuinely break some of them. They were not edited to
pass, because editing someone's drafts and then calling them approved would fabricate
the approval. Each violation is declared in `goldens/manifest.json` with the rule it
breaks, and the assertion is exact — a golden must fail *exactly* its declared
deviations, so both a new failure and a stale exception fail the suite.

---

## Honest limits

- **Prose is not reproducible.** Sampling is not deterministic and setting temperature
  to zero does not make it so. The contract is that no text ships without passing the
  same gates, not that the same text ships.
- **Gates are necessary, not sufficient.** Text can satisfy every gate and still be
  bad. That is what the critic's rubric and the three operator approval points are
  for, and why the attempt cap surfaces "technically passing, actually bad" to a human
  instead of shipping it.
- **The critic never adjudicates what a gate measures.** Length, hooks, blacklists,
  counts and tags belong to gates and the gate's verdict is authoritative. The critic
  judges whether a paragraph is actionable, whether a decision rule is present,
  whether a claim is falsifiable, whether an honest limit is stated.
- **The repetition threshold is a guess.** It is the first plausible value and it will
  be wrong. Calibrating it against the goldens is open work.
- **The default backend depends on one subscription.** Which is why the API backend is
  a first-class path rather than an afterthought — see below.
- **The pipeline drafts; it does not know anything.** Every number and every anecdote
  comes from the operator. A prompt that needs a fact it was not given must record the
  gap, not invent a plausible one.
- **Nothing here posts to LinkedIn.** The pipeline ends at handoff. That is asserted
  by a test that greps the tree for the LinkedIn API surface.

---

## The two entry points

One implementation, two faces. Stage logic, thresholds and prompts exist once;
an entry point contains only the mechanics of presenting output and collecting
approval.

**Interactively**, inside Claude Code: the `/piece` skill
(`.claude/skills/piece/SKILL.md`). It starts or resumes a run, shows what each
stage produced, and collects the approval decision. It decides nothing — the
`Stop` hook registered in `.claude/settings.json` runs the gate CLI when a turn
tries to end and refuses to let it end while gates fail.

**Headlessly**, from a shell:

```bash
python -m agent.piece run "<topic>" [--brief TEXT] [--no-outline-approval]
python -m agent.piece resume <slug> [--retry]
python -m agent.piece status <slug>
python -m agent.piece list
python -m agent.piece approve <slug> [outline|article|package]
python -m agent.piece revise  <slug> [point] --feedback "<text>"
python -m agent.piece reject  <slug> [point]
```

Exit `0` when the run advanced or is waiting for an approval, `1` when it halted
or was rejected, `2` on a usage error. Nothing ever reads stdin: a headless run
never blocks waiting for a human, it stops and records what it is waiting for.

A run started in one mode continues in the other. There is one state schema and
no conversion step — `status` from the shell and `status` from the skill read the
same file.

## Backends, including for someone who is not the author

The model backend is chosen per stage in `config.STAGE_BACKENDS`. Reassigning a
stage is a one-line edit to that map; there is no `if backend ==` anywhere
outside `agent/backends/`.

| Backend | What it is | When |
|---|---|---|
| `claude_code` | Claude Code invoked headlessly under an existing subscription | The default. Marginal cost of a run is effectively zero |
| `api` | The hosted API, keyed from the environment | **The path for anyone who clones this repository** |
| `mock` | Canned per-stage fixtures from `tests/fixtures/backend/` | Tests, and an end-to-end rehearsal that spends nothing |

To run the pipeline with your own credentials, with no code change:

```bash
cp agent/.env.example agent/.env
# set ANTHROPIC_API_KEY, then:
AGENT_DEFAULT_BACKEND=api python -m agent.piece run "<topic>"
```

An unavailable backend fails with a message naming the backend and the missing
prerequisite, and **does not advance the state file** — a run does not lose its
place because a key was absent.

Every backend response is schema-validated before it reaches the state file. A
subprocess gives weaker structured-output guarantees than an API call, so a
malformed response is a stage failure with its own retry rather than a corrupted
run.

## Running it

```bash
cd agent && uv sync          # once
cd agent && uv run pytest    # the whole suite, no model, no network
```

The suite covers the gates, the golden regression, the CLI contract, the state
machine, the driver's stage order and approval rules, the hook's block decision,
the backends, the prompt renderer, and publishing — with git, `gh` and the
network stubbed throughout. It spends nothing and takes about a second.
