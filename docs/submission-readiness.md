# TSPerf Submission Readiness

## Current State

- Local extension scaffold exists.
- Core command exists: `TSPerf: Inspect Type At Cursor`.
- Local smoke test exists: `npm test`.
- No external calls.
- No telemetry.
- Packaged VSIX release exists for `v0.1.1`.
- README demo GIF exists and is generated from `fixtures/complex-api-model.ts`.
- CI workflow checks tests, dependency audit, and VSIX packaging on push and pull request.
- Dependabot is configured for npm and GitHub Actions maintenance updates.
- Maintainer workflow documentation explains how the project supports pull request review.

## Evidence To Collect Before Any External Submission

- Screenshot or GIF of the status bar and output panel on `fixtures/complex-api-model.ts`.
- Extension Host smoke test for command registration and UI behavior.
- MIT license confirmation.
- Short demo video if the challenge requires video instead of a GIF.

## External Actions Requiring Explicit Approval

- Publishing to VS Code Marketplace.
- Submitting the challenge form.
- Posting any public comment.

## Risk Notes

- The metric is an approximation, not TypeScript internal compiler cost.
- The extension must be compared against existing TSPerf submissions before public release.
- Challenge eligibility may depend on being first successful solution, so external submission should only happen when the demo is polished.
