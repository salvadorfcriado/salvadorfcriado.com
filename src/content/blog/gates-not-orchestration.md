---
title: "The gates are the product, not the orchestration"
date: 2026-08-25
tags: [llmops, evaluation]
readingTime: 9
excerpt: "The orchestration in an AI content pipeline is the boring part. What decides whether text ships is a set of model-free functions with an exit code."
---

The draft was a LinkedIn post with a fenced code block in it. LinkedIn renders no Markdown, so what would have shipped was three backticks, the text, three backticks, verbatim, as characters. The model that wrote it had been told the target platform. It knew. It produced the fence anyway, and nothing in the pipeline objected, because the only thing standing between that draft and the clipboard was another model reading it for quality.

This is what I changed and why. The pipeline used to be an n8n workflow. It is now a repository where the last thing that touches a draft is a function with no model in it that returns 0 or 1. That rebuild moved my estimate of where the engineering lives in these systems, and this article is that estimate: which rules deserve to be enforced mechanically, in what order to run the checks, the failure mode that never gets instrumented, and where the whole approach stops working.

## A model cannot tell you it checked

Every interface between you and a language model lets it report rather than prove. A prompt instruction is satisfied by claiming compliance. A checklist in the system prompt is satisfied by claiming compliance. A self-grade in the response is satisfied by generating a number. None of these are lies exactly. They are a system where the measurement and the thing measured come out of the same forward pass, so the measurement carries no independent information.

A process exit code is the one interface where that is not possible. The function runs or it does not. It reads the bytes on disk, not the intent that produced them.

The practical consequence is that the check becomes a command anyone can run. In my pipeline the same gate command is consumed by three callers that share nothing:

- a **Stop hook** in the agent harness, which runs when the model tries to end its turn;
- a **headless driver**, which runs a piece end to end without a human in the loop;
- a **pytest case**, which runs it against fixtures on every edit.

None of the three adapts the gate. They all invoke it and read the exit status. That is the whole integration surface, and it is the reason the same rule cannot mean one thing interactively and something looser in batch. A rule that behaves differently depending on who asked is not a rule.

The failure output matters as much as the exit code. A bare non-zero tells you something is wrong and hands the model nothing to act on. What comes back instead is the gate name, the value it measured, and the limit it measured against:

```
[article.em_dash_density]  3.1 per 100 words, limit 1.5
[post.code_fence]          fenced block at line 12, limit 0
exit 1
```

Three fields, and the distance between where the draft is and where it needs to be stops being a matter of opinion. The revision request writes itself, and it writes itself the same way every time.

## Two failures that look identical from the operator's chair

"The pipeline produced something I won't publish" is one sentence covering two different failures, and they are fixed in opposite directions. Conflating them is why people rewrite prompts that were never the problem.

The diagnostic is one command. Run the gates.

| Symptom | Check | Failure | What changes |
|---|---|---|---|
| Text you reject, gates exit non-zero | Read the named gate and the offending value | **Rule violation.** The rule existed and the loop did not close | The gate's feedback path, or the threshold |
| Text you reject, gates exit 0 | Ask which rule it broke. You cannot name one | **Taste failure.** The rule does not exist yet | The rubric, or the outline |
| Text you accept, gates exit non-zero | Compare against work you already published | **The gate is wrong.** It rejects acceptable output | The gate, and only the gate |
| Same rejection recurring across drafts | Check whether the rule is in prompt text only | **A suggestion, not a rule** | Move it behind an exit code |

The second row is the expensive one, because it is the row where prompt tuning feels like progress. If you cannot name the rule the text broke, no prompt edit will reliably produce text that does not break it. You are asking the model to infer a constraint you have not stated, and you will get it some of the time, which is worse than never, because some of the time is what makes people keep going.

The tell that separates the rows is which artifact you end up editing. A rule violation changes a threshold or adds a check. A taste failure changes the rubric or the outline. If you find yourself editing the draft directly, you have diagnosed nothing and produced one good piece by hand.

## Which rules deserve to be a gate

Not all of them, and pretending otherwise gives you a gate that fails on good work, which is a worse outcome than no gate. This pipeline landed on 27 gates plus the build gate: 13 on posts, 12 on articles, 2 shared repetition checks.

**The rule: if you can name the failing substring or compute the failing number, write the gate. If the best you can do is describe the smell, do not write the gate.**

Worked one way: the machine-writing blacklist. The tells that mark text as unedited model output are, at the level that matters, a finite set of literal strings and one or two constructions. They are decidable by substring match. There is no judgement in it, no borderline case that needs a model to arbitrate. It is a gate, it runs with no model call, and it never disagrees with itself.

Worked the other way: "is this interesting". Real constraint, and the one that most determines whether a piece is worth publishing. Not nameable as a substring, not computable as a number. Write that as a gate and you get a proxy: word count, or heading density, or reading level, none of which is the thing you meant. The proxy then acquires authority it did not earn, and it starts rejecting good pieces for being short. That belongs in a rubric a model scores against, or in a human's hands, and the honest thing is to leave it there rather than dress it as an exit code.

There is a corollary to the rule that costs nothing and saves a category of bug. **A gate that needs a number needs that number declared once.** If the threshold lives in the gate and also appears in the prompt as prose, you have two copies, and they will diverge. Which brings me to the failure I did not see coming.

## Run the cheap deterministic checks before anything expensive looks at the text

