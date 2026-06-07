# Changelog

## Unreleased

## 0.1.3 - 2026-06-07

- Added a CodeLens summary for the latest inspected type.
- Added Extension Host coverage for command registration, inspection, and CodeLens output.
- Added a release checklist for VSIX publishing.
- Added OSV-Scanner workflow and security automation documentation.
- Added Marketplace publishing preparation and an extension icon.

## 0.1.2 - 2026-06-07

- Added local JSON export support for the latest inspection metrics.
- Added tests that verify exported metrics omit source code and absolute paths.
- Added GitHub Actions CI for tests, audit, and VSIX packaging.
- Added Dependabot maintenance checks for npm and GitHub Actions.
- Added documentation for the complexity score model and its limits.
- Added maintainer workflow documentation for pull request review.
- Added a README demo GIF generated from a complex TypeScript fixture.
- Added a reproducible demo preview script and fixture.

## 0.1.1 - 2026-06-06

- Expanded README with privacy model, commands, settings, and verification notes.
- Added contributing and security documentation.
- Added roadmap and GitHub issue templates.
- Added a local smoke test for the core type inspection function.
- Added a public security review.
- Hardened runtime privacy by avoiding absolute path output.
- Prefer VS Code's bundled TypeScript before workspace-local TypeScript.

## 0.1.0 - 2026-05-21

- Initial VS Code extension prototype.
- Added `TSPerf: Inspect Type At Cursor`.
- Added status bar and output panel reporting.
- Published packaged VSIX as a GitHub release.
