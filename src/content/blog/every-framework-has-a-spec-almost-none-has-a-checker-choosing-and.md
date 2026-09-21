---
title: "Choose an AI development framework by what it scores zero on"
date: 2026-09-21
tags: [ai-coding, evaluation]
readingTime: 12
excerpt: "Six dimensions, one rubric. Specification is where nearly every agent framework scores full marks; roles and validation are where teams lose."
---

A change lands. It compiles, the suite is green, and it is wrong.

That diff is the reason the question "which AI development framework should we use" is the wrong question, and the reason engineering leads keep getting asked it anyway. This article gives you an instrument instead of a preference: a six-dimension rubric you can run against your own setup in an afternoon, the published scores for seven frameworks, the two failure modes that produce identical diffs, and the measurements that move before your change failure rate does.

## Score your own process before you compare anyone's

Macedo's taxonomy of AI development frameworks (arXiv:2606.04967) scores a process on six dimensions, 0 to 2 each, twelve maximum. The dimensions are the useful part even if you never read a framework comparison, because they work as a rubric on whatever you are doing right now.

| Dimension | What it asks | 0 | 1 | 2 |
|---|---|---|---|---|
| **Specification** | Is there a written artefact defining the change before code exists? | Prompt only | Notes, informal | Structured spec, versioned |
| **Context** | How does relevant repository knowledge reach the agent? | Whatever fits the window | Manual file selection | Systematic retrieval and grounding |
| **Roles** | Who decides what, and at which phase? | Undifferentiated agent | Implicit separation | Named roles with authority per phase |
| **Execution** | How is work broken into steps the agent runs? | Free-form | Task list | Phased, with entry and exit conditions |
| **Validation** | What checks the output against the intent? | Human reading the diff | Tests, after the fact | Gates the process cannot skip |
| **Portability** | Does the process survive changing agent or tool? | Locked to one agent | Partial | Plain artefacts, agent-agnostic |

Score yourself in six lines. Then ignore the total.

The total is the number people want and the number that misleads. The common shape is a 2 on specification sitting next to a 0 on validation, which sums to a respectable-looking middle and describes a team that writes excellent specs and has no mechanism for noticing when the code stops matching them. **Your lowest score is the output.** It is the one dimension where adding anything at all changes your failure rate, and the only one worth spending this quarter on.

## Specification is saturated, roles and validation are not

Here is the scored set from the paper, verbatim.

| Framework | Spec | Context | Roles | Exec | Valid | Port | Total |
|---|---|---|---|---|---|---|---|
| Spec Kit | 2 | 1 | 1 | 1 | 1 | 2 | 8 |
| OpenSpec | 2 | 1 | 0 | 1 | 0 | 2 | 6 |
| BMAD | 2 | 2 | 2 | 1 | 2 | 1 | 10 |
| Get Shit Done | 1 | 2 | 0 | 1 | 0 | 0 | 4 |
| Spec Kitty | 2 | 1 | 1 | 2 | 2 | 1 | 9 |
| Reversa | 2 | 2 | 0 | 0 | 1 | 1 | 6 |
| Spec-Flow (out of sample) | 2 | 2 | 2 | 2 | 2 | 1 | 11 |

Read the columns, not the rows. Specification is 2 almost everywhere. A dimension where nearly every candidate scores full marks carries no information about the choice: it is table stakes, and it is also the dimension every framework demo is built around, because a spec is the easiest thing to show.

Roles and validation are the polarized columns. Roles runs 1, 0, 2, 0, 1, 0, 2. Validation runs 1, 0, 2, 0, 2, 1, 2. Those are the dimensions where the frameworks actually disagree, which makes them the dimensions where a choice is being made.

No framework in the set scores 2 on all six, and adoption does not track process completeness. Checked directly against the repositories on 2026-09-21: Spec Kit has 138.1k GitHub stars, BMAD 53.3k, and Spec-Flow roughly 85. The highest-scoring process in the table, Spec-Flow at 11 of 12, is three orders of magnitude less adopted than the mid-scoring one, Spec Kit at 8 of 12. The paper's own traction table is a GitHub snapshot from May 2026, and the figures had already moved by the time I checked them. That is why the date is attached to every number above. A popularity ranking decays between the day it is measured and the day you read it, which disqualifies it as a durable input to the decision. The rubric does not decay, because it describes your process rather than someone else's audience.

Superpowers sits outside the scored sample and is cited here as an existence proof for one claim: the scarce dimensions can be built as enforced mechanisms rather than documented intentions. Its review runs through a subagent other than the one that wrote the code, which is role separation as a mechanism; its test-driven flow refuses implementation until a test has failed for the right reason, which is validation as a mechanism.

**The honest limit, stated here rather than buried at the end:** these scores are one rater's reading of official documentation. There is no second coder and no inter-rater reliability figure. Documentation describes intent, and intent is what vendors write down. Treat every framework productivity claim as a claim.

