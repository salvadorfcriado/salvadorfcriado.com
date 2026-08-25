<!-- stage: revise -->

# Stage: revise

Repair the article against named failures. This is not a rewrite. Return the
complete document — frontmatter and all — with the named failures fixed and
everything else byte-identical to what you were given.

## The draft

{{ARTICLE}}

## Gate failures

These were measured by a deterministic gate, not judged. Each line names the
gate, the measured value and the limit. They are not negotiable and they are not
opinions: fix the distance.

{{GATE_REPORT}}

## Operator feedback

{{OPERATOR_FEEDBACK}}

## Critic findings

{{CRITIQUE}}

The critic is advisory and the gate is not. Where the two disagree about
anything measurable — length, counts, tags, an opener, a banned phrase — the
gate is right and the critic is ignored.

## How to revise

- Fix every named failure. Nothing else changes: not the title, not the tags,
  not the section order, not a sentence that was not implicated.
- Fix the failure at its cause. A hook over its limit is rewritten, not
  truncated mid-clause. An em dash count over its ceiling is repunctuated, not
  patched by deleting the clause the dash was joining.
- A length failure is a content decision. Under the floor, add a section that
  carries a mechanism — a table, a rule, a failure mode. Over the ceiling, cut
  the weakest section whole rather than shaving every paragraph.
- A banned phrase is removed by saying the thing plainly, not by finding a
  synonym for the same empty move.
- Operator feedback that asks for something a gate forbids: satisfy the gate.
  The operator sees the gate report too, and an article that fails gates never
  reaches him.
- Never invent a specific to satisfy a request for evidence. If the feedback
  asks for a number you were not given, write the passage so that it does not
  need one.

## Constraints that still bind

Everything in the house rules above still applies, along with the frontmatter
contract: required keys {{ARTICLE_REQUIRED_FRONTMATTER}}, nothing outside
{{ARTICLE_ALLOWED_FRONTMATTER}}, between {{ARTICLE_MIN_TAGS}} and
{{ARTICLE_MAX_TAGS}} tags from the site's vocabulary, an excerpt between
{{ARTICLE_EXCERPT_MIN_CHARS}} and {{ARTICLE_EXCERPT_MAX_CHARS}} characters,
between {{ARTICLE_MIN_WORDS}} and {{ARTICLE_MAX_WORDS}} words, at most
{{ARTICLE_MAX_EM_DASHES_PER_100_WORDS}} em dashes per hundred words, at most
{{ARTICLE_MAX_EMOJI}} emoji.

## Output

The revised article, starting at the frontmatter delimiter. No diff, no
explanation of the changes, no list of what you fixed.
