# content-pipeline Specification

## Purpose
The staged flow from a topic to an approved package: the fixed stage order, the
file-backed state and its resumability, the enforced revision loop and its retry cap,
critique from an isolated context, the operator approval points, and the two entry
points that share one implementation.

## Requirements

### Requirement: Fixed stage order

The pipeline SHALL execute a fixed, declared sequence of stages: `plan`, `write`,
`critique`, `revise`, `post_en`, `post_es`, `package`, `publish`. The sequence SHALL be
defined in the driver as data, not inferred by a model at run time, and SHALL be identical
across every run and every entry point.

A stage SHALL NOT begin while an earlier stage is unfinished, and no stage SHALL be skipped
except by an explicit, recorded flag (for example an outline approval waived by the
operator).

#### Scenario: The same topic is run twice

- **WHEN** the pipeline runs twice with the same topic
- **THEN** both runs execute the same stages in the same order
- **AND** the generated prose differs between runs
- **AND** both runs pass the same gate set before reaching an approval point

#### Scenario: A model proposes to reorder or skip work

- **WHEN** the model suggests skipping a stage or handling two stages together
- **THEN** the driver advances the state file only through the declared sequence
- **AND** the skipped stage still runs

### Requirement: File-backed state and resumability

Every run SHALL persist its state to `agent/state/<slug>/state.json`. The state SHALL
record at minimum: the slug, the topic and brief, the current stage, per-stage attempt
counters, the latest gate report, and the recorded approvals.

The state file SHALL be the authoritative record of run progress. Progress SHALL NOT be
inferred from conversation history, which is compacted, truncated, or lost between
sessions.

A run SHALL be resumable from its last completed stage without regenerating work already
accepted.

#### Scenario: The session ends mid-run

- **WHEN** the terminal is closed after the article has passed its gates but before approval
- **AND** the operator resumes the run the next day
- **THEN** the pipeline continues from the article approval point
- **AND** the article is not regenerated

#### Scenario: The conversation is compacted

- **WHEN** the interactive session compacts and loses earlier turns
- **THEN** the driver reads the current stage and attempt counters from the state file
- **AND** the run continues correctly

### Requirement: Enforced revision loop

Generation stages that produce publishable text SHALL be gated by an enforcement mechanism
that the generating model cannot bypass. In the interactive entry point this SHALL be a
Claude Code `Stop` hook; in the headless entry point this SHALL be the driver's own control
flow. Both SHALL call the same gate CLI.

When gates fail, the enforcement mechanism SHALL return the literal gate failures to the
model and require revision. When gates pass, it SHALL allow the stage to complete.

The number of revision attempts per stage SHALL be capped by a configured maximum recorded
in the state file. On reaching the cap, the pipeline SHALL stop and surface the outstanding
failures to the operator rather than publishing or silently continuing.

#### Scenario: A draft violates a mechanical rule

- **WHEN** a generated post has a 163-character hook against a 140-character limit
- **THEN** the agent is blocked from completing the stage
- **AND** it receives the failure text naming the gate, the measured value and the limit
- **AND** it revises and is re-checked

#### Scenario: The retry cap is reached

- **WHEN** a stage has failed its gates for the configured maximum number of attempts
- **THEN** the pipeline halts at that stage
- **AND** the state file records the attempts and the final gate report
- **AND** the operator is shown the outstanding failures
- **AND** nothing is published

#### Scenario: The model asserts it verified its own output

- **WHEN** the model states that the draft satisfies the rules without the gate CLI running
- **THEN** the stage does not complete
- **AND** the gate CLI result, not the assertion, decides

### Requirement: Critique from an isolated context

Qualitative review SHALL be performed by a critic that does not share the context in which
the reviewed text was produced. In the interactive entry point this SHALL be a Claude Code
subagent; in the headless entry point this SHALL be a separate model invocation carrying
only the reviewed text, the rubric, and the goldens.

