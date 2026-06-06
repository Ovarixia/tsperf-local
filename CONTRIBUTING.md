# Contributing

Thanks for considering a contribution to TSPerf Local.

This project is intentionally small. Changes should keep the extension local-first, privacy-preserving, and easy for maintainers to verify.

## Good First Contributions

- Improve the README with clearer examples or screenshots.
- Add Extension Host tests.
- Add TypeScript fixtures that demonstrate expensive type shapes.
- Improve the status bar, hover, or CodeLens experience.
- Document limits of the complexity score.

## Development Setup

```bash
npm install
npm test
```

To run the extension manually:

1. Open the repository in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Open `fixtures/sample.ts`.
4. Run `TSPerf: Inspect Type At Cursor`.

## Pull Request Expectations

- Keep changes focused.
- Include tests or a clear manual verification note.
- Do not add telemetry or external network calls.
- Do not upload source code or type information to third-party services.
- Update documentation when behavior changes.

## Commit Style

Use short imperative commit messages, for example:

```text
Add smoke test for type inspection
Document complexity score limits
```

## Reporting Issues

When reporting a bug, include:

- VS Code version.
- TypeScript version.
- Operating system.
- A minimal TypeScript snippet or fixture.
- The expected and actual TSPerf output.
