# Security Automation

TSPerf Local uses layered dependency and packaging checks.

## CI Checks

- `npm audit --audit-level=moderate` runs in the main CI workflow.
- OSV-Scanner runs on pull requests, pushes to `main`, and a weekly schedule.
- VSIX packaging is verified in CI.
- The generated VSIX is installed into an isolated VS Code profile before artifact upload.

## Local Checks

```bash
npm audit --audit-level=moderate
osv-scanner scan source --lockfile=package-lock.json --format json
npm run test:install
```

Expected result:

- npm audit reports 0 moderate-or-higher vulnerabilities.
- OSV returns an empty `results` array.
- The VSIX installs as `ovarixia.tsperf-local@<version>` in the isolated profile.

## Privacy Checks

The export test verifies that JSON metrics omit:

- Source code.
- Fixture data.
- Absolute local paths.
- Full TypeScript type text.
