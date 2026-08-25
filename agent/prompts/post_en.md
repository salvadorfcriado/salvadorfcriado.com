<!-- stage: post_en -->

# Stage: post_en

Write the LinkedIn post in English that pairs with the article.
The gates will measure it as language `{{LANG}}`, and every limit below is
already the one for that language.

## The article

{{ARTICLE}}

## The post is the asset, not the trailer

It has to be worth reading by someone who never opens the article. A post whose
job is to make you click is a post that gave nothing, and the platform ranks it
accordingly. Take the single most useful mechanism in the article and deliver it
in full: the diagnostic, the rule, the number, the failure mode. Leave the other
mechanisms in the article.

One idea. Not a summary of the article, not a list of its headings.

## The hook

The first line, alone, before a blank line.

- At most {{POST_HOOK_MAX_CHARS}} characters and at most {{POST_HOOK_MAX_WORDS}}
  words. Both bind: a short word count can still overrun the character limit,
  and the limit is the mobile truncation point.
- Never a question. The feed is full of them and they buy nothing.
- Concrete. A measurement, a symptom, a named failure. His published hooks open
  on a rank, on a system that does not break, on a number that is wrong.
- Rotate the shape. Do not open two consecutive posts the same way.

## Body

- Between {{POST_BODY_MIN_CHARS}} and {{POST_BODY_MAX_CHARS}} characters,
  hashtags included.
- Short paragraphs, one to three sentences, blank line between them. No bullet
  characters, no numbered lists, no headings.
- At least {{POST_MIN_DIGITS}} digit somewhere in the body: a measurement, a
  threshold, a version, a rank. It is the part a model cannot fake without
  lying, so it must come from the article rather than from you.
- At most {{POST_MAX_EM_DASHES}} em dashes in the whole post, preferably none.
- At most {{POST_MAX_EMOJI}} emoji, never as a bullet, and none is better.
- No outbound link, in the body or anywhere else. The link in the first comment
  is dead — the platform now penalises the comment and suppresses it as well.
  When a piece cannot work without sending the reader away, that is a signal the
  post has not been given enough to stand on.
- The closing line lands the point or tells the reader what to check first. It
  does not invite engagement, ask for opinions, or mention him.

## Hashtags

At most {{POST_MAX_HASHTAGS}}, at the {{HASHTAG_POSITION}}, on their own line
after a blank line. Niche and technical. Umbrella tags add no reach because the
ranker reads the body, not the tags.

## The voice, shown rather than described

{{GOLDENS}}

## Output

The post text and nothing else. No title, no label, no quotation marks around
it, no note about length.

## If this is a retry

Empty on the first attempt. Otherwise it is the literal gate output against your
previous post, plus the operator's words if they supplied any. Each failure
names the gate, the measured value and the limit. Fix what is named and nothing
else.

{{GATE_REPORT}}

{{OPERATOR_FEEDBACK}}
