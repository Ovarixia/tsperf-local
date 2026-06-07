# VS Code Marketplace Publishing

TSPerf Local is prepared for Marketplace publishing, but publishing requires a maintainer-held VSCE Personal Access Token. Do not commit tokens, generated auth files, or `.env` files.

## Prerequisites

- Publisher: `ovarixia`.
- Marketplace token available only in the local shell as `VSCE_PAT`.
- Release checklist completed.
- Latest GitHub release created with the same version.

## Dry Verification

```bash
npm run icon:generate
npm test
npm run test:vscode
npm audit --audit-level=moderate
osv-scanner scan source --lockfile=package-lock.json --format json
npm run package
npm run test:install
```

Review the generated VSIX contents from `npm run package` before publishing.

## Publish

```bash
VSCE_PAT=... npx vsce publish --packagePath tsperf-local-X.Y.Z.vsix
```

Security rules:

- Never write `VSCE_PAT` to a tracked file.
- Prefer a short-lived token scoped only for Marketplace publishing.
- Revoke and rotate the token after use if it was shared across machines.
- Keep GitHub release publishing and Marketplace publishing as separate, auditable steps.