## Two failures that produce the same diff

Back to the green suite and the wrong change. It has two causes, and they are repaired in opposite directions, so guessing costs you a sprint.

A **context gap** produces functional hallucination: code that satisfies the explicit contract and violates an implicit one, because the file carrying the implicit contract was never in scope. The agent was not wrong about what it saw. It never saw it.

**Spec-to-code drift** produces code that satisfies the tests while quietly changing the architecture, or dropping a business constraint the spec still claims is enforced. The agent had the relevant material and diverged from it anyway.

| Symptom | The check that discriminates | Cause | Fix |
|---|---|---|---|
| Violates a rule documented in a file the change did not touch | Did the agent cite that file? | Context gap | Grounding: file coverage, evidence, gap detection |
| Passes tests, architecture quietly different from the spec | Did the agent cite the spec and diverge? | Drift | A gate comparing artefacts to implementation |
| Calls an API that does not exist | Search the codebase for the symbol | Context gap | Grounding |
| Constraint present in spec, absent in code, spec unchanged | Diff the spec against the implementation | Drift | Gate |

The check is one question: did the agent cite the internal sources that constrain this change? If it never saw them, the fix is grounding, and adding a gate only moves the failure later in the pipeline at higher cost. If it saw them and diverged, the fix is a gate, and adding more context changes nothing because context was never the shortage.

## Point agentic work where the gain exists, then accept the consequence

The size of the gain is set by the codebase, not by the framework. Two independent datasets give the same ranking.

Stanford's work under Denisov-Blanch, across roughly 100,000 developers:

| Codebase | Complexity | Measured gain |
|---|---|---|
| Greenfield | Low | 30–35% |
| Greenfield | High | 10–15% |
| Brownfield | Low | 15–20% |
| Brownfield | High | 0–10% |

Rework rises and returns diminish as the codebase grows. DORA's 2026 report finds the same shape from different data: 35–40% on simple greenfield work, 10% or less on complex existing systems.

**Decision rule:** if the work is brownfield and high complexity, do not justify an agent programme on output gain. The measured range includes zero. Justify it on something else you can name and measure, or point the programme at a different quadrant first.

The uncomfortable part is that the brownfield high-complexity quadrant is usually where the business value sits. The old system with the revenue in it is nobody's greenfield. Pointing agents at the easy quadrant is the correct first move and it is also the move that produces a pilot result you cannot extrapolate.

## Throughput moved, stability did not follow

DORA 2025 associated a 25% increase in AI adoption with 1.5% lower delivery throughput and 7.2% lower delivery stability. By 2026, the throughput relationship had turned positive. The stability relationship had not. In the modelled scenario, change failure rate goes from 5% to 6% after adoption.

Volume and safety are separate variables, and the second one does not improve because the first one did.

The ROI model in the same report contains an explicit J-curve: a dip before the return, produced by learning time, verification overhead and downstream process change. The dip is inside the model, not a caveat attached to it. **Consequence for measurement:** the first window after adoption falls inside the dip, so a pilot measured there reads as a loss whether or not the programme is working. Fix the measurement window before you start, and make it longer than the dip you expect to sit in.

One candidate path from adoption to instability, offered as a hypothesis rather than a finding: agent adoption raises the rate of change entering review, review capacity stays fixed, queue length and time in review rise, and change failure rate follows. That version is testable on your own data. If queueing is the path, review queue length and time in review move before change failure rate does. A team whose queue metrics stay flat while change failure rate climbs has a different cause and should stop spending on review capacity.

**The order of operations, as an order:**

1. Tests that fail for the right reason before they pass. A suite that goes green on a wrong change is not validation, it is decoration.
2. Small reviewable units. Review capacity is the constraint you are about to load.
3. Fast feedback and version control discipline. Short-lived branches, trunk-based flow, a pipeline that answers in minutes.
4. Then raise volume.

Doing 4 before 1 through 3 is what produces the dip. It is also the default, because raising volume is the step that requires no organisational agreement.

## The expensive half is the half being accelerated

Writing code was never the constraint. Reviewing and maintaining it was. Agents accelerate the first one, and the GitClear/GitKraken analysis of 623 million changed lines from 2023 to 2026 says the code arriving for review is measurably harder to review.

| Signal | Direction |
|---|---|
| Duplicated blocks | +81% |
| Copy/paste within a single commit | +41% |
| Error-masking constructs | +47% |
| Two-week churn | +15% |
| Cross-file function calls | −35% |
| Refactoring line moves | −70% |

2024 was the first year on record where copy/paste exceeded moved code. Duplication up and refactoring down is a single trend seen twice: code is being added rather than reorganised, and cross-file calls falling 35% means the added code is not reaching for what already exists.

One ratio shows how to read the volume. Heavy AI users out-produce non-users by 4–10x on raw line volume, and only by about 25% against their own past output. A line-count dataset cannot separate the two explanations for that gap: high-output people adopting first, or adoption raising output. Both fit the data. What the pair does settle is that the 4–10x is not an effect size. The within-person figure is the one measured against the same people, and it is the smaller one.

