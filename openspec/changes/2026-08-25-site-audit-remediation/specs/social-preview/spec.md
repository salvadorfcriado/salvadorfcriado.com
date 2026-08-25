# social-preview Specification

## ADDED Requirements

### Requirement: Every indexable listing surface has its own card

Tag archives SHALL render their own preview card from the tag's label and blurb, rather
than falling back to the site default. The site default remains correct for the landing
page and for pages with no subject of their own.

#### Scenario: A tag archive is shared

- **WHEN** the URL is unfurled
- **THEN** the card names that topic, not the site generally

### Requirement: A card never clips its subject

The card generator SHALL guarantee that the title fits the frame — by a declared clamp, or
by failing the build with an error naming the post when the title exceeds what the layout
can hold. Silent overflow past the capture frame SHALL NOT be possible.

#### Scenario: A post carries an unusually long title

- **WHEN** the card is generated
- **THEN** either the title is clamped within the frame, or the build fails before the card
  can be published and cached by a platform

### Requirement: The social title is separate from the page title

`og:title` and `twitter:title` SHALL be emitted from a value distinct from the document
title, and SHALL NOT repeat the site name that `og:site_name` already carries.

#### Scenario: A platform truncates the headline

- **WHEN** the truncated headline is read
- **THEN** it contains the subject of the page

### Requirement: The card store is not a general asset directory

Hand-authored cover images SHALL live outside the card output directory, which is build
output and is cleared on every generation. That constraint SHALL be documented where the
`cover` frontmatter field is described.

#### Scenario: A hand-made cover is placed in the generated directory

- **WHEN** the next build runs
- **THEN** the constraint is documented such that this is not attempted

### Requirement: Card generation is incremental

The generator SHALL re-render only cards whose inputs changed, SHALL remove cards whose
post no longer exists, and SHALL skip launching a browser when nothing needs rendering.

#### Scenario: One post of many is edited

- **WHEN** the build runs
- **THEN** only that post's card is re-rendered

### Requirement: Card styling derives from the brand tokens

The generator SHALL take its colours, typography and spacing from the same token source as
the site, rather than restating approximate values.

#### Scenario: A brand colour changes

- **WHEN** the token is updated and the site rebuilt
- **THEN** newly generated cards use the new value without a separate edit
