## Context

The rules that govern what gets published are already written, evidence-backed and stable:
body 1400–2400 characters, hook ≤140 characters and ≤15 words, never open with a question,
a named blacklist of machine-writing tells, at most one em dash, at least one digit, at most
three niche hashtags. They live as prose in a private repository's `CLAUDE.md` and in an
n8n workflow's JavaScript node, and nothing in the publishing path enforces them.

The site already contributes three enforcement mechanisms that cost nothing to reuse:

- `src/content.config.ts` derives its tag enum from `src/tags.ts`, so an invalid tag fails
  the build rather than producing an orphan page.
- `scripts/og.mjs` runs in `prebuild` and refuses to ship a post whose Open Graph card is
  missing or stale against its own title and tags.
- `npm run build` is therefore a real, already-written acceptance test for an article.

An n8n workflow exists (`LinkedIn post generator — manual review, recruiter audience`) whose
best component is a deterministic `Validate Post` node: no model, explicit thresholds, each
one justified by a cited measurement. Its weakest component is the revision path, a stub.
This change keeps the idea and discards the substrate.

A second constraint shapes the design: this repository is the author's only public
repository of substance. What it demonstrates matters alongside what it produces.

## Goals / Non-Goals

**Goals:**

- A run executes the same stages in the same order every time, with the same thresholds,
  and stops at the same approval points — regardless of what the model decides mid-run.
- Revision against gate failures is enforced by the harness, not requested by a prompt.
- A run survives a compacted conversation, a closed terminal and a resumed session.
- One implementation of stage logic, prompts and thresholds, driven by two entry points.
- The pipeline's own quality bar is testable without spending a token.
- The repository is runnable by someone who clones it, with their own credentials.

**Non-Goals:**

- Reproducible prose. Sampling is not deterministic, and it is not made deterministic by
  setting temperature to zero. The contract is that no text ships without passing the same
  gates, not that the same text ships.
- AI-generated Open Graph imagery. Deferred to a separate change.
- Automated posting to LinkedIn.
- A bilingual site. The Spanish post links to the English article.
- General-purpose content tooling. This pipeline publishes to this site.

## Decisions

### Claude Code as the runtime, not LangGraph

**Decision.** The orchestration is a small Python state machine (`agent/piece.py`) plus
Claude Code's own primitives — skills, subagents, hooks. No orchestration framework.

**Why.** The flow is linear with two bounded loops. A framework's value here would be
checkpointing, a human-in-the-loop primitive, and conditional edges; a JSON state file, an
approval field and an `if` supply all three in far less code. The framework would also have
been reduced to a wrapper around subprocess calls once Claude Code became the default model
backend, which is a worse thing to publish than an honest 150-line driver.

**Alternatives considered.** LangGraph with API-backed nodes: strongest on paper, but pays
per token for a workload where the operator already has a subscription, and adds a
dependency whose benefit is unused at this size. LangGraph orchestrating Claude Code
subprocesses: the same driver with a framework's vocabulary layered on top. n8n, kept: the
existing workflow is a 43 KB JSON blob that cannot be reviewed in a diff or unit-tested.

**Consequence to state plainly in the README.** The interesting engineering here is
`agent/gates/`, not the driver. The driver orders work; the gates are what raise quality.

### The `Stop` hook is the enforcement point

**Decision.** In interactive mode, a `Stop` hook runs the gate CLI when the agent tries to
finish and returns `{"decision": "block", "reason": "<gate failures>"}` while gates fail and
the attempt cap is not reached.

**Why.** This is the difference between a workflow and a suggestion. A skill that says
"validate, then revise if it fails" is followed at the model's discretion; a hook that
refuses to let the turn end is not. The failures fed back are measured values against named
limits, which is a far stronger revision signal than self-critique — self-critique without
an environment signal plateaus after roughly one round.

**Alternatives considered.** Numbered steps in `SKILL.md` alone: drifts, and the drift is
invisible. `PostToolUse` on file writes: fires on intermediate saves and would block
legitimate work-in-progress.

**Trade-off.** Hook behaviour is harder to test than a function call, so the hook must stay
thin: read the state file, shell out to the gate CLI, translate the exit code. All logic
worth testing lives in the CLI.

### Gates are a separate program with an exit code

**Decision.** `python -m agent.gates.run --kind {article,post} --lang {en,es} --file <path>`
exits `0` or non-zero and prints a JSON report.

**Why.** A process boundary with an exit code is the only interface that a hook, the
headless driver and a pytest case can all consume without adaptation — and the only one that
cannot be satisfied by a model claiming it checked. It also keeps every gate testable with
no model in the loop, which is what makes the golden-set regression cheap enough to run on
every change.

**Ordering.** Cheap gates first, `npm run build` last. A build takes seconds; a length check
takes microseconds and catches most failures.

### The critic is a subagent

**Decision.** Rubric-scored critique runs in a Claude Code subagent (`.claude/agents/critic.md`)
with a clean context, receiving only the text, the rubric and the goldens.

**Why.** A model asked to critique what it just wrote, in the same context, defends it. A
clean context produces genuinely adversarial review. The subagent also keeps the drafting
conversation out of the main context window.

**Boundary.** The critic never adjudicates anything measurable. Length, hooks, blacklists
and counts belong to gates; the critic judges whether a paragraph is actionable, whether a
decision rule is present, whether a claim is falsifiable, whether an honest limit is stated.

### Model backend selected per stage, with an API fallback

**Decision.** `agent/config.py` maps stage to backend. The default routes prose-heavy stages
(`write`, `revise`, `post_en`, `post_es`) through Claude Code headless, and leaves an
API-key backend selectable for every stage.

