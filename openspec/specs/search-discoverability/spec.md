# search-discoverability Specification

## Purpose
TBD - created by archiving change 2026-08-25-site-audit-remediation. Update Purpose after archive.
## Requirements
### Requirement: The Person node describes an entity seeking employment

The JSON-LD `Person` node SHALL carry `jobTitle` (including the plain forms an employer
searches for), `description`, `image`, `address`, `workLocation`, `knowsLanguage`,
`knowsAbout`, `hasCredential` for each named certification, `hasOccupation`, and `seeks`
expressing the employment sought. It SHALL NOT carry `alternateName`.

The landing page SHALL additionally emit a `ProfilePage` node whose `mainEntity` is that
person.

#### Scenario: An answer engine is asked whether he is available

- **WHEN** the structured data alone is read
- **THEN** the employment sought, its terms and its location are determinable

#### Scenario: A knowledge graph reconciles the entity

- **WHEN** `sameAs` is read
- **THEN** it lists every public profile the site claims, and no alias for the legal name

### Requirement: Every page states its place in the site

Blog posts, tag archives and the blog index SHALL each emit a `BreadcrumbList` reflecting
their position. A `BlogPosting` SHALL declare `isPartOf` the site's `Blog` node.

#### Scenario: A post appears in a search result

- **WHEN** the result is rendered
- **THEN** a breadcrumb trail is available from the markup

### Requirement: Pages that should not rank say so

The base layout SHALL accept a `noindex` flag emitting `<meta name="robots" content="noindex, follow">`.
The flag SHALL be applied to the error page and to any archive whose unique content is
below the site's thin-content threshold. Such pages SHALL also be excluded from the
sitemap.

#### Scenario: An unmatched path is requested

- **WHEN** the error page is served for that path
- **THEN** it carries `noindex`
- **AND** it does not canonicalise the request to itself as an indexable URL

#### Scenario: A tag archive holds fewer posts than the threshold

- **WHEN** the archive is built
- **THEN** the page still exists and remains reachable
- **AND** it is marked `noindex` and omitted from the sitemap until it grows

### Requirement: The feed is complete and self-describing

`rss.xml` SHALL carry an `atom:link rel="self"`, `lastBuildDate`, `language`, a managing
editor, a channel link pointing at the blog index, and per-item categories rendered as the
tag labels used elsewhere rather than raw slugs.

#### Scenario: The feed is submitted to a validator

- **WHEN** it is checked
- **THEN** it raises no warning for a missing self-link or missing build date

### Requirement: Machine-readable inventories agree with the site

The sitemap SHALL list every indexable page with a `lastmod`. `robots.txt` SHALL state an
explicit position on AI and answer-engine crawlers and SHALL reference the sitemap.
`llms.txt` SHALL follow its published format, SHALL describe the site accurately, and
SHALL NOT name a page that no longer exists or that is excluded from indexing.

#### Scenario: A post is edited

- **WHEN** the site is rebuilt
- **THEN** that URL's `lastmod` reflects the post's date, not the build date alone

#### Scenario: The inventories are compared

- **WHEN** the sitemap and `llms.txt` are diffed on post URLs
- **THEN** they list the same set

### Requirement: Titles and descriptions are budgeted

Each page SHALL carry a `<title>` short enough to survive search-result truncation and a
meta description between 120 and 160 characters. Social titles SHALL be emitted separately
from page titles, without repeating the site name that `og:site_name` already carries.

#### Scenario: A post is unfurled on a social platform

- **WHEN** the preview headline is truncated by the platform
- **THEN** the post's own title survives, not a site-name suffix

### Requirement: The queries an employer types appear on the page

The literal role names an employer searches for SHALL appear in rendered text — not only as
a compound the site prefers. Section headings SHALL carry meaning rather than an ordinal
alone.

#### Scenario: A recruiter searches for the role plus the city

- **WHEN** the site's rendered text is matched against the query
- **THEN** the role name and the city occur together in at least one element

### Requirement: The site presents a complete icon and manifest set

Every page SHALL reference an SVG icon, a fallback raster icon, an apple-touch icon, a web
manifest and a theme colour.

#### Scenario: The site is added to a phone home screen

- **WHEN** the bookmark is created
- **THEN** it uses the supplied icon and name, not a screenshot

### Requirement: Publication dates are not in the future

A published post SHALL NOT carry a date later than the build date. Posts scheduled for a
future date SHALL be held as drafts until that date.

#### Scenario: A post is written ahead of its publication date

- **WHEN** the site is built before that date
- **THEN** the post is excluded from the site, the feed and the sitemap
