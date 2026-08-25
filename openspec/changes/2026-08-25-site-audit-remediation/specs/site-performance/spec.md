# site-performance Specification

## ADDED Requirements

### Requirement: No byte is shipped that no page requests

Font subsets, weights and other build outputs SHALL be emitted only where a rendered page
uses them. A weight requested from a font provider that serves static instances SHALL be
justified by more than one rule, or dropped.

#### Scenario: A font subset is never fetched

- **WHEN** every page is loaded and the network log is read
- **THEN** any subset with zero requests is removed from the build, and its `@font-face`
  declarations disappear from the render-blocking CSS

#### Scenario: A new font weight is proposed

- **WHEN** the family is served as static instances rather than as a variable font
- **THEN** the added file size is stated in the change, and the weight is justified against
  the rules that use it

### Requirement: Fonts are discovered in the first round trip

The critical fonts for the initial viewport SHALL be preloaded with `crossorigin`, rather
than discovered after the stylesheet parses. Every face SHALL declare `font-display: swap`.

#### Scenario: A page is loaded on a throttled connection

- **WHEN** the request waterfall is read
- **THEN** the critical font requests begin alongside the stylesheet, not after it

### Requirement: Page CSS does not add a blocking request

Page-scoped CSS SHALL be inlined rather than split into an additional render-blocking
stylesheet, so that no page pays more blocking round trips than any other.

#### Scenario: One page's scoped CSS exceeds the inline threshold

- **WHEN** its blocking stylesheet count is compared with the other pages'
- **THEN** they are equal

### Requirement: Layout does not shift after first paint

Cumulative Layout Shift SHALL stay below 0.05 on every page after a full scroll. Where the
only source of shift is font swap, the swap window SHALL be shortened by preloading and,
where it remains measurable, closed with a metric-matched fallback face.

#### Scenario: A page is measured after a full scroll

- **WHEN** the shift entries are collected
- **THEN** the total is below the budget and every entry is attributable

### Requirement: Static assets are cached according to their naming

Content-hashed assets SHALL be served `immutable` with a one-year lifetime. Assets served
under stable names SHALL carry a finite lifetime that does not require revalidation on
every navigation. The largest-contentful resource of any page SHALL be covered by a cache
rule.

#### Scenario: A visitor navigates between two pages

- **WHEN** the second navigation's requests are read
- **THEN** the largest-contentful image is not revalidated

### Requirement: Response headers state the site's security posture

Responses SHALL carry `X-Content-Type-Options`, `Referrer-Policy`, and a Content Security
Policy consistent with a site that ships no executable JavaScript and contacts no
third-party origin. A policy change SHALL be verified on a preview deployment before
promotion.

#### Scenario: A CSP is introduced

- **WHEN** the preview deployment is loaded
- **THEN** no page reports a policy violation, and inline `<style>` and
  `application/ld+json` blocks still render

### Requirement: Generated images are optimised

Images produced by build scripts SHALL be run through lossless or near-lossless
optimisation before they ship.

#### Scenario: A social card is generated

- **WHEN** its file size is compared against an optimised encode of the same image
- **THEN** the shipped file is the optimised one