## Measure the intermediate artefacts, not only the diff

Change failure rate, lead time, deployment frequency and time to restore are lagging by construction. They tell you about code that already shipped. A process that generates specs, plans and reviews before code exists produces artefacts you can measure earlier.

| Metric | Why it leads |
|---|---|
| Corrections per phase | Rises before change failure rate does |
| Rate of human review required | Measures how much of the process is actually unattended |
| Spec-to-code drift | Catches the silent architecture change while the fix is still cheap |
| Grounding: file coverage, citation of internal sources, gap detection, absence of nonexistent APIs, adherence to recorded architectural decisions | Separates context gap from drift, per the diagnostic above |
| Consistency between artefacts, stability of decisions | A spec rewritten mid-implementation is the signal, not the noise |
| Audit-trail quality | Determines whether any of the above can be reconstructed after the fact |

Pair them with change failure rate and churn so the leading and lagging views can visibly disagree. When corrections per phase climbs for three weeks and change failure rate has not moved, you have three weeks of warning.

No published thresholds exist for any of these. A healthy corrections-per-phase number is unknown, which means the first month of collection is establishing your own baseline and the metric is only interpretable as a trend against yourself.

## Self-report cannot be one of the measurements

METR ran a randomised controlled trial (arXiv:2507.09089) with 16 experienced open source maintainers across 246 real tasks on their own mature repositories. Working with AI tools, they were 19% slower. They had forecast 24% faster beforehand. After finishing, they still believed they had been about 20% faster.

Perception and effect are separated by roughly 39 points, and the sign is wrong, not just the magnitude. Practitioner perception here is not a weak signal to be weighted down. It is a signal that can point the opposite way from the truth, which disqualifies it from the instrument entirely.

**Consequence for the reader:** a developer survey is evidence about morale and adoption. It is not evidence about throughput, and a satisfaction score cannot be cited in the same paragraph as a productivity claim.

## The dependency nobody reviews, and the cost nobody prices

Skills, commands and templates are executable. A team copies a skill directory from a repository, grants it permissions, and runs it against a production checkout. That is a supply chain, with ordinary supply chain risk, and it is currently reviewed less carefully than a package dependency.

Checked on 2026-09-21 against the repositories of the two most adopted frameworks in the table:

- Spec Kit installs with `uv tool install specify-cli`, followed by a `specify init` command taking a project name. The repository documents no signing, no checksums and no provenance verification for the templates, commands and agent files it writes into the working tree.
- BMAD installs with `npx skills add bmad-code-org/BMAD-METHOD`. The documented install command pins no version, and the repository documents no signing, checksum validation, provenance tracking or permission scoping for the persona and agent files it installs. Versions are reconciled afterwards with `bmad update`.

Both commands write executable instruction files with repository-level reach, resolved from a moving reference, with none of the integrity controls the same team would demand of an npm or PyPI dependency sitting in the same checkout.

**The audit you can run this week:** enumerate every skill, command and template directory currently executable in your repository. For each one, record where it came from and at which revision, record which permissions it runs under, and mark whether anyone reviewed it before it was granted a production checkout. The rows you cannot fill are the finding. What is missing upstream is unexciting and overdue: signing, verifiable manifests, permission scoping, provenance review. The governing question is not whether agents can execute. They can. It is under which permissions, and with what evidence afterwards.

Then the trade-off the score table makes visible. Read the portability column against the total: the deepest processes score lowest on portability, and the frameworks that travel across agents are the thin ones. BMAD at 10 scores 1 on portability. Spec-Flow at 11 scores 1. Spec Kit at 8 and OpenSpec at 6 score 2. Process depth is paid for in lock-in, reliably enough that it looks structural rather than incidental.

**Name the switching cost before you choose.** The process is the asset. If the agent changes, the artefacts, roles and gates are what you would have to rewrite, and nobody has published what that migration actually costs.

## Where this stops being true, and one move for this week

No process benchmark exists. That is the honest state of the field, and it bounds everything above:

- The dimensional scores are documentation review by a single rater, with no inter-rater reliability.
- Most framework claims are documentation and anecdote.
- The output studies measure what code looks like, not which process produced it. The GitClear trend is a population-level signal, not an attribution.
- Portability cost is unpriced.

That is still enough to act on, because the instrument does not depend on any framework being right.

Small enough to finish this week: score your current setup 0/1/2 on the six dimensions. Take the lowest. Instrument exactly one leading metric for it. If the zero is validation, count corrections per phase. If the zero is context, measure source-citation coverage on the changes an agent produced. If the zero is roles, write down the named decision authority for each phase, then count violations per week, where a violation is a phase whose decision was made by someone or something other than the named authority.

One dimension, one metric, one baseline. That beats a framework comparison you cannot check.
