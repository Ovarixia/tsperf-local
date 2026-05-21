# TSPerf Submission Readiness

## Current State

- Local extension scaffold exists.
- Core command exists: `TSPerf: Inspect Type At Cursor`.
- No external calls.
- No telemetry.
- No package publishing.

## Evidence To Collect Before Any External Submission

- Screenshot of the status bar on `fixtures/sample.ts`.
- Output panel showing elapsed time and complexity metrics.
- Extension Host smoke test.
- MIT license confirmation.
- Short demo video if the challenge expects one.

## External Actions Requiring Explicit Approval

- Creating a GitHub repository.
- Pushing commits.
- Publishing to VS Code Marketplace.
- Submitting the challenge form.
- Posting any public comment.

## Risk Notes

- The metric is an approximation, not TypeScript internal compiler cost.
- The extension must be compared against existing TSPerf submissions before public release.
- Challenge eligibility may depend on being first successful solution, so external submission should only happen when the demo is polished.
