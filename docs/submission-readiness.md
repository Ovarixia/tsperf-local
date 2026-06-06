# TSPerf Submission Readiness

## Current State

- Local extension scaffold exists.
- Core command exists: `TSPerf: Inspect Type At Cursor`.
- Local smoke test exists: `npm test`.
- No external calls.
- No telemetry.
- Packaged VSIX release exists for `v0.1.0`.

## Evidence To Collect Before Any External Submission

- Screenshot of the status bar on `fixtures/sample.ts`.
- Output panel showing elapsed time and complexity metrics.
- Extension Host smoke test for command registration and UI behavior.
- MIT license confirmation.
- Short demo video if the challenge expects one.

## External Actions Requiring Explicit Approval

- Publishing to VS Code Marketplace.
- Submitting the challenge form.
- Posting any public comment.

## Risk Notes

- The metric is an approximation, not TypeScript internal compiler cost.
- The extension must be compared against existing TSPerf submissions before public release.
- Challenge eligibility may depend on being first successful solution, so external submission should only happen when the demo is polished.
