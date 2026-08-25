# social-preview Specification

## Purpose
TBD - created by archiving change tags-and-cv-removal. Update Purpose after archive.
## Requirements
### Requirement: Every published post has its own preview image

The build SHALL produce one 1200×630 PNG preview card per published, non-draft post, keyed by
the post's slug, rendered with the site's brand typefaces and palette and carrying the post's
primary tag, its title, and the site domain. Card generation SHALL run before the site build,
so a built `dist/` can never contain a post whose card is missing or stale relative to its
title or tags.

If the rendering toolchain is unavailable, the build SHALL fail with a message naming what is
missing. It SHALL NOT complete by falling back to the site-wide default card.

#### Scenario: A new post is added and the site is built

- **WHEN** `npm run build` runs with a post that has no generated card
- **THEN** a card is rendered for that post before the site build begins
- **AND** the built page for that post references it

#### Scenario: A post's title is edited

- **WHEN** the title changes and the site is rebuilt
- **THEN** that post's card is re-rendered with the new title

#### Scenario: The renderer is unavailable

- **WHEN** the build runs and the rendering toolchain cannot be loaded
- **THEN** the build exits non-zero with a message naming the expected toolchain and path
- **AND** no `dist/` is produced

#### Scenario: A draft post

- **WHEN** a post declares `draft: true`
- **THEN** no card is generated for it

### Requirement: A post may override its generated card

A post SHALL be able to supply its own preview image through the `cover` frontmatter field.
When present, that image SHALL be used as the post's preview in place of the generated card.

#### Scenario: Post supplies a cover

- **WHEN** a post's frontmatter sets `cover` to an image path
- **THEN** that path is what the post page advertises as its preview image

#### Scenario: Post supplies no cover

- **WHEN** a post's frontmatter omits `cover`
- **THEN** the post's generated card is what the post page advertises

### Requirement: Post pages advertise themselves as articles

A post page SHALL declare Open Graph type `article` and SHALL emit its publication time,
modification time, and one Open Graph tag entry per post tag. Pages that are not posts SHALL
continue to declare type `website`.

#### Scenario: Unfurling a post URL

- **WHEN** a crawler fetches a post page
- **THEN** the document declares `og:type` as `article`
- **AND** it carries `article:published_time` and one `article:tag` per post tag

#### Scenario: Unfurling the home page

- **WHEN** a crawler fetches a non-post page
- **THEN** the document declares `og:type` as `website`

### Requirement: Preview images are declared so a large card can render

Every page SHALL express its preview image as an absolute URL and SHALL declare that image's
pixel width, pixel height, and alternative text. A relative preview URL SHALL NOT be emitted.

#### Scenario: Preview metadata on a post page

- **WHEN** a post page renders its head
- **THEN** `og:image` is an absolute `https://` URL on the site's own domain
- **AND** `og:image:width`, `og:image:height` and `og:image:alt` are present

#### Scenario: Preview metadata on any other page

- **WHEN** any non-post page renders its head
- **THEN** its preview image is likewise absolute and dimensioned

### Requirement: The publish order that makes the first unfurl correct is documented

The project SHALL record, alongside its deploy procedure, that a URL is deployed and its card
verified before that URL is composed into a post, and that an already shared URL is refreshed
through the platform's inspector tool. This is documented rather than left to memory because a
social platform caches a URL's preview on first fetch and does not refresh it when the post
that carries the URL is edited.

#### Scenario: Someone follows the deploy documentation

- **WHEN** a person reads the deployment section of the infrastructure documentation
- **THEN** they find the ordering — deploy, verify the card resolves, refresh the inspector,
  then compose — stated as part of the procedure

### Requirement: Existing shared post URLs are refreshed after deploy

The change SHALL not be considered complete until every already-published post URL has been
put through the social platform's preview inspector, so that the cached generic card is
replaced by the post's own.

#### Scenario: Post-deploy verification

- **WHEN** the change is deployed
- **THEN** each of the previously published post URLs has been submitted to the inspector
- **AND** the preview it reports is that post's own card

### Requirement: Retired CV URLs redirect rather than 404

The CV SHALL be removed from the site: its download affordance, its entry in the
machine-readable site summary, its constant, and the asset itself. Requests to its former
path SHALL be permanently redirected to the site root rather than answered with a 404, since
the URL has been distributed and indexed.

#### Scenario: A previously distributed CV link is opened

- **WHEN** a request arrives for a path under the retired CV location
- **THEN** the response is a 301 redirect to the site root

#### Scenario: The site no longer offers the CV

- **WHEN** the built site is searched for CV references
- **THEN** no page links to the CV, the machine-readable summary does not list it, and the
  asset is not present in the build output

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
