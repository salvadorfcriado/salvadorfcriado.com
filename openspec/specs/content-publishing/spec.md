# content-publishing Specification

## Purpose
Turning an approved package into a published post: ordinary site content indistinguishable
from hand-authored, delivery through a branch and a pull request, the deploy-before-handoff
ordering that LinkedIn's preview caching forces, and the copy-ready artifacts handed back
for manual posting.

## Requirements

### Requirement: The article is published as ordinary site content

The pipeline SHALL publish by writing a Markdown file into `src/content/blog/` that
satisfies the existing content collection schema, indistinguishable in form from one written
by hand. It SHALL NOT introduce a parallel content store, a generator-only frontmatter
field, or a rendering path that only pipeline-produced posts take.

Hand-authoring a post SHALL remain possible and SHALL remain fully supported.

#### Scenario: A pipeline post and a hand-written post

- **WHEN** the site is built with one pipeline-produced post and one hand-written post
- **THEN** both render through the same template
- **AND** neither can be distinguished by its frontmatter shape
- **AND** both receive a generated Open Graph card

#### Scenario: A post is edited by hand after generation

- **WHEN** the operator edits a generated article directly before merging
- **THEN** the build validates it exactly as it validates any other post
- **AND** the pipeline does not overwrite the edit on resume

### Requirement: Publication through a branch and a pull request

An approved package SHALL be delivered as a branch containing the article, and a pull
request against the default branch. The pull request body SHALL carry the social package —
the English post, the Spanish post, the hashtags, and the gate report — so the whole package
is reviewable in one place.

The pipeline SHALL NOT push to the default branch directly.

#### Scenario: The package is approved

- **WHEN** the operator approves the assembled package
- **THEN** a branch is created carrying the article file
- **AND** a pull request is opened whose body contains both post bodies, the hashtags and the gate report

#### Scenario: The operator rejects at the package point

- **WHEN** the operator rejects the package
- **THEN** no branch is pushed and no pull request is opened
- **AND** the state file records the rejection

### Requirement: Deploy before handoff

The pipeline SHALL NOT hand the LinkedIn text to the operator until the article's public URL
has been confirmed to respond successfully. The confirmation SHALL be an actual request
against the deployed URL, not an assumption that a merge implies a deployment.

This ordering exists because LinkedIn caches a URL's preview on first fetch; a preview
cached against a URL that does not yet exist cannot be cleanly corrected.

#### Scenario: The deployment has not completed

- **WHEN** the operator asks for the LinkedIn text and the article URL does not yet answer successfully
- **THEN** the pipeline withholds the text
- **AND** it reports the URL it probed and the response it received

#### Scenario: The deployment is live

- **WHEN** the article URL answers successfully
- **THEN** the pipeline emits the English post, the Spanish post, the hashtags and the article URL
- **AND** the state file records the handoff

### Requirement: Handoff artifacts are copy-ready

The pipeline SHALL emit each post as final text requiring no assembly by the operator:
hashtags already appended in their agreed position, the article URL already embedded, no
Markdown syntax, and no placeholder markers.

The pipeline SHALL NOT post to LinkedIn. Posting is a manual act by the operator.

#### Scenario: The operator copies the post

- **WHEN** the handoff text is pasted into LinkedIn unchanged
- **THEN** it is publishable as-is
- **AND** the link renders its preview from the article's own generated Open Graph card

#### Scenario: The pipeline is asked to publish to LinkedIn

- **WHEN** any stage would post to LinkedIn on the operator's behalf
- **THEN** no such stage exists
- **AND** the pipeline ends at handoff

### Requirement: Nothing reaches a pull request without passing gates

The publish stage SHALL verify, immediately before creating the branch, that the recorded
gate report for every publishable artifact is passing and that every required approval is
recorded in the state file. If either condition fails, the publish stage SHALL abort.

#### Scenario: A stale failing report

- **WHEN** the state file's most recent gate report for the Spanish post records a failure
- **THEN** the publish stage aborts naming that report
- **AND** no branch is created

#### Scenario: An approval is missing

- **WHEN** the package approval is not recorded in the state file
- **THEN** the publish stage aborts
- **AND** no branch is created

### Requirement: Run state stays out of the repository

Version control SHALL exclude per-run state, environment files, and any generated artefact
that is not part of the published site. Prompts, gates, tests, goldens and configuration
SHALL be committed.

#### Scenario: A run completes

- **WHEN** a run has finished and the working tree is inspected
- **THEN** the state directory and the environment file are ignored by version control
- **AND** the article file staged for the pull request is the only new tracked content
