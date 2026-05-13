# Changelog

All notable changes to the Aegis governance specification are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The spec defines the canonical contract that all Aegis implementations (CLI, MCP, third-party tooling) must honor. Changes here ripple downstream — every implementation has to track this changelog.

## [Unreleased]

## [0.3.0] — 2026-05-13

The floor-only sweep release. The v0.2.0 design said "schemas require a skeleton, permit extensions" — this release makes that real across every schema.

### Added
- **`overrides.schema.json`** — a standalone schema for the per-line override-log shape (`.agentpolicy/state/overrides.jsonl`). Previously this format was implicit in implementation; now it's part of the spec.

### Changed
- **Floor-only sweep across all schemas.** Every `maxLength` ceiling that constrained how much detail an implementation could attach to a skeleton field has been dropped. The skeleton is required; the content within it is not artificially capped.
  - `constitution.schema.json` — ceilings removed across required-skeleton fields
  - `governance.schema.json` — ceilings removed, convention IDs now accept hyphens (e.g. `policy-is-authoritative` rather than only `policy_is_authoritative`)
  - `role.schema.json` — `role.purpose` `maxLength` ceiling removed
  - `ledger.schema.json` — `maxLength` ceilings on task and lock fields removed
- **`session.schema.json`** — now permits extension fields on individual messages and at the root, so implementations can carry their own per-session metadata without violating the spec.
- **Prose tightened** — implementation-specific terms removed from `session.schema.json` prose, keeping the spec language vendor-neutral.

### Migration notes
Implementations that were validating against v0.2.0's ceilings will accept more content under v0.3.0 — no breaking changes for content already valid under v0.2.0. Implementations that wrote against the implicit override-log shape should now validate against the standalone `overrides.schema.json`.

## [0.2.0] — 2026-05-10

The split release. Aegis-spec became a standalone governance specification repository, separate from the CLI implementation. This is the foundation the rest of the Aegis ecosystem is built on.

### Added
- **Standalone repository.** The governance specification was split out of the integrated CLI+spec repository (`6075cfd`) so the spec can be versioned independently, audited by third parties, and implemented by tooling beyond the reference CLI.
- **Override protocol in `governance.schema.json`** — formalized how implementations should handle policy violations (warn-confirm-and-log default, with structured logging requirements).
- **`required_artifacts` in `constitution.schema.json`** — projects can declare files that must exist (README, LICENSE, CONTRIBUTING, etc.) so implementations can validate baseline project hygiene.

### Changed
- **Floor-not-ceiling design introduced.** Schemas now declare a required skeleton and permit additional fields beyond it. This replaces the earlier "strict schema, no extensions" stance and makes the spec extensible by implementations without violating compatibility.

## [0.1.x] — 2026-03 through 2026-04

Early integrated phase, before the spec/CLI split. The Aegis schema, an example policy directory, and the reference CLI lived in a single repository as the design was being shaped. Versions in this range (v0.1.0 through v0.1.8) covered the initial schema authoring, project-specific governance domains, the deep repo scan behavior, the visual identity pass, and the floor-not-ceiling design direction that became v0.2.0. No tags from this phase are preserved as releases — `v0.2.0` is the first formally tagged release of the standalone spec.

[Unreleased]: https://github.com/cleburn/aegis-spec/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/cleburn/aegis-spec/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cleburn/aegis-spec/releases/tag/v0.2.0
