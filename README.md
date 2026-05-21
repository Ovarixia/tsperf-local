# TSPerf Local

Local-only VS Code extension prototype for the Algora TSPerf challenge.

It inspects the TypeScript type under the cursor and reports:

- type load time in milliseconds
- an approximate complexity score
- type text length
- union and intersection member counts
- property and signature counts
- traversed type graph size and depth

## Privacy

This extension does not call external services, does not include telemetry, and does not upload code. It analyzes the active file locally through the TypeScript compiler API available in the workspace or VS Code's bundled TypeScript extension.

## Local Usage

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Open a TypeScript file.
4. Run `TSPerf: Inspect Type At Cursor`.
5. Read the status bar and the `TSPerf Local` output panel.

## Challenge Fit

The challenge asks for a VS Code plugin that shows the complexity / time to load of a type in TypeScript. This prototype covers that core loop locally:

- find the node under the cursor
- call `checker.getTypeAtLocation`
- measure elapsed time
- compute complexity metrics from the resulting type graph
- show the result inside VS Code

## What Still Needs Work Before Submission

- Add an inline hover or CodeLens view.
- Package a demo GIF or screenshots.
- Add an automated Extension Host test.
- Open-source as a clean MIT repository only after explicit approval.
- Submit to the challenge only after explicit approval.
