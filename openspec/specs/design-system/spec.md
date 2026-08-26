# design-system Specification

## Purpose
TBD - created by archiving change 2026-08-25-site-audit-remediation. Update Purpose after archive.
## Requirements
### Requirement: Line length stays within measure at every viewport

Body copy SHALL render between 45 and 85 characters per line at every viewport from 320px
to 2560px. Layouts SHALL NOT collapse from three or two columns directly to one across a
band wide enough to exceed measure; an intermediate two-column step SHALL exist. Paragraph
classes SHALL additionally carry a `ch`-based maximum so that a single-column case at a
wide viewport still holds measure.

#### Scenario: A three-column grid narrows

- **WHEN** the viewport passes between 620px and 960px
- **THEN** the grid renders two columns, not one

#### Scenario: A paragraph occupies a full-width container

- **WHEN** the container is wider than the paragraph's measure allows
- **THEN** the paragraph is capped by its own `max-width`, not by the container

### Requirement: One alignment spine

All page furniture — top bar, statistics strip, footer — SHALL align to the same left and
right edges as section content at every viewport, and SHALL share one content column width.
Horizontal section padding SHALL be applied at one consistent level of the box hierarchy.

#### Scenario: The viewport exceeds the content max-width

- **WHEN** left edges of the brand, the statistics strip, the footer and a section heading
  are measured
- **THEN** all four are identical

### Requirement: Decorative elements degrade out, not up

An element that exists only as decoration SHALL be hidden at viewports where it would
render as a large empty region, and SHALL NOT be mistakable for a failed image load or an
unrendered component.

#### Scenario: A decorative panel stacks below its sibling

- **WHEN** the layout collapses to a single column
- **THEN** the panel is not rendered

#### Scenario: Ghosted text duplicates visible text

- **WHEN** a decorative title repeats a title rendered nearby
- **THEN** either the duplicate is removed or it is rendered at a legible weight

### Requirement: Raster images are never upscaled

An image SHALL be served at a source resolution at least as large as its largest rendered
box, accounting for device pixel ratio, and its `width` and `height` attributes SHALL match
the file's intrinsic aspect ratio. Where the rendered size varies across breakpoints, a
`srcset` and `sizes` SHALL be provided.

#### Scenario: A portrait renders larger on tablet than on desktop

- **WHEN** the rendered box is measured at every breakpoint
- **THEN** no rendered width exceeds the source width
- **AND** the declared attributes describe the file, not one arbitrary breakpoint

### Requirement: Touch targets are reachable

At viewports below 760px, every interactive element SHALL present a hit area of at least
44 × 44 CSS pixels.

#### Scenario: A navigation link is measured on a phone

- **WHEN** its bounding box is read at 375px
- **THEN** both dimensions are at least 44px

### Requirement: The type and spacing scales are closed

Font sizes, spacing values and tracking values SHALL come from tokens defined in
`src/styles/global.css`. No two steps in the type scale SHALL sit within 1px of each other.
A value used in more than one file SHALL be a token. Tokens with no references SHALL be
removed.

#### Scenario: A page needs a size the scale does not have

- **WHEN** the size is required in more than one place
- **THEN** a token is added to the scale rather than a literal to the page

#### Scenario: The scale is audited

- **WHEN** all computed font sizes on a page are collected
- **THEN** no cluster of near-identical values remains

### Requirement: Vertical rhythm responds to viewport

Section padding SHALL scale down at small viewports rather than holding its desktop value.

#### Scenario: Section padding is measured at 375px and 2560px

- **WHEN** both are read
- **THEN** the small-viewport value is smaller

### Requirement: The site declares its colour scheme and prints legibly

Every page SHALL declare its colour scheme so that user-agent chrome matches. Every page
SHALL carry a print stylesheet that suppresses navigation, footers, calls to action and
background artwork, and that exposes link targets within prose.

#### Scenario: The operating system is set to dark

- **WHEN** a page is loaded
- **THEN** form controls, scrollbars and the canvas match the site's declared scheme

#### Scenario: A post is printed

- **WHEN** the print preview is inspected
- **THEN** the top bar, the footer navigation and the grid backgrounds are absent
- **AND** prose link targets are visible
