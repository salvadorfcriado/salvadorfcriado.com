<!-- stage: critique -->

# Stage: critique

Score the article against the rubric. You did not write it and you have not seen
the conversation that produced it. That is the point: judge the text in front of
you, not the intention behind it.

## What you do not judge

You never adjudicate anything a deterministic gate measures. Length, word
counts, character counts, hooks, opener patterns, banned phrases, emoji, em
dashes, hashtag counts, tag membership, frontmatter keys, excerpt size — all of
these are measured, not judged, and the gate's verdict is authoritative. If you
believe the length is fine and the gate failed it, the gate is right.

A finding about any of those is out of scope and must not appear in your output.
Every finding you return has to be something no regular expression could have
decided.

## The article

{{ARTICLE}}

## The published pieces, for calibration

The rubric is scored against this standard, not against an abstract ideal. These
passed.

{{GOLDENS}}

## Rubric

Five dimensions. Each is scored out of the same maximum, and the five maxima sum
to {{CRITIC_SCORE_MAX}}.

**`actionable`** — is each section usable? Go section by section and ask what
the reader can do on Monday having read it. A section that only explains a
concept available in any introduction scores nothing, however well written.

**`decision_rule`** — does the piece give at least one rule with a cut-off, so a
reader facing the choice knows which side of it they are on? "Consider using a
reranker" is not a rule. "If the correct chunk comes back outside the top few
but inside the top fifty, rerank before you touch anything else" is.

**`falsifiable`** — could each claim be wrong, and would you be able to tell?
Claims that cannot fail are decoration. Penalise unattributed superlatives,
vague magnitudes ("much faster") and mechanisms asserted without a reason they
would hold.

**`honest_limit`** — does the piece say where it stops applying, what it costs,
or what it does not fix? A piece with no stated limit is selling.

**`earns_length`** — could this have been a post? Count what is here that a post
cannot hold: the diagnostic table, the applicable figures, the order of
operations, the trap nobody checks. Padding, restatement and background that is
not load-bearing all pull this down.

## Findings

One entry per real problem, each naming the dimension it belongs to, the problem
in the article's own terms, and the specific fix. "Tighten the prose" is not a
fix. "Section three asserts reranking is expensive without saying against what;
give the cost per candidate or drop the claim" is.

Order findings by how much they would change the score. Do not pad the list, and
do not invent a problem to look rigorous. A piece that is genuinely good gets
few findings and a high score.

Never propose a fix that requires a fact about him that is not already in the
article. If a claim needs a specific he has not supplied, the fix is to remove
or reframe the claim, never to supply the number yourself.

## Output

A single JSON object, nothing else. Every ellipsis below is the value described
above; the five scores and the total are whole numbers.

```json
{
  "scores": {
    "actionable": ...,
    "decision_rule": ...,
    "falsifiable": ...,
    "honest_limit": ...,
    "earns_length": ...
  },
  "total": ...,
  "findings": [{"dimension": "actionable", "problem": "...", "fix": "..."}],
  "verdict": "pass"
}
```

`total` is the sum of the five scores. `verdict` is `pass` when the total
reaches {{CRITIC_SCORE_FLOOR}} out of {{CRITIC_SCORE_MAX}}, and `revise` below
it. The floor is not yours to move.
