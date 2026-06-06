# Security Review - 2026-06-06

## Executive Summary

No critical, high, or moderate security issue was found during this review.

The project is a local VS Code extension with no runtime network calls, no telemetry, no production dependencies, and a small VSIX package. Two privacy hardening changes were applied during the review:

- avoid displaying absolute local file paths in extension output;
- prefer VS Code's bundled TypeScript before workspace-local TypeScript.

## Scope

Reviewed files:

- `src/extension.js`
- `package.json`
- `package-lock.json`
- `.vscodeignore`
- packaged VSIX contents
- security and project documentation

Out of scope:

- VS Code Marketplace publication review;
- third-party audit of VS Code itself;
- sandboxing TypeScript compiler internals;
- manual dynamic testing in VS Code Extension Host.

## Checks Performed

### Dependency Vulnerabilities

Commands:

```bash
npm audit --audit-level=moderate
osv-scanner scan source --lockfile=package-lock.json --format json
```

Results:

- `npm audit`: 0 vulnerabilities.
- OSV Scanner: no vulnerability results.

### Runtime Network Surface

Searched for runtime network APIs and process execution APIs.

Result:

- No `fetch`, `XMLHttpRequest`, `http`, `https`, `net`, `WebSocket`, `child_process`, `exec`, `spawn`, `eval`, or dynamic `Function` usage in `src/extension.js`.

### Secret Exposure

Searched for common secret patterns outside `node_modules`, `package-lock.json`, and generated VSIX artifacts.

Result:

- No secret found.
- The only match was the word `secrets` in `SECURITY.md`, as expected.

### VSIX Packaging

Command:

```bash
npm run package
unzip -l tsperf-local-0.1.0.vsix
```

Result:

- VSIX contains 9 files.
- No `node_modules`.
- No tests, docs directory, GitHub templates, lockfile, or local fixture files are packaged.

Included files:

- `extension.vsixmanifest`
- `[Content_Types].xml`
- `extension/package.json`
- `extension/SECURITY.md`
- `extension/readme.md`
- `extension/LICENSE.txt`
- `extension/changelog.md`
- `extension/.gitignore`
- `extension/src/extension.js`

## Code Review Notes

### No Runtime Network or Telemetry

`src/extension.js` only uses local Node modules, the VS Code API, and TypeScript compiler APIs. It does not send type text, diagnostics, paths, or source code to an external endpoint.

### Local File Reads Are Expected

The extension reads TypeScript source files through the TypeScript language service host. This is expected for a TypeScript inspection extension.

Relevant code:

- `src/extension.js`: `inspectTypeAtPosition`
- `src/extension.js`: `createLanguageServiceHost`

### Privacy Hardening Applied

The output panel now uses `formatDocumentPath` instead of writing `editor.document.uri.fsPath` directly. This avoids exposing absolute local file paths in normal output.

Relevant code:

- `src/extension.js`: output path formatting
- `src/extension.js`: `formatDocumentPath`

### Workspace TypeScript Loading Hardened

The resolver now prefers VS Code's bundled TypeScript before falling back to workspace-local TypeScript. This reduces the chance of loading unexpected workspace dependency code when the bundled TypeScript extension is available.

Relevant code:

- `src/extension.js`: `resolveTypeScript`

## Residual Risks

### R-001: Type Text May Contain Sensitive Domain Names

Severity: Low

TSPerf Local displays the inspected type text in the local output panel. This is the purpose of the extension, but users should avoid sharing screenshots or copied output from private codebases without review.

Status: accepted and documented.

### R-002: Workspace TypeScript Fallback Remains

Severity: Low

If VS Code's bundled TypeScript extension is unavailable, TSPerf Local can fall back to a workspace-local TypeScript package. This keeps the tool functional, but workspace dependencies are not sandboxed by this extension.

Status: reduced by preferring bundled TypeScript first; documented in `SECURITY.md`.

## Verification

Commands passed after hardening:

```bash
npm test
npm run package
npm audit --audit-level=moderate
osv-scanner scan source --lockfile=package-lock.json --format json
```

## Conclusion

The project is in a good security posture for an early-stage local VS Code extension. No known dependency vulnerability or obvious secret/runtime exfiltration path was found. The main remaining risks are privacy hygiene around local output sharing and the standard trust model of VS Code extensions operating inside a user's workspace.
