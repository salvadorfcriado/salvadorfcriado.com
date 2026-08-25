<!-- stage: plan -->

# Stage: plan

Produce the outline for one article. This is the stage the operator approves
before any prose exists, so it has to be arguable on its own.

## Input

Topic:

{{TOPIC}}

Brief:

{{BRIEF}}

## The thesis is the whole job

The thesis is a claim someone competent could disagree with, and that the
article then makes hard to disagree with. It is not a topic, not a title, not a
description of what the article covers.

- Not a thesis: "how retrieval works in RAG systems".
- A thesis: "most RAG failures blamed on retrieval are ranking failures, and the
  two are fixed in opposite directions".

If the topic as given is a subject rather than a claim, your job is to pick the
claim inside it that is worth defending, and say which one you picked.

## What the outline must carry

Every section needs a reason to exist that survives the question *what can the
reader do with this?* Across the outline, at least one section carries each of:

- a diagnostic that separates two failure modes that look identical;
- a decision rule, stated as a rule ("if X, do Y; below Z, do not bother");
- an order of operations, when the order is what people get wrong;
- the trap nobody checks;
- an honest limit — where this stops being true.

Sections whose only content is background go in the bin. Background is a clause
inside the section that needs it.

## Tags

Choose from this vocabulary and nothing else. A tag outside it fails the site
build. Between {{ARTICLE_MIN_TAGS}} and {{ARTICLE_MAX_TAGS}} tags; the first is
primary and decides the cover and the social card, so order carries meaning.

{{TAG_VOCABULARY}}

## Excerpt

One or two sentences, between {{ARTICLE_EXCERPT_MIN_CHARS}} and
{{ARTICLE_EXCERPT_MAX_CHARS}} characters. It is rendered verbatim as the meta
description, the social card description and the feed description, so it must
read as a sentence about the article, not as a label for it.

## Gaps

Every specific the article would be stronger for and that you were not given
goes in `gaps`: a number he would have to supply, an incident only he can tell,
a benchmark, a date. One entry per gap, naming what is missing and which section
wants it. Do not invent any of them, and do not quietly plan a section that
depends on one.

An empty `gaps` array on a topic that plainly needs specifics is itself a
failure — it means you were planning to make something up.

## Output

A single JSON object, nothing else:

```json
{
  "title": "sentence case, no colon-subtitle construction",
  "angle": "one sentence on why this piece, from him, now",
  "thesis": "the arguable claim, one sentence",
  "sections": [
    {
      "heading": "the section heading as it will appear",
      "claim": "what this section asserts",
      "evidence": "what makes it stick: the table, the figure, the rule, the failure mode"
    }
  ],
  "gaps": ["what is missing, and where it would go"],
  "tags": ["primary-first"],
  "excerpt": "the excerpt"
}
```

Plan for an article of between {{ARTICLE_MIN_WORDS}} and {{ARTICLE_MAX_WORDS}}
words. Size the section list accordingly: fewer sections that each carry a
mechanism beat many that each carry a paragraph.
