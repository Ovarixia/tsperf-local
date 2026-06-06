# TSPerf Local

TSPerf Local is a privacy-preserving VS Code extension that inspects the TypeScript type under the cursor and reports how expensive it looks to load and traverse.

It is designed for library authors, framework maintainers, and teams that want quick local feedback on complex TypeScript types without uploading source code to an external service.

## What It Shows

- Type load time in milliseconds.
- Approximate complexity score.
- Type text length.
- Union and intersection member counts.
- Property and call/construct signature counts.
- Traversed type graph size and depth.

## Why It Exists

TypeScript performance issues often hide inside deeply nested generic types, broad unions, and large inferred object graphs. TSPerf Local gives maintainers a small local loop:

1. Put the cursor on a TypeScript expression, identifier, or type node.
2. Run `TSPerf: Inspect Type At Cursor`.
3. Read the timing and complexity metrics in the status bar and output panel.

The score is intentionally approximate. It is not a replacement for `tsc --extendedDiagnostics`, compiler traces, or benchmark suites. It is a quick inspection tool that helps decide where deeper profiling is worth doing.

## Privacy Model

TSPerf Local does not call external services, does not include telemetry, and does not upload code. It analyzes the active file through the TypeScript compiler API. At runtime it prefers VS Code's bundled TypeScript extension before falling back to workspace-local TypeScript.

## Install

Install the packaged prototype from the GitHub release:

```bash
code --install-extension tsperf-local-0.1.0.vsix
```

Release: https://github.com/Ovarixia/tsperf-local/releases/tag/v0.1.0

## Run From Source

```bash
npm install
npm test
```

Then:

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Open `fixtures/sample.ts` or another TypeScript file.
4. Run `TSPerf: Inspect Type At Cursor`.
5. Read the status bar and the `TSPerf Local` output panel.

## Commands

- `TSPerf: Inspect Type At Cursor` measures the current TypeScript type once.
- `TSPerf: Toggle Auto Inspect` updates the status bar as the cursor moves.

## Settings

- `tsperf.autoInspect`: automatically inspect the active TypeScript cursor position.
- `tsperf.maxDepth`: maximum type graph traversal depth used for complexity scoring.

## Local Verification

```bash
npm test
```

The smoke test exercises the core analyzer against `fixtures/sample.ts` using the local TypeScript package. It does not launch VS Code and does not make network calls.

## Project Status

This is an early-stage open-source maintainer tool. The core command works, but the UI and test coverage are intentionally small.

See:

- [Roadmap](docs/roadmap.md)
- [Local verification notes](docs/local-verification.md)
- [Submission readiness](docs/submission-readiness.md)

## Contributing

Contributions are welcome if they keep the project local-first, privacy-preserving, and easy to verify. Start with [CONTRIBUTING.md](CONTRIBUTING.md).
