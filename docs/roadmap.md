# Roadmap

TSPerf Local is a small local-first tool. The roadmap focuses on making the existing inspection loop more useful before adding broader automation.

## Near Term

- Add Extension Host coverage for the command registration and status bar flow.
- Add more fixtures for unions, intersections, recursive types, and generic-heavy libraries.
- Show inline hover or CodeLens output near inspected types.
- Add threshold-based fixture tests for representative type shapes.
- Add comparison support for multiple inspected positions in one file.

## Later

- Compare measurements across multiple cursor positions in one file.
- Add optional local-only thresholds for CI experiments.
- Explore integration with TypeScript trace files.

## Principles

- Keep runtime analysis local.
- Avoid telemetry.
- Prefer transparent metrics over opaque scoring.
- Keep the extension useful even when a project cannot share its source code.
