# blog-taxonomy Specification

## Purpose
TBD - created by archiving change tags-and-cv-removal. Update Purpose after archive.
## Requirements
### Requirement: Closed tag vocabulary with a single source of truth

The site SHALL define its tag vocabulary in exactly one module, `src/tags.ts`, exporting an
ordered list of tags where each tag has a kebab-case `slug`, a human-readable `label`, and a
one-sentence `blurb`. The content collection schema SHALL derive its permitted values from
that module rather than restating them. Every rendering of a tag to a reader SHALL use the
`label`; every URL and every data-format value SHALL use the `slug`.

The module SHALL also carry the reserve vocabulary as documentation and the rule for
promoting a reserve tag into the active enum.

#### Scenario: A post declares a tag outside the vocabulary

- **WHEN** a post's frontmatter contains a tag slug that is not in `src/tags.ts`
- **THEN** the build fails with a validation error naming the offending post and value
- **AND** no page is emitted for that tag

#### Scenario: A tag's display name changes

- **WHEN** a tag's `label` is edited in `src/tags.ts`
- **THEN** the new label appears on the blog index chips, the post pages, and the tag archive
- **AND** the tag's URL, its value in the RSS feed, and its value in `llms.txt` are unchanged

### Requirement: Posts carry one to three ordered tags

Each published post SHALL declare a `tags` array with at least one and at most three values
from the vocabulary. The first element SHALL be the post's primary tag. Order SHALL be
preserved wherever tags are rendered or serialised.

#### Scenario: Post declares more than three tags

- **WHEN** a post's frontmatter lists four or more tags
- **THEN** the build fails with a validation error

#### Scenario: Post declares no tags

- **WHEN** a post's frontmatter omits `tags` or provides an empty array
- **THEN** the build fails with a validation error

#### Scenario: Primary tag drives single-tag surfaces

- **WHEN** a surface has room for exactly one tag, such as a post cover
- **THEN** the first element of `tags` is the one rendered

### Requirement: Each tag in use has a static archive page

For every vocabulary tag carried by at least one published, non-draft post, the site SHALL
prerender a page at `/blog/tags/<slug>/` listing that tag's posts newest first, showing for
each the date, title and excerpt. The page SHALL state the tag's `label` as its heading and
its `blurb` as both the on-page introduction and the page meta description. The page SHALL
offer a link back to `/blog/`.

Tags with no published posts SHALL NOT produce a page.

#### Scenario: Reader opens a tag archive

- **WHEN** a reader requests `/blog/tags/rag/`
- **THEN** the response is prerendered HTML listing every published post whose `tags` contains
  `rag`, newest first
- **AND** the listing requires no client-side JavaScript to display

#### Scenario: Vocabulary tag has no posts

- **WHEN** a tag exists in `src/tags.ts` but no published post declares it
- **THEN** no page is generated at that tag's URL
- **AND** no chip links to it

#### Scenario: A post is the only one with its tag and becomes a draft

- **WHEN** that post's frontmatter sets `draft: true` and the site is rebuilt
- **THEN** the tag's archive page is no longer emitted
- **AND** the tag's chip no longer appears on the blog index

### Requirement: Readers can move between a post and its topics without JavaScript

The blog index SHALL present a chip for each tag in use, each chip a link to that tag's
archive. Each post page SHALL present its own tags as links to their archives. On a tag
archive page, that tag's chip SHALL be marked as the current page for assistive technology
and styled as active.

#### Scenario: Reader follows a topic from a post

- **WHEN** a reader clicks a tag chip on a post page
- **THEN** they arrive at that tag's archive page

#### Scenario: Chip state on an archive page

- **WHEN** a tag archive page renders its chip row
- **THEN** the chip for the current tag carries `aria-current="page"`
- **AND** the remaining chips link to their own archives

### Requirement: Machine-readable outputs carry the full tag list

The RSS feed, `llms.txt` and each post's `BlogPosting` structured data SHALL express all of a
post's tags, in declaration order, not only the primary one. RSS SHALL emit one `<category>`
per tag.

#### Scenario: A post with three tags is serialised

- **WHEN** the RSS feed is generated for a post declaring three tags
- **THEN** the item contains three `<category>` elements in declaration order

#### Scenario: Structured data keywords

- **WHEN** a post page renders its JSON-LD
- **THEN** the `BlogPosting` `keywords` value lists all of the post's tags

### Requirement: Existing posts are migrated to the new vocabulary

The three published posts SHALL be re-tagged from the retired single-value enum onto the new
vocabulary, with their primary tag chosen deliberately rather than derived mechanically from
the old value. The retired values `voice` and `stacks` SHALL NOT appear in the new vocabulary.

#### Scenario: Build after migration

- **WHEN** the site is built following the migration
- **THEN** every published post validates against the new schema
- **AND** no page, feed entry or structured-data field references `tag`, `voice` or `stacks`

