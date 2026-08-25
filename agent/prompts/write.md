<!-- stage: write -->

# Stage: write

Write the full article from the approved outline. Output is one Markdown
document: frontmatter, then prose. Nothing before the opening delimiter and
nothing after the last line of the article.

## The approved outline

{{OUTLINE}}

Follow it. The outline is what the operator approved; the thesis, the section
order and the tags are settled. If a section turns out to have nothing behind
it, cut it and make the rest carry the weight — do not replace it with padding.

## What justifies the length

An article that could have been a post is a failure of this stage. The length is
earned by things a post cannot hold, and the piece must contain several of them:

- **a diagnostic table** that separates failure modes which present identically,
  with the symptom and the check in adjacent columns;
- **applicable figures** — orders of magnitude, thresholds, costs, latencies —
  each one either a public checkable fact or given to you in the outline;
- **a decision rule** stated as a rule, with its cut-off;
- **an order of operations**, when doing the right things in the wrong order is
  the actual failure;
- **the trap nobody checks** — the thing that is not instrumented, so it is
  never the first suspect;
- **honest limits**: where the advice stops applying, what it costs, what it
  does not fix.

Prefer a table to three paragraphs whenever the content is a comparison. Prefer
a rule to advice. Prefer a named mechanism to an adjective.

## Structure

- Open on the concrete case, in the first sentence. No throat-clearing, no
  definition of the field, no announcement of what the article will cover.
- After the opening, one short paragraph saying what the article gives the
  reader. That is the only meta sentence allowed.
- `##` headings only for sections, `###` sparingly beneath them. The `#` level
  never appears in the body: the title lives in the frontmatter.
- Bold only for the label that opens a paragraph, never for emphasis inside a
  sentence.
- Code fences only for real code, config or output. Never for pseudo-prose.
- Close on the technical point or on what to do next, never on him and never on
  a summary of what was just read.

## Frontmatter

Required keys, exactly these: {{ARTICLE_REQUIRED_FRONTMATTER}}. The only other
keys permitted at all: {{ARTICLE_ALLOWED_FRONTMATTER}}. The content schema is
strict — an unknown key fails the build.

```yaml
---
title: "the title from the outline"
date: {{TODAY}}
tags: [primary-first, second, third]
readingTime: whole minutes, consistent with the word count
excerpt: "the excerpt from the outline"
---
```

- `tags`: between {{ARTICLE_MIN_TAGS}} and {{ARTICLE_MAX_TAGS}}, from this
  vocabulary and nothing else, the first one primary:

{{TAG_VOCABULARY}}

- `excerpt`: between {{ARTICLE_EXCERPT_MIN_CHARS}} and
  {{ARTICLE_EXCERPT_MAX_CHARS}} characters, rendered verbatim as the meta
  description, the social card description and the feed description.
- `readingTime`: a positive whole number of minutes.

## Measured limits

- Between {{ARTICLE_MIN_WORDS}} and {{ARTICLE_MAX_WORDS}} words of body prose.
- At most {{ARTICLE_MAX_EM_DASHES_PER_100_WORDS}} em dashes per hundred words.
  Unedited model prose runs several times that; a comma, a full stop or a colon
  is almost always the better mark.
- At most {{ARTICLE_MAX_EMOJI}} emoji.
- These phrases fail the article outright:

{{ARTICLE_BANNED_PHRASES}}

- No marker for anything to be supplied later. If the outline recorded a gap,
  write around it.

## The voice, shown rather than described

These are his published pieces. Match their register, their paragraph length,
their willingness to name a number, and their endings. Do not reuse their
sentences, their examples or their structure — a piece that reads as a variant
of one of these is a failure of a different gate.

{{GOLDENS}}

## If this is a retry

Everything below is empty on the first attempt. When it is not, it is the
literal output of the deterministic gates against your previous draft, and the
operator's own words if they supplied any. Fix exactly what is named — each
failure carries the gate, the value it measured and the limit it measured
against, so the distance is not a matter of opinion. Change nothing else.

{{GATE_REPORT}}

{{OPERATOR_FEEDBACK}}
