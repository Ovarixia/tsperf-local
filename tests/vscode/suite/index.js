"use strict";

const assert = require("assert");
const path = require("path");
const vscode = require("vscode");

async function activateExtension() {
  const extension = vscode.extensions.getExtension("ovarixia.tsperf-local");
  assert.ok(extension, "Expected TSPerf Local extension to be available in Extension Host.");
  await extension.activate();
  return extension;
}

async function openFixtureAtNeedle(relativePath, needle, needleOffset = 0) {
  const root = process.env.TSPERF_REPO_ROOT;
  assert.ok(root, "Expected TSPERF_REPO_ROOT to be set.");
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(root, relativePath)));
  const editor = await vscode.window.showTextDocument(document);
  const offset = document.getText().indexOf(needle);
  assert.notStrictEqual(offset, -1, `Could not find ${needle} in ${relativePath}.`);
  const position = document.positionAt(offset + needleOffset);
  editor.selection = new vscode.Selection(position, position);
  editor.revealRange(new vscode.Range(position, position));
  return { document, editor, position };
}

async function commandExists(commandId) {
  const commands = await vscode.commands.getCommands(true);
  return commands.includes(commandId);
}

module.exports.run = async function run() {
  await activateExtension();

  assert.ok(await commandExists("tsperf.inspectType"), "Expected inspect command to be registered.");
  assert.ok(await commandExists("tsperf.exportLastInspection"), "Expected export command to be registered.");
  assert.ok(await commandExists("tsperf.toggleAutoInspect"), "Expected auto-inspect command to be registered.");

  const config = vscode.workspace.getConfiguration("tsperf");
  assert.strictEqual(config.get("maxDepth"), 6, "Expected default maxDepth setting.");
  assert.strictEqual(config.get("autoInspect"), false, "Expected autoInspect to be disabled by default.");

  const needle = "invoice.customer.address.city";
  const { document, editor, position } = await openFixtureAtNeedle("fixtures/sample.ts", needle, needle.lastIndexOf("city"));
  assert.strictEqual(document.languageId, "typescript", "Expected fixture to open as TypeScript.");
  assert.strictEqual(editor.selection.active.line, position.line, "Expected cursor line to match fixture target.");

  await vscode.commands.executeCommand("tsperf.inspectType");

  const codeLenses = await vscode.commands.executeCommand("vscode.executeCodeLensProvider", document.uri);
  assert.ok(Array.isArray(codeLenses), "Expected VS Code to return CodeLens results.");
  assert.ok(
    codeLenses.some((codeLens) => codeLens.command && codeLens.command.title.startsWith("TSPerf:")),
    "Expected TSPerf CodeLens after inspection."
  );
};
