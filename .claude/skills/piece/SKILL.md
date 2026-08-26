---
name: piece
description: Write and publish a piece — an article for the site plus its LinkedIn posts — through the gated content pipeline. Use when the operator wants to start a new piece, resume one, or answer an approval point.
---

The interactive face of `agent/`. Everything that decides anything lives in the
driver: the stage sequence, the thresholds, the prompts, the attempt cap, the
approval rules. This file adds one thing the driver cannot do — a conversation
with the operator — and must add nothing else. If you find yourself about to
list the stages, quote a limit, or explain what a stage should produce, stop and
run the driver instead; it will say.

## What decides whether a stage is finished

Not you. `.claude/settings.json` registers a `Stop` hook that runs the gate CLI
when a turn tries to end, and returns the literal per-gate failures if the
artefact does not pass. You cannot end the turn around it and you cannot argue
with it.

So: **never state that the draft satisfies the rules.** Not "this is within the
limit", not "I checked the hook length", not "this should pass". You have not
checked anything — the gate CLI has, or it has not yet run. The only sentence
you are entitled to about validation is what a gate report said. When the hook
blocks, you are handed measured values against named limits: revise against
those numbers and end the turn again. When the cap is reached the driver halts
the run and shows the operator the outstanding report; that is the end of the
loop, not a signal to try harder.

## Driver invocations

Every shell command this skill runs is in this block. The driver's own `--help`
is the authority on flags; if one is renamed, edit the line here and nowhere
else, because nothing below reconstructs a command.

```bash
python -m agent.piece list                      # open runs
python -m agent.piece status <slug>             # stage, attempts, gate report, approvals
python -m agent.piece run "<topic>"              # start; --brief "<...>" optional
python -m agent.piece resume <slug>             # continue from the recorded stage
python -m agent.piece approve <slug>            # record approval at the current point
python -m agent.piece revise <slug> --feedback "<operator's words>"
python -m agent.piece reject <slug>
```

Run them from the repository root, through `agent/.venv/bin/python` when the
session's own interpreter is not that venv. The flag that waives the outline
approval is on `run`; check `python -m agent.piece run --help` for its exact
name and pass it only when the operator asks for it — a waiver is recorded in
the state file as one.

## The loop

1. **Find the run.** No slug given: `list`, then ask which one, or offer to
   start a new one. A slug given: `status` first, always. The state file is the
   record of where the run is; the conversation is not, and may have been
   compacted since the last stage.

2. **Start or resume.** `run` for a new topic — ask for the topic, and for the
   brief if the operator has one. `resume` otherwise. The driver executes the
   stages; you do not decide what comes next, and you do not run a stage's work
   yourself.

3. **Present what the stage produced.** Show it in full — an outline as an
   outline, an article as prose, a post as the text that would be pasted. Then
   show, separately and without softening it: the gate report as the driver
   printed it, the critic's score and its findings, and the attempt count
   against the cap. Report a failure as a failure. The operator is approving
   the artefact, not your account of it.

4. **Collect the decision.** At an approval point ask for exactly one of
   `approve`, `revise` with feedback, or `reject`, and use the AskUserQuestion
   tool so the choice is explicit. Pass it straight to the driver with the
   matching command; on `revise`, pass the operator's feedback as they wrote it,
   not a paraphrase. Do not proceed until the driver confirms the decision was
   recorded — an approval that is not in the state file did not happen, and a
   remark that sounds like assent is not an approval. If the operator says
   something ambiguous, ask again.

5. **Repeat** until the driver reports the run finished or halted. On a halt,
   show the reason and the outstanding report, and stop.

## Two things this skill does not do

- **It does not publish.** `publish` is a driver stage with its own
  preconditions. There is no path from this conversation to LinkedIn; the
  pipeline produces text for the operator to paste, and that is deliberate.
- **It does not touch `agent/config.py`.** A threshold the operator wants
  changed is a change to that file, discussed on its own, not worked around in a
  run.
