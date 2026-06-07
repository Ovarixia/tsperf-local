# Maintainer Workflow

TSPerf Local is designed for quick local checks during TypeScript library and application maintenance. It helps decide when a type deserves deeper profiling before a change is merged.

## Pull Request Review

Use TSPerf Local when a pull request introduces or changes:

- Public generic utility types.
- Large union or intersection types.
- Inferred API response shapes.
- Recursive mapped types.
- Types exported from a package entry point.

Suggested review loop:

1. Open the changed TypeScript file in VS Code.
2. Put the cursor on the exported type, inferred value, or suspicious expression.
3. Run `TSPerf: Inspect Type At Cursor`.
4. Compare the score and graph size with nearby simpler types.
5. Ask for simplification, documentation, or benchmark evidence if the inspected type is unexpectedly large.

## Release Checks

Before a release, maintainers can inspect representative fixtures or public API files and keep a short note in the release checklist:

```text
TSPerf Local:
- inspected public API response types
- no unexpected large type graph found
- no source code uploaded or shared externally
```

## When To Escalate

Use TypeScript compiler diagnostics, traces, or benchmark suites when:

- Editor feedback is slow across the workspace.
- `tsc --noEmit` regresses noticeably.
- A public API type has a high TSPerf score and is used widely.
- A type looks small in source code but expands into a large inferred graph.

TSPerf Local is a triage tool. It should make maintainers faster at finding suspicious types, not replace deeper performance evidence.