The critic SHALL return a structured, scored verdict against a rubric stored as a versioned
prompt file, not free-form praise. The critic SHALL NOT be the sole authority on anything a
deterministic gate can measure.

#### Scenario: Critique follows generation

- **WHEN** the article passes its deterministic gates
- **THEN** the critic is invoked with the article, the rubric and the goldens
- **AND** the critic does not receive the drafting conversation
- **AND** the verdict is recorded in the state file with its score and findings

#### Scenario: Critic and gate disagree on a measurable property

- **WHEN** the critic reports the length as acceptable and the length gate fails
- **THEN** the gate result decides
- **AND** the stage does not complete

### Requirement: Human approval points

The pipeline SHALL stop for operator approval at three points: after the outline, after the
article, and after the assembled social package. Each approval SHALL be recorded in the
state file as an explicit field before the pipeline advances.

An approval decision SHALL be one of `approve`, `revise` with operator feedback, or
`reject`. `revise` SHALL re-enter the corresponding generation stage with the feedback
supplied as input. `reject` SHALL halt the run.

The pipeline SHALL NOT advance past an approval point on the basis of a model's belief that
approval was given.

#### Scenario: The operator requests changes

- **WHEN** the operator responds to the article approval point with feedback text
- **THEN** the state records the decision as `revise` with that feedback
- **AND** the revise stage runs with the feedback as input
- **AND** the article approval point is presented again

#### Scenario: Approval is absent

- **WHEN** the state file has no recorded approval for the current approval point
- **THEN** later stages do not run
- **AND** the publish stage in particular does not run

#### Scenario: The outline approval is waived

- **WHEN** the run is started with the flag that waives outline approval
- **THEN** the state records the waiver
- **AND** the article and package approval points still apply

### Requirement: Two entry points over one implementation

The pipeline SHALL be operable interactively through a Claude Code skill and headlessly
through a command-line driver. Both entry points SHALL read the same prompt files, invoke
the same gate CLI, and write the same state schema.

Stage logic, thresholds, and prompts SHALL NOT be duplicated per entry point. An entry
point SHALL contain only the mechanics of presenting output and collecting approval.

#### Scenario: A threshold changes

- **WHEN** a gate threshold is edited in one place
- **THEN** both entry points enforce the new threshold on their next run
- **AND** no second copy of the threshold exists in the repository

#### Scenario: A run started in one mode continues in the other

- **WHEN** a run is started headlessly and later resumed from the Claude Code skill
- **THEN** the state file is read without conversion
- **AND** the run continues from the recorded stage

### Requirement: Prompts as versioned files

Every model-facing instruction SHALL live as a Markdown file under `agent/prompts/`, one
file per stage, plus a shared style prefix. Prompts SHALL NOT be embedded as string
literals in driver or node code.

#### Scenario: A prompt is changed

- **WHEN** the drafting instruction is edited
- **THEN** the change appears as a diff in a Markdown file under `agent/prompts/`
- **AND** it is reviewable in the pull request without reading Python

### Requirement: Configurable model backend with a documented fallback

The model backend SHALL be selected per stage from configuration. The repository SHALL
support at least two backends: Claude Code invoked headlessly under the operator's own
subscription, and a hosted API backend authenticated by a key supplied through the
environment.

The default configuration SHALL be runnable by the repository owner without an API key. The
API backend SHALL be documented so that a third party who clones the repository can run the
pipeline with their own credentials. No credential SHALL be committed.

#### Scenario: A third party clones the repository

- **WHEN** someone without the owner's subscription runs the pipeline
- **THEN** the documented API backend is selectable through configuration and `.env`
- **AND** the pipeline runs with no code change

#### Scenario: A backend is unavailable

- **WHEN** the configured backend cannot be reached or is not authenticated
- **THEN** the pipeline fails with a message naming the backend and the missing prerequisite
- **AND** the state file is not advanced
