# hiring-positioning Specification

## ADDED Requirements

### Requirement: The site addresses employers only

Every page served from `salvadorfcriado.com` SHALL address recruiters, talent acquisition,
hiring managers and engineering leads considering Salvador F. Criado for employment. The
domain SHALL NOT carry a commercial surface: no services offer, no engagement model, no
booking or discovery-call CTA, no pricing or invoicing terms, no NDA or contracting
language, and no framing of Salvador as a founder, owner or company.

Commercial material belongs to the SCDAP brand and SHALL be served from `scdap.es`.

#### Scenario: A commercial page exists in the repository

- **WHEN** a page under `src/pages/` carries a services offer, an engagement model, or
  company framing
- **THEN** the change is rejected regardless of whether the page is linked from navigation

#### Scenario: A previously published services URL is requested

- **WHEN** a request arrives for `/services/` or any path beneath it
- **THEN** it is answered with a 301 to `https://scdap.es/`
- **AND** no page for that path is emitted into `dist/`

#### Scenario: A crawler enumerates the site

- **WHEN** `sitemap-index.xml`, `robots.txt` and `llms.txt` are read together
- **THEN** none of them names a commercial page or a commercial brand

#### Scenario: Structured data describes the person

- **WHEN** the JSON-LD graph of any page is parsed
- **THEN** it contains no `ProfessionalService`, `Organization` or `Offer` node for which
  the site's `#person` node is the `provider`

### Requirement: The legal name is never rendered

The site SHALL render the brand name "Salvador F. Criado" and SHALL NOT emit the legal
name in any output — visible text, `<meta>` content, JSON-LD (including `alternateName`),
`llms.txt`, `rss.xml`, or generated images.

#### Scenario: Any built artefact is searched for the legal name

- **WHEN** every file under `dist/` is searched for the legal surname string
- **THEN** there are zero matches

### Requirement: Claims are traceable to the career source of truth

Every factual claim rendered on the site SHALL be supported by `career/career.md` — years
of experience, throughput and scale figures, cloud and technology counts, project
outcomes, dates and date ranges. Work that is in progress SHALL be rendered in the present
or future tense and SHALL be labelled as in progress. Ownership language ("my platforms")
SHALL NOT be used for systems owned by a client.

#### Scenario: A claim exceeds what the source of truth documents

- **WHEN** a rendered figure is larger, a date range wider, or an outcome more complete
  than `career/career.md` records
- **THEN** the claim is rewritten to the documented value, or the discrepancy is resolved
  in `career/career.md` first with the user's explicit confirmation

#### Scenario: An engagement is ongoing

- **WHEN** a selected-work entry describes an engagement whose end date is "Presente" in
  `career/career.md`
- **THEN** the entry's date reads as open-ended and its description does not assert a
  completed outcome

### Requirement: The site states what he is looking for

The landing page SHALL carry, without scrolling past the hero, the availability terms an
employer needs: remote scope, timezone, and the fact that he is open to roles. It SHALL
also carry, in the About section, an explicit statement of the kind of role sought —
contract type, seniority band, and hands-on versus leadership preference — consistent with
`career/career.md`.

The footer SHALL carry a one-line availability status on every page, so that a reader who
arrives on a post rather than the landing page sees it.

#### Scenario: A recruiter scans the page for eight seconds

- **WHEN** only the hero is read
- **THEN** the role, the availability terms and a direct contact address are all present

#### Scenario: A reader arrives on a blog post from search

- **WHEN** the post is read to the end
- **THEN** the footer offers a direct contact address, a route to the work, and a route to
  another post, without leaving the domain

### Requirement: The primary contact route stays on the domain

The hero's primary call to action SHALL be a direct contact address. Off-site profile links
MAY appear as secondary actions. The primary navigation SHALL include a route to contact.

#### Scenario: The strongest button is measured

- **WHEN** the hero's primary button is inspected
- **THEN** its target is a `mailto:` address on this domain's identity, not an external
  profile opened in a new tab

### Requirement: The evidence carries the systems base, not only applied AI

Selected work, the capability columns and the statistics strip SHALL together demonstrate
the cloud, DevOps and distributed-systems foundation as well as the applied-AI layer. At
least one selected-work entry SHALL be a non-AI-first systems engagement — event-driven
ingestion, real-time telemetry, time-series at volume, or mission-critical alerting.

#### Scenario: A reader forms an impression from evidence alone

- **WHEN** the prose positioning statements are ignored and only work entries, statistics
  and capability columns are read
- **THEN** the reader can identify both the systems foundation and the applied-AI layer

### Requirement: Experience data is available without leaving the site

The site SHALL render, in HTML, the experience data an employer looks for: current and
prior roles with dates, education, language levels, and a stack summary. It SHALL NOT
reintroduce a downloadable CV artefact; per-offer CVs remain the responsibility of the
`/generate-cv` pipeline outside this repository.

#### Scenario: An employer arrives from a search result

- **WHEN** the landing page is read without following any external link
- **THEN** employers, dates, education and language levels are all determinable

#### Scenario: A CV file is proposed

- **WHEN** a change adds a PDF or other downloadable résumé to `public/`
- **THEN** it is rejected; the archived removal decision stands

### Requirement: Published prose carries no platform residue

Content published on the site SHALL NOT contain artefacts of another platform's format —
hashtag blocks, engagement prompts asking for replies the page cannot accept, or calls to
action that only make sense inside a social feed.

#### Scenario: A post is adapted from a LinkedIn piece

- **WHEN** the post is published to the site
- **THEN** hashtag lines and comment prompts are removed, and the post ends on its own
  conclusion
