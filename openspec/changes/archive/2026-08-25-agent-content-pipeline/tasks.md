## 1. Scaffolding and configuration

- [x] 1.1 Create the `agent/` tree: `piece.py`, `config.py`, `state.py`, `prompts/`, `gates/`, `hooks/`, `goldens/`, `tests/`, `README.md`
- [x] 1.2 Add `agent/pyproject.toml` (Python 3.11+, pytest, a schema validator) and `agent/.env.example` with the API-backend variables and no real values
- [x] 1.3 Extend the root `.gitignore` with `agent/state/` and `agent/.env`; confirm `agent/prompts/`, `agent/gates/`, `agent/goldens/` and `agent/tests/` stay tracked
- [x] 1.4 Write `agent/config.py` as the single home for every threshold, blacklist and stage→backend mapping, with values transcribed from the existing n8n validator and `CLAUDE.md`
- [x] 1.5 Write `agent/README.md` opening with why Python sits in a TypeScript repository, and add a pointer from the root `README.md`

## 2. Deterministic gates

- [x] 2.1 Define the gate result type and report shape (gate id, measured value, limit, message) in `agent/gates/__init__.py`
- [x] 2.2 Implement `agent/gates/antislop.py`: banned openers, banned phrases, banned words, em-dash ceiling, emoji ceiling, engagement bait — all sourced from `config.py`
- [x] 2.3 Implement `agent/gates/post.py`: body length band, hook character and word limits, hook on first line with no internal break, hook is not a question, at least one digit, hashtag count, no Markdown syntax, with per-language overrides
- [x] 2.4 Implement `agent/gates/article.py`: frontmatter parse, required fields, word-count band, excerpt presence and length, no unresolved placeholder markers
- [x] 2.5 Make the article gate read the tag vocabulary from `src/tags.ts` rather than restating it, and fail naming any slug outside it
- [x] 2.6 Implement `agent/gates/repetition.py`: opener and closing-move similarity against the goldens corpus, passing with a recorded note when the corpus is empty
- [x] 2.7 Implement `agent/gates/build.py`: run the repository build with the candidate in place, capture its output on failure, cache the result against the article's content hash
- [x] 2.8 Implement `agent/gates/run.py`: the CLI taking `--kind`, `--lang`, `--file`; exit `0` or non-zero; JSON report on stdout; cheap gates first and the build gate last, short-circuiting when a cheaper gate fails

## 3. Gate tests and goldens

- [x] 3.1 Copy the three published articles and their posts into `agent/goldens/` with a short manifest recording origin and approval date
- [x] 3.2 Write `agent/tests/test_goldens.py`: every golden passes the gates for its kind, with no model invoked
- [x] 3.3 Write `agent/tests/test_gates.py`: one failing fixture per gate asserting the exact gate id, measured value and limit in the report
- [x] 3.4 Write `agent/tests/test_cli.py`: exit codes, JSON report shape, gate ordering, and short-circuit behaviour
- [x] 3.5 Assert in a test that no threshold literal appears outside `config.py`

## 4. State and driver

- [x] 4.1 Define the state schema in `agent/state.py`: slug, topic, brief, current stage, per-stage attempts, latest gate report, approvals, handoff record — with load, atomic save and validate
- [x] 4.2 Implement the declared stage sequence in `agent/piece.py` as data, with advancement guarded by the recorded approvals
- [x] 4.3 Implement approval handling: `approve`, `revise` with feedback, `reject`; record every decision in the state file before advancing
- [x] 4.4 Implement per-stage attempt counting and the retry cap, halting with the outstanding gate report when the cap is reached
- [x] 4.5 Implement the CLI: `run`, `resume`, `status`, `list`, and the flag that waives outline approval
- [x] 4.6 Verify resumability end to end: interrupt a run mid-stage, resume it, confirm no accepted work is regenerated

## 5. Prompts and model backends

- [x] 5.1 Write `agent/prompts/_style.md` as the shared prefix, referencing configured values by name rather than restating numbers
- [x] 5.2 Write `plan.md`, `write.md`, `revise.md`, `post_en.md`, `post_es.md` and the `critic.md` rubric, porting the rules from the n8n prompts minus the profile-facts constraints
- [x] 5.3 Implement prompt loading and value substitution so a threshold change propagates into prompt text
- [x] 5.4 Implement the backend interface and the Claude Code headless backend, validating every response against the expected schema before it reaches the state file
- [x] 5.5 Implement the API-key backend behind the same interface, selectable entirely through `config.py` and `.env`
- [x] 5.6 Wire the stage→backend mapping and confirm a stage can be reassigned to another backend with no code change

## 6. Claude Code integration

- [x] 6.1 Write `agent/hooks/stop_gate.py`: read the state file, shell out to the gate CLI, return a block decision with the per-gate messages while gates fail and the attempt cap is not reached — no logic beyond that translation
- [x] 6.2 Register the `Stop` hook in `.claude/settings.json`
- [x] 6.3 Write `.claude/agents/critic.md`: a clean-context critic receiving only the text, the rubric and the goldens, returning a scored verdict, explicitly barred from adjudicating anything a gate measures
- [x] 6.4 Write `.claude/skills/piece/SKILL.md` as the interactive entry point, delegating stage logic to the driver and containing only presentation and approval collection
- [x] 6.5 Verify the block path: produce a draft that violates a mechanical rule, confirm the turn cannot end and the failure text reaches the model
- [x] 6.6 Verify the cap path: force repeated failures, confirm the run halts and surfaces the outstanding report
- [x] 6.7 Verify a run started headlessly resumes from the skill without state conversion

## 7. Publishing

- [x] 7.1 Implement article emission into `src/content/blog/` with frontmatter satisfying the existing content schema and nothing generator-specific
- [x] 7.2 Implement the publish precondition check: every publishable artefact's latest gate report passing and every required approval recorded, aborting otherwise
- [x] 7.3 Implement branch creation and pull request opening, with the body carrying both post bodies, the hashtags and the gate report
- [x] 7.4 Implement the deployed-URL probe and withhold the handoff text until it answers successfully, reporting the URL probed and the response received
- [x] 7.5 Implement copy-ready handoff output: hashtags in position, article URL embedded, no Markdown, no placeholders; record the handoff in the state file
- [x] 7.6 Confirm no code path posts to LinkedIn

## 8. End to end and documentation

- [x] 8.1 Run the pipeline end to end on a throwaway topic; confirm stage order, approval stops, gate enforcement and resumability against the specs
- [x] 8.2 Confirm a pipeline-produced post and a hand-written post are indistinguishable in frontmatter shape and render through the same template
- [x] 8.3 Confirm the article's Open Graph card is generated by `prebuild` and that a preview of the deployed branch renders it
- [x] 8.4 Document in `agent/README.md`: the stage diagram, the gate catalogue with each threshold's source, the two entry points, backend configuration for a third party, and the honest limits — including that the driver replaces an orchestration framework deliberately and that the gates are where the quality comes from
- [x] 8.5 Update the root `README.md` publishing section to describe both paths, keeping hand-authoring documented as fully supported
- [x] 8.6 Run the first real piece — the article about the pipeline itself — through to a pull request
