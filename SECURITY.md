# Security Policy

## Supported Versions

TSPerf Local is early-stage. Security fixes target the latest commit on `main` and the latest GitHub release when practical.

## Reporting a Vulnerability

Please open a GitHub security advisory or a private report if the issue exposes sensitive information. If private reporting is unavailable, open a minimal public issue without including secrets, proprietary code, or private workspace data.

Useful details:

- VS Code version.
- TypeScript version.
- Operating system.
- Steps to reproduce.
- Whether the issue involves local file access, package installation, or extension packaging.

## Security Goals

- No telemetry.
- No external network calls from the extension runtime.
- No upload of source code, type text, diagnostics, or workspace paths.
- Local analysis through the TypeScript compiler API only.
- Prefer VS Code's bundled TypeScript before workspace-local TypeScript.
- Avoid displaying absolute local file paths in extension output.

## Non-Goals

TSPerf Local does not sandbox TypeScript itself. It relies on VS Code and the workspace's TypeScript installation in the same way other TypeScript tooling does.
