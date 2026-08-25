# build-integrity Specification

## ADDED Requirements

### Requirement: A clean clone builds the same site anywhere

The documented build command SHALL succeed on any machine with the declared Node version
and a fresh `npm ci`, with no reference to a path outside the repository. Every tool a build
step needs SHALL be a declared dependency.

#### Scenario: The repository is cloned onto a machine that has never built it

- **WHEN** `npm ci && npm run build` is run
- **THEN** the build completes and `dist/` contains every page, feed and generated image

#### Scenario: A build step needs a binary

- **WHEN** the step is added
- **THEN** the binary arrives as a declared dependency, not an absolute path

### Requirement: Generated artefacts are either committed or asserted

An artefact that is git-ignored SHALL be produced by a step that runs in every build
environment, and its presence SHALL be asserted before the pages that reference it are
emitted. A build SHALL NOT emit a page whose referenced generated asset is missing.

#### Scenario: A post ships without its social card

- **WHEN** the build reaches that post's page
- **THEN** it fails with an error naming the post and the expected file

### Requirement: Type checking runs and passes

The repository SHALL carry a TypeScript configuration that includes the framework's
generated types, so that content-collection entries type correctly. `astro check` SHALL be
a named script and SHALL report zero errors.

#### Scenario: A content query is written

- **WHEN** the result is used in a template
- **THEN** its fields type correctly rather than degrading to `never`

#### Scenario: The type checker reports an error

- **WHEN** the change is proposed
- **THEN** it is not merged until the error is resolved

### Requirement: Continuous integration gates every change

Pushes and pull requests SHALL run install, type check and build. The pipeline SHALL
additionally assert that every internal link in `dist/` resolves to an emitted file, that
every published post has a social card, and that the sitemap and `llms.txt` list the same
set of post URLs.

#### Scenario: A post slug is renamed

- **WHEN** a tag archive still links the old slug
- **THEN** the link check fails the pipeline

### Requirement: Specifications are version controlled

The specification tree SHALL be tracked in git. Ignore patterns SHALL be anchored so that
they cannot match a directory of the same name at another depth.

#### Scenario: The repository is cloned

- **WHEN** the working tree is inspected
- **THEN** the specifications this codebase is written against are present

### Requirement: Dependencies are declared, minimal and watched

Every declared dependency SHALL be used. Development-only tooling SHALL live in
`devDependencies`. The supported Node version SHALL be declared. An automated update
mechanism SHALL be configured.

#### Scenario: A dependency has no importer

- **WHEN** the repository is searched for its use
- **THEN** it is removed rather than upgraded

#### Scenario: A security advisory is published for a dependency

- **WHEN** it affects a declared package
- **THEN** an update is opened automatically rather than discovered by audit months later

### Requirement: Build scripts validate before they destroy

A generation step SHALL validate all of its inputs before deleting prior output or
launching an external process. Failures SHALL propagate as exceptions so that cleanup runs;
a step SHALL NOT terminate the process from inside a block that owns a resource.

#### Scenario: One post has invalid frontmatter

- **WHEN** the generation step runs
- **THEN** it fails before removing the existing output directory
- **AND** no external process is left running

### Requirement: Build tooling does not depend on source formatting

A build step SHALL NOT parse another source file by pattern-matching its formatting. Shared
values SHALL be imported, or generated into a data file that both sides read.

#### Scenario: A source file is reformatted

- **WHEN** the build runs
- **THEN** it succeeds unchanged

### Requirement: Repeated markup and values live in one place

Markup or styling duplicated between pages SHALL be extracted into a shared component or a
utility class. A string rendered on more than one surface SHALL be defined once and
imported.

#### Scenario: The same row markup appears on two pages

- **WHEN** the duplication is identified
- **THEN** a component is extracted and both pages consume it

#### Scenario: A page composes its own document title

- **WHEN** the title pattern is applied
- **THEN** it comes from the layout, not from each page's hand-written suffix
