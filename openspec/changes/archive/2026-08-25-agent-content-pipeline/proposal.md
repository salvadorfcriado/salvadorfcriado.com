## Why

Publishing a post today is a hand-assembled sequence that nobody wrote down: draft the
article somewhere, check it against a set of rules that live in a private repo's
`CLAUDE.md`, write the LinkedIn post, remember that LinkedIn caches the link preview on
first fetch so the deploy has to land first, and hope none of the mechanical rules were
missed. The rules themselves are good and evidence-backed — hook ≤140 characters, body
1400–2400, never open with a question, a documented blacklist of machine-writing tells —
but nothing enforces them. They are prose in a file, checked by whoever remembers.

There is a second reason, and it is not about content. This repository is the only public
repository of substance on the author's GitHub. A generation pipeline whose determinism
lives in tested Python gates rather than in a prompt is a better demonstration of applied
AI engineering than the site it publishes to.

## What Changes

**A new `agent/` tree inside this repository.** The pipeline lives with the content it
writes, so the build gate is `npm run build` in the same working tree, publishing is a
file written into `src/content/blog/`, and the preview is a Cloudflare Pages deployment of
the branch. No cross-repo token, no second repository to keep in sync.

- **Deterministic gates as executable code.** `agent/gates/` holds pure functions with no
  model call: length bands, hook limits, the machine-writing blacklist, em-dash and emoji
  ceilings, at-least-one-digit, hashtag count, frontmatter validity against `src/tags.ts`,
  and repetition against previously published pieces. Exposed as a CLI that returns an exit
  code and a JSON report, so nothing depends on a model agreeing that it checked.
- **A reflection loop that cannot be skipped.** A Claude Code `Stop` hook runs the gates
  when the agent tries to finish and returns `{"decision": "block", "reason": ...}` with the
  literal failures. The agent revises against concrete errors rather than self-opinion. A
  retry counter in the state file caps the loop.
- **A critic subagent.** Rubric-scored review from a clean context, because a model asked
  to critique text it just produced in the same context defends it.
- **Explicit human approval points.** The flow stops after the outline, after the article,
  and after the social package. Approval is recorded in the state file; the flow does not
  advance without it.
- **File-backed state.** `agent/state/<slug>/state.json` is the checkpoint. A run survives
  a compacted conversation, a closed terminal, and a resumed session.
- **Prompts as versioned files**, one per stage, under `agent/prompts/`. A prompt change is
  a reviewable diff, not a string buried in code.
- **Two entry points over one implementation.** `/piece` inside Claude Code for interactive
  iteration, and `python agent/piece.py` headless for unattended runs. Both read the same
  prompts and call the same gates.
- **Publication ordering enforced.** The pipeline opens a branch and a PR, waits for the
  deployed URL to answer, and only then hands over the LinkedIn text — because a preview
  cached against a 404 cannot be cleanly fixed.
- **Goldens as the calibration set.** The already-published articles and posts live in
  `agent/goldens/` and are asserted against in `agent/tests/`. A gate that rejects a piece
  the author published and liked is a miscalibrated gate, and the test says so.

**Explicitly out of scope for this change**, to be proposed separately:

- AI-generated Open Graph card imagery. The typographic card that `scripts/og.mjs` already
  renders is what LinkedIn's unfurl shows, and it ships today. Adding generated imagery
  brings its own gates (OCR for the no-text house rule, contrast ratio behind the title)
  and its own build-reproducibility constraint (the image must be a committed asset, not
  build output). The `cover` frontmatter field is already the plug point.
- Automated posting to LinkedIn. The personal-profile API needs a token that expires and
  recurring maintenance, to save thirty seconds of pasting.
- Spanish translation of the site itself. The Spanish LinkedIn post links to the English
  article; making the blog bilingual is a separate decision about the site, not the agent.

## Capabilities

### New Capabilities

- `content-pipeline`: the staged flow from topic to approved package — stage order, the
  file-backed state and its resumability, the enforced reflection loop and its retry cap,
  the critic subagent, the human approval points, and the two entry points sharing one
  implementation.
- `content-gates`: the deterministic validation layer — the gate catalogue and its
  thresholds, the exit-code and JSON-report contract that makes a gate callable from a
  hook or a script, and the golden-set regression that keeps gates calibrated.
- `content-publishing`: turning an approved package into a published post — the branch and
  pull request, frontmatter that satisfies the existing content schema, the
  deploy-before-handoff ordering, and the artifacts handed back for manual posting.

### Modified Capabilities

None. `blog-taxonomy` and `social-preview` keep their current requirements; the pipeline is
a consumer of both and must satisfy them, which is exactly why `npm run build` is a gate.

## Impact

- **New**: `agent/` (driver, prompts, gates, hooks, goldens, tests), `.claude/skills/piece/`,
  `.claude/agents/critic.md`, `.claude/settings.json` hook registration.
- **Modified**: `.gitignore` (agent state and environment file); `README.md` (the publishing
  section currently describes dropping a Markdown file in by hand).
- **Unchanged**: `src/`, `scripts/og.mjs`, `astro.config.mjs`. The pipeline writes the same
  Markdown a human would and is validated by the same build. Nothing about how the site
  renders changes, and hand-authoring a post stays possible.
- **New dependencies**: Python 3.11+ with a test runner, isolated in `agent/`. The Node
  toolchain and the Cloudflare Pages build command are untouched — `.py` files are inert to
  `npm run build`.
- **Secrets**: none committed. The default model backend is Claude Code headless under the
  author's existing subscription; an API-key backend is the documented fallback so the
  repository is runnable by someone who clones it, with the key supplied via `.env`.
