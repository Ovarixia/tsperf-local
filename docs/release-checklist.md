# Release Checklist

Use this checklist before tagging and publishing a TSPerf Local VSIX release.

## 1. Version And Changelog

- Update `package.json` and `package-lock.json`.
- Move relevant `CHANGELOG.md` entries under the release version.
- Confirm the README install command points to the new tag and VSIX file.

## 2. Local Verification

```bash
npm test
npm run test:vscode
npm audit --audit-level=moderate
osv-scanner scan source --lockfile=package-lock.json --format json
npm run package
npm run test:install
```

Expected result:

- Node smoke tests pass.
- Export JSON tests pass.
- Fixture regression thresholds pass.
- VS Code Extension Host tests pass.
- npm audit reports 0 moderate-or-higher vulnerabilities.
- OSV-Scanner reports no known vulnerable dependencies.
- VSIX packaging succeeds.
- VSIX installation succeeds in an isolated profile.

## 3. Demo And Documentation

```bash
npm run demo:preview
```

- Regenerate the README demo only when the visible demo changed.
- Keep generated frame files out of git.
- Update README and docs when command behavior changes.

## 4. VSIX Installation Check

Install the generated VSIX into an isolated VS Code profile and verify:

- `TSPerf: Inspect Type At Cursor` runs on `fixtures/sample.ts`.
- `TSPerf: Export Last Inspection As JSON` writes a local JSON file.
- The exported JSON contains metrics but no source code or absolute paths.
- The CodeLens summary appears after inspection.

## 5. Security And Privacy

- Confirm there are no new network calls in runtime code.
- Confirm exports omit source code and absolute local paths.
- Run dependency vulnerability checks.
- Review VSIX contents before attaching it to a release.

## 6. Publish

```bash
git tag vX.Y.Z
git push origin main vX.Y.Z
gh release create vX.Y.Z tsperf-local-X.Y.Z.vsix --title "TSPerf Local X.Y.Z" --notes-file RELEASE_NOTES.md
```

Remove temporary release note files after publishing.
