## ADDED Requirements

### Requirement: Gates are deterministic and model-free

A gate SHALL be a pure function of its input text and the repository's configured
thresholds. A gate SHALL NOT call a language model, SHALL NOT reach the network, and SHALL
return the same verdict for the same input on every run.

Any check that a gate can perform SHALL NOT be delegated to a critic prompt. A model MAY
comment on a gated property, but the gate's verdict is authoritative.

#### Scenario: The same text is checked twice

- **WHEN** identical text is passed to the gate CLI twice
- **THEN** both runs produce identical verdicts and identical reports

#### Scenario: The network is unavailable

- **WHEN** the gate CLI runs with no network access
- **THEN** every gate except the build gate completes normally

### Requirement: Gate CLI contract

Gates SHALL be invocable as a command-line program that takes a content kind and a file
path, and SHALL communicate its verdict through both a process exit code and a JSON report
on standard output.

The exit code SHALL be `0` when every gate passes and non-zero when any gate fails. The
JSON report SHALL list, per failing gate, the gate's identifier, the measured value, the
configured limit, and a human-readable message naming all three.

The contract SHALL be stable enough to be called from a Claude Code hook, from the headless
driver, and from a test, without adaptation.

#### Scenario: A hook consumes a failure

- **WHEN** the `Stop` hook runs the gate CLI and the exit code is non-zero
- **THEN** the hook returns a block decision to Claude Code
- **AND** the reason text contains the per-gate messages from the JSON report

#### Scenario: All gates pass

- **WHEN** the gate CLI runs against text that satisfies every gate
- **THEN** the exit code is `0`
- **AND** the JSON report lists no failures

### Requirement: Article gate catalogue

An article SHALL be checked for: frontmatter parseability; presence and type of every field
the content schema requires; tags drawn from the vocabulary in `src/tags.ts`, between one
and three, in a deliberate order; excerpt presence and length; word count within the
configured band; the machine-writing blacklist; the em-dash ceiling; the emoji ceiling; and
the absence of unresolved placeholder markers.

Tag validation SHALL read the vocabulary from `src/tags.ts` rather than restating it, so
that the gate and the content schema cannot drift apart.

#### Scenario: A tag outside the vocabulary

- **WHEN** an article declares a tag slug absent from `src/tags.ts`
- **THEN** the article gate fails naming the offending slug
- **AND** the failure occurs before `npm run build` is attempted

#### Scenario: A blacklisted construction appears

- **WHEN** the article contains a construction on the machine-writing blacklist
- **THEN** the gate fails naming the construction and its position

#### Scenario: The tag vocabulary gains an entry

- **WHEN** a new tag is added to `src/tags.ts`
- **THEN** the article gate accepts it without any edit to the gate

### Requirement: Post gate catalogue

A LinkedIn post SHALL be checked for: body length within the configured band; hook length
within both a character and a word limit; the hook occupying the first line with no internal
line break; the hook not being a question; the hook not matching the banned-opener list; at
least one digit in the body; the machine-writing blacklist; the em-dash ceiling; the emoji
ceiling; the engagement-bait list; hashtag count within the configured maximum; and absence
of Markdown syntax.

Post gates SHALL be applied per language. A language SHALL be able to carry its own
threshold overrides and its own blacklist entries without duplicating the shared gate logic.

#### Scenario: The post opens with a question

- **WHEN** the first line of a post ends in a question mark
- **THEN** the post gate fails naming the opener rule

#### Scenario: The Spanish post is checked

- **WHEN** the Spanish post is gated
- **THEN** the shared thresholds apply
- **AND** any Spanish-specific blacklist entries also apply
- **AND** the English blacklist entries that do not apply to Spanish are not enforced

#### Scenario: The body carries no number

- **WHEN** a post body contains no digit
- **THEN** the post gate fails naming the rule

### Requirement: Build gate

The article SHALL be validated by the site's own build. The build gate SHALL run the
repository's build command with the candidate article in place and SHALL fail if the build
fails.

The build gate SHALL be the last article gate to run, because it is the slowest and every
cheaper gate that fails first saves it.

#### Scenario: The build rejects the article

- **WHEN** the content schema rejects the candidate article's frontmatter
- **THEN** the build gate fails
- **AND** the failure report carries the build's own error output

#### Scenario: A cheaper gate has already failed

- **WHEN** the length gate fails
- **THEN** the build gate does not run
- **AND** the report names the length failure

### Requirement: Repetition gate

A candidate piece SHALL be checked against previously published pieces for repeated
structure. The gate SHALL at minimum compare the opening line and the closing move against
the corpus, and SHALL fail when similarity exceeds the configured threshold.

The corpus SHALL be the published articles and posts available to the repository, including
the goldens.

#### Scenario: An opener is reused

- **WHEN** a candidate post opens with a line closely matching a published post's opener
- **THEN** the repetition gate fails naming the published piece it matches

#### Scenario: The corpus is empty

- **WHEN** no published pieces are available to compare against
- **THEN** the repetition gate passes
- **AND** the report records that the corpus was empty

### Requirement: Golden-set regression

The repository SHALL hold a set of previously published, operator-approved pieces as
goldens, and SHALL assert in its test suite that every golden passes the gates that apply
to its kind.

A gate change that causes a golden to fail SHALL fail the test suite. The failure means
either the gate is miscalibrated or the golden must be consciously retired; both SHALL be
deliberate acts, not silent drift.

#### Scenario: A newly tightened threshold rejects past work

- **WHEN** a threshold is tightened such that a published golden would now fail
- **THEN** the test suite fails naming the golden and the gate
- **AND** the change cannot be merged without either relaxing the gate or retiring the golden

#### Scenario: Gates are unchanged

- **WHEN** the test suite runs against unchanged gates and unchanged goldens
- **THEN** every golden passes
- **AND** no model is invoked by the test suite

### Requirement: Thresholds declared once

Every numeric threshold and every blacklist SHALL be declared in a single configuration
location and imported by the gates that use them. A threshold SHALL NOT appear in more than
one place in the repository, prompts included; prompts SHALL reference the configured values
rather than restating them as literals.

#### Scenario: A limit is raised

- **WHEN** the post body maximum is raised
- **THEN** exactly one file changes
- **AND** the gate, the report messages and the prompt all reflect the new value