The order is gates, then critic, then human. Inverting it is the most common waste in these pipelines, and it is not just a cost argument.

The code fence is the example. A model critic reading for argument quality has no reason to flag a fenced block. It is not a weakness in the argument. It is not a tell. The critic is reading for the things a critic is good at, and formatting that will not survive the target platform is not on that list. A check for the fence delimiter cannot miss it, cannot be talked out of it, and costs nothing.

That is the general shape: the failures a substring check catches are precisely the failures human and model attention are worst at. Attention is drawn to meaning. Nobody proofreads a delimiter. Spending a model call and then a person's twenty minutes on a draft the deterministic suite would have bounced in under two seconds is not a rounding error in cost, it is a rounding error in cost and a large error in what the expensive reviewers spend their attention on.

The enforcement is the part that makes the order stick. The Stop hook returns a block decision with the per-gate failures included verbatim. The model does not get to finish its turn. It is not asked to revise in a prompt it can decline to act on: the revision is imposed by the harness, and the same harness will impose it again if the next draft fails. The loop terminates when the gates exit clean, and that is the only condition under which it terminates.

Order of operations, cheapest first:

1. **Deterministic gates.** No model. Milliseconds. Structural and lexical failures.
2. **The model critic against a versioned rubric.** Runs only on text that already passes every gate.
3. **The human.** Reads for the thing neither of the above can score.

Each stage costs more than the one above it, and each one is only good at failures the stage above cannot see. Running them out of order does not produce a wrong answer. It produces the right answer after paying for the wrong reviewers.

## The trap: your prompts are configuration and nobody diffs them

Here is the bug that made me rebuild rather than patch.

The n8n workflow contained, in prompt text, an instruction to generate images against a specific colour palette. That palette had been retired. The brand had moved to a different one, and the site had moved with it, and the prompt had not, because prompt text is not code and nobody reviews it like code.

Nothing failed. No error, no warning, no red anything. The workflow ran correctly and generated exactly to spec, against the wrong spec, and kept doing it. This is the property that makes prompt drift different from every other kind of configuration drift in a system: everywhere else, a stale value produces an error or a visibly broken output. In prompt text it produces confident, well-formed, plausible output that is wrong in a way only someone who knows the current spec can see.

Vigilance does not fix this. I knew the palette had changed. I am the person who changed it. The prompt was not in the set of things I thought of as places a palette could be.

The structural fix is to stop having two copies. Thresholds and settings live in one configuration module and are substituted into prompts at call time. The prompt contains the slot, not the value. There is exactly one place to change a number, and no prose restatement of it to forget. The test suite has an assertion for this directly: it fails if a configured value appears as a literal in prompt text. Config drift stops being something you catch by remembering and becomes something you catch by running the tests.

## Goldens stop the gates from ratcheting shut

Every gate you add narrows the space of things that can ship. That is the point of a gate. It is also a one-directional force: nobody wakes up wanting to loosen a rule, and each individual tightening looks reasonable on the day. Run that for long enough and the pipeline can no longer produce anything you like, and the failure is invisible because each step of it was justified.

The counterweight is a fixed corpus of work you already approved. Previously published pieces are asserted in the test suite. A new gate that rejects one of them fails the build.

Read the direction of that carefully, because it is the whole value. The default verdict is that **the gate is wrong until proven otherwise**, not that the old piece was bad. You are free to conclude the piece was bad and update the corpus, but you have to make that call explicitly, and you have to make it while looking at the specific piece the gate just rejected. What you cannot do is tighten a rule and find out six weeks later that it quietly excluded the register you were trying to write in.

The economics are what make this a real safety net rather than ceremony. The suite is 171 tests, it runs in about 1.2 seconds, and it invokes no model. Nothing about it needs to be scheduled, batched, or reserved for release day. It runs on every edit, which means the golden check is not a gate you remember to pass. It is a thing that is already true or already broken by the time you have finished typing.

## Where this stops being true

Gates are necessary and nowhere near sufficient, and an argument like this one is only worth making if it also states what it cannot do.

**Prose is not reproducible.** Every gate here constrains the output space. None of them says anything about whether what lands inside that space is worth reading. Two drafts that both pass every check can differ completely in quality, and the exit code is identical. The gates guarantee a floor and no ceiling, and if you have not built the parts of the system that reach for the ceiling, a green build tells you almost nothing.

**A piece that passes every gate can still be dull.** This is the same limit stated in the direction that costs money. Nothing in a deterministic check detects that an article is well-formed, correctly cited, free of tells, correctly sized, and boring. That judgement stays with the rubric and with me, and no amount of gate-writing will move it.

**The thresholds are opinions with numbers attached.** The repetition gate in this pipeline rejects a draft at 0.60 similarity, and I picked 0.60. It is a first guess. I have not measured the distribution of that metric across text I consider good and text I consider bad, and until I do, that number has exactly the epistemic status of the retired palette in the old workflow: a value that is being enforced with total confidence because someone wrote it down once. The difference is that this one is in a single place with a name, so when I do measure it, there is one line to change. That is the entire improvement, and it is worth having, and it is not the same as being right.

The move that pays for itself fastest is small. Take one rule you currently state in a prompt, one you can name a failing substring or a failing number for, and write it as a function that returns an exit code. Then run it against the last five things you shipped. If it fails on one of them, you have learned something about the rule before it ever had authority over a draft.