**Why.** Claude Code headless runs under the operator's existing subscription, so the
marginal cost of a run is effectively zero. Headless invocation is a documented feature of
the product; this is ordinary use of it. The API backend is not a nicety — a repository
whose only backend is one person's subscription is not runnable by anyone else, and
publishing an unrunnable repository defeats half the point.

**Limits accepted.** Subscription rate limits apply; at roughly one piece per week they are
not a factor. A subprocess gives weaker structured-output guarantees than an API call, so
every backend response is validated before it reaches the state file.

### The pipeline lives inside the site repository

**Decision.** `agent/` sits alongside `src/`, in this repository.

**Why.** The build gate needs this working tree. Publishing is a file written into
`src/content/blog/`, which is a local write rather than a cross-repository pull request
requiring a token. Branch previews come free from Cloudflare Pages. One `.claude/`
directory, one working context.

**Alternative considered.** A separate public repository. It was the initial plan and was
dropped: it turns every gate and every publish into a cross-repository operation, and it
splits one memorable artefact — a site that contains the pipeline that writes it — into two
thin ones.

**Cost accepted.** Python in a TypeScript repository. The Cloudflare Pages build command is
`npm run build`; `.py` files are inert to it.

### Option (a) for the LinkedIn visual, and no image generation in this change

**Decision.** Posts carry the article URL. LinkedIn's unfurl renders the per-post Open Graph
card that `scripts/og.mjs` already generates. No image is produced by the pipeline.

**Why.** A LinkedIn post takes one attachment. With an uploaded image, a URL in the body
renders as bare text and loses the clickable preview card; with a link, the card is the
attachment and the whole card is clickable. Since the objective is traffic to the site, the
link wins. The existing card is already a designed brand artefact — grid paper, mono
eyebrow, large display title, accent rule — and renders the title at a size LinkedIn's own
unfurl chrome never would.

**What the deferred change will do.** Generate imagery as a *background* composited under
the existing typographic layer, not as a replacement for it, so a mediocre generation cannot
cost the card its legibility. It will require its own gates (OCR to enforce the no-text house
rule; luminance contrast behind the title) and one build-reproducibility rule: the generated
image must be a committed asset under `public/img/og/bg/`, never build output, or every
Cloudflare build would call an image API. The `cover` frontmatter field is the existing plug
point.

### Deploy before handoff

**Decision.** The pipeline probes the article's public URL and withholds the LinkedIn text
until it answers successfully.

**Why.** LinkedIn caches a URL's preview on first fetch. A preview cached against a 404
persists, and the documented recovery is unreliable. This is the one ordering constraint in
the pipeline that cannot be relaxed, and it is exactly the kind of rule a human forgets at
the moment of wanting to post.

### Thresholds declared once, including for prompts

**Decision.** Numeric limits and blacklists live in one configuration module. Prompt files
reference them by name; the prompt renderer substitutes values at call time.

**Why.** The n8n workflow already demonstrates the failure mode: its image prompt still
specifies the warm palette that was retired on 2026-08-25, because the value was written in
two places and only one was updated. A threshold restated in a prompt is a threshold that
will drift from its gate.

## Risks / Trade-offs

**Gates ratchet tighter over time until nothing passes** → the golden set is the brake. Every
gate change runs against previously published, operator-approved pieces; a gate that rejects
past good work fails the test suite and forces a deliberate decision.

**Enforced revision produces text that satisfies gates while getting worse** → gates are
necessary, not sufficient. The critic scores against a rubric calibrated on the goldens, and
the operator approval points remain the final authority. The attempt cap surfaces
"technically passing, actually bad" to a human rather than shipping it.

**The default backend depends on one person's subscription** → the API backend is a
first-class configuration path, documented in the README and exercised by the repository's
own instructions, not an afterthought.

**Publishing generated content while arguing publicly that generic AI content destroys
credibility with technical readers** → the pipeline drafts and enforces; the author supplies
every number and every anecdote and approves at three points. Writing openly about the
pipeline, including its gates and its limits, converts the risk into the strongest available
demonstration.

**A subprocess backend returns malformed output** → every backend response is schema-validated
before it is written to the state file; a validation failure is a stage failure with its own
retry, not a corrupted run.

**The build gate is slow enough to discourage running it** → it runs last, after every cheap
gate has had a chance to fail, and its result is cached in the state file against the
article's content hash.

**Python in a Node repository confuses a first-time reader** → `agent/README.md` states the
boundary in its opening lines, and the root `README.md` gains a pointer.

## Migration Plan

No migration. Nothing existing changes behaviour: the three published posts stay as they
are, the build is untouched, and hand-authoring a post remains fully supported. The pipeline
is additive and can be deleted without affecting the site.

Rollback is `rm -rf agent/ .claude/skills/piece .claude/agents/critic.md` plus reverting the
hook registration.

The first real run should be the article about the pipeline itself: it exercises every
stage, and the artefact it produces is also the honest disclosure.

## Open Questions

- **Spanish post cadence.** Two near-duplicate posts on the same day compete with each
  other. Same-day, separated by days, or alternating language per piece — a publishing
  decision, resolvable after the first few runs produce evidence.
- **Repetition threshold.** The similarity level at which an opener counts as reused needs
  calibrating against the goldens; the first plausible value will be wrong.
- **Whether the outline approval earns its interruption.** It is cheap insurance against
  generating a whole article at the wrong angle, but it may prove to be friction. The waiver
  flag exists so this can be answered by use rather than by argument.
