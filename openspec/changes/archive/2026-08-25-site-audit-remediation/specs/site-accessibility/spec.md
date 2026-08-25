# site-accessibility Specification

## ADDED Requirements

### Requirement: All text meets WCAG AA contrast

Every text node rendered on the site SHALL meet a contrast ratio of at least 4.5:1 against
its effective background, or 3:1 where the text is large (≥ 24px, or ≥ 18.66px bold).
Effective background means the colour actually painted, including any inline style written
by a build-time tool, and effective colour includes any `opacity` applied to the element or
an ancestor.

Text that is purely decorative and marked `aria-hidden` is exempt from the success
criterion but SHALL NOT be rendered at a ratio that makes it read as a failed render.

#### Scenario: A syntax highlighter writes an inline background

- **WHEN** a Markdown code fence is rendered
- **THEN** the highlighter's theme and the author's text colour agree on light or dark
- **AND** the resulting code text measures at least 4.5:1

#### Scenario: A colour is applied through opacity

- **WHEN** an element's colour is produced by a token plus an `opacity` value
- **THEN** the ratio is computed against the composited result, not the token

### Requirement: Every interactive element has a visible focus indicator

The site SHALL define its own `:focus-visible` treatment rather than relying on the user
agent default. The indicator SHALL measure at least 3:1 against both the element and the
adjacent background. Every rule that changes appearance on `:hover` SHALL apply the same
change on `:focus-visible`.

#### Scenario: A keyboard user tabs through a page

- **WHEN** focus reaches any link, button or chip
- **THEN** an author-defined indicator is visible and meets 3:1

#### Scenario: A hover affordance is added

- **WHEN** a new `:hover` rule is introduced
- **THEN** it is written as `:hover, :focus-visible` or the change is rejected

### Requirement: Keyboard users can skip repeated navigation

Every page SHALL offer a skip link as the first focusable element, targeting the main
landmark. The main landmark SHALL carry a matching `id`.

#### Scenario: The first Tab press on a page

- **WHEN** focus enters the document
- **THEN** the first stop is a visible skip link that moves focus into `<main>`

### Requirement: Landmarks are complete and labelled

Each page SHALL expose a `banner`, a `main`, a `contentinfo` and correctly labelled
navigation landmarks. Where more than one navigation landmark exists, each SHALL carry a
distinguishing `aria-label`. Content that is not navigation SHALL NOT sit inside a
navigation landmark.

#### Scenario: A page exposes two navigations

- **WHEN** the landmark tree is enumerated
- **THEN** no landmark is announced as an unnamed "navigation"

### Requirement: Semantics survive visual restyling

A list whose markers are removed with `list-style: none` SHALL carry `role="list"` so that
list semantics are preserved in user agents that drop the implicit role.

#### Scenario: A chip row is rendered as a flex list

- **WHEN** the row is read by a screen reader
- **THEN** it is announced as a list with its item count

### Requirement: Accessible names are the names, and nothing more

Heading text SHALL contain only the heading, with ordinals, brackets and other decorative
prefixes marked `aria-hidden` or generated from CSS. A link SHALL NOT take an excerpt or a
metadata line into its accessible name. A line break inside a heading SHALL NOT join two
words in the computed name.

#### Scenario: A links list is opened

- **WHEN** the page's links are listed by an assistive technology
- **THEN** each entry reads as a title, not a paragraph

#### Scenario: A heading list is opened

- **WHEN** headings are listed
- **THEN** none is announced with a spoken ordinal prefix

### Requirement: Heading levels nest

Each page SHALL contain exactly one `<h1>` and SHALL NOT skip levels. Cards or items that
belong to a section SHALL use a level below that section's heading.

#### Scenario: A section and its cards use the same level

- **WHEN** the heading sequence is measured
- **THEN** the cards are demoted so they nest under their section

### Requirement: New-tab links announce themselves

A link that sets `target="_blank"` SHALL convey that fact to assistive technology, and
SHALL carry `rel="noopener"` (plus `noreferrer` where no `me` relationship is asserted).

#### Scenario: An external profile link receives focus

- **WHEN** its accessible name is computed
- **THEN** it includes an indication that the link opens in a new tab
