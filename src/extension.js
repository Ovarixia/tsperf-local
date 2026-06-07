"use strict";

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
let vscode;
try {
  vscode = require("vscode");
} catch (_) {
  vscode = null;
}

let statusBar;
let output;
let autoInspect = false;
let inspectTimer;
let lastInspectionExport;
let lastInspectionCodeLens;
let codeLensEmitter;

function activate(context) {
  if (!vscode) {
    throw new Error("TSPerf Local can only activate inside VS Code.");
  }
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = "tsperf.inspectType";
  statusBar.text = "TSPerf";
  statusBar.tooltip = "Inspect TypeScript type complexity at cursor";
  statusBar.show();

  output = vscode.window.createOutputChannel("TSPerf Local");
  codeLensEmitter = new vscode.EventEmitter();

  autoInspect = vscode.workspace.getConfiguration("tsperf").get("autoInspect", false);

  context.subscriptions.push(
    statusBar,
    output,
    codeLensEmitter,
    vscode.languages.registerCodeLensProvider(["typescript", "typescriptreact"], createCodeLensProvider()),
    vscode.commands.registerCommand("tsperf.inspectType", inspectActiveEditor),
    vscode.commands.registerCommand("tsperf.exportLastInspection", exportLastInspection),
    vscode.commands.registerCommand("tsperf.toggleAutoInspect", toggleAutoInspect),
    vscode.window.onDidChangeTextEditorSelection(scheduleAutoInspect),
    vscode.window.onDidChangeActiveTextEditor(scheduleAutoInspect),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("tsperf.autoInspect")) {
        autoInspect = vscode.workspace.getConfiguration("tsperf").get("autoInspect", false);
      }
    })
  );
}

function deactivate() {
  if (inspectTimer) {
    clearTimeout(inspectTimer);
  }
}

async function toggleAutoInspect() {
  autoInspect = !autoInspect;
  await vscode.workspace.getConfiguration("tsperf").update("autoInspect", autoInspect, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`TSPerf auto inspect ${autoInspect ? "enabled" : "disabled"}.`);
  if (autoInspect) {
    scheduleAutoInspect();
  }
}

function scheduleAutoInspect() {
  if (!autoInspect) {
    return;
  }
  if (inspectTimer) {
    clearTimeout(inspectTimer);
  }
  inspectTimer = setTimeout(() => {
    inspectActiveEditor({ silent: true }).catch((error) => {
      output.appendLine(`[auto] ${error.message}`);
    });
  }, 250);
}

async function inspectActiveEditor(options = {}) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !isTypeScriptDocument(editor.document)) {
    statusBar.text = "TSPerf: no TS file";
    if (!options.silent) {
      vscode.window.showWarningMessage("Open a TypeScript or TSX file before running TSPerf.");
    }
    return;
  }

  let ts;
  try {
    ts = resolveTypeScript(editor.document.uri.fsPath);
  } catch (error) {
    statusBar.text = "TSPerf: TypeScript missing";
    output.appendLine(error.stack || error.message);
    if (!options.silent) {
      vscode.window.showErrorMessage(error.message);
    }
    return;
  }

  const maxDepth = vscode.workspace.getConfiguration("tsperf").get("maxDepth", 6);
  const result = inspectTypeAtPosition(ts, editor.document, editor.selection.active, maxDepth);
  lastInspectionExport = buildExportPayload(ts, editor.document.uri, editor.selection.active, maxDepth, result);
  lastInspectionCodeLens = buildCodeLensState(editor.document.uri, editor.selection.active, result);
  codeLensEmitter.fire();
  const score = formatScore(result.metrics.score);
  statusBar.text = `TSPerf: ${result.elapsedMs.toFixed(1)}ms | ${score}`;
  statusBar.tooltip = buildTooltip(result);

  output.clear();
  output.appendLine("TSPerf Local");
  output.appendLine("============");
  output.appendLine(`File: ${formatDocumentPath(editor.document.uri)}`);
  output.appendLine(`Cursor: ${editor.selection.active.line + 1}:${editor.selection.active.character + 1}`);
  output.appendLine(`Load time: ${result.elapsedMs.toFixed(3)}ms`);
  output.appendLine(`Complexity score: ${result.metrics.score}`);
  output.appendLine(`Type length: ${result.metrics.typeLength}`);
  output.appendLine(`Union members: ${result.metrics.unionMembers}`);
  output.appendLine(`Intersection members: ${result.metrics.intersectionMembers}`);
  output.appendLine(`Properties: ${result.metrics.propertyCount}`);
  output.appendLine(`Signatures: ${result.metrics.signatureCount}`);
  output.appendLine(`Graph nodes: ${result.metrics.graphNodes}`);
  output.appendLine(`Max graph depth: ${result.metrics.maxGraphDepth}`);
  output.appendLine("");
  output.appendLine("Type:");
  output.appendLine(result.typeText);

  if (!options.silent) {
    output.show(true);
  }
}

async function exportLastInspection() {
  if (!lastInspectionExport) {
    await inspectActiveEditor({ silent: true });
  }

  if (!lastInspectionExport) {
    vscode.window.showWarningMessage("Run TSPerf on a TypeScript file before exporting metrics.");
    return;
  }

  const target = await vscode.window.showSaveDialog({
    defaultUri: buildDefaultExportUri(lastInspectionExport.file),
    filters: {
      JSON: ["json"],
    },
    saveLabel: "Export TSPerf metrics",
    title: "Export TSPerf metrics as local JSON",
  });
  if (!target) {
    return;
  }

  const serialized = `${JSON.stringify(lastInspectionExport, null, 2)}\n`;
  await vscode.workspace.fs.writeFile(target, Buffer.from(serialized, "utf8"));
  vscode.window.showInformationMessage(`TSPerf metrics exported to ${formatDocumentPath(target)}.`);
}

function isTypeScriptDocument(document) {
  return document.languageId === "typescript" || document.languageId === "typescriptreact";
}

function createCodeLensProvider() {
  return {
    onDidChangeCodeLenses: codeLensEmitter.event,
    provideCodeLenses(document) {
      if (!lastInspectionCodeLens || lastInspectionCodeLens.uri !== document.uri.toString()) {
        return [];
      }
      const position = new vscode.Position(lastInspectionCodeLens.line, 0);
      return [
        new vscode.CodeLens(new vscode.Range(position, position), {
          title: lastInspectionCodeLens.title,
          command: "tsperf.inspectType",
          tooltip: "Re-run TSPerf at the current cursor position.",
        }),
      ];
    },
  };
}

function resolveTypeScript(documentPath) {
  const candidates = [];
  const builtin = vscode.extensions.getExtension("vscode.typescript-language-features");
  if (builtin) {
    candidates.push(path.join(builtin.extensionPath, "node_modules"));
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(documentPath));
  if (workspaceFolder) {
    candidates.push(workspaceFolder.uri.fsPath);
  }
  candidates.push(path.dirname(documentPath));

  for (const candidate of candidates) {
    try {
      const resolved = require.resolve("typescript", { paths: [candidate] });
      return require(resolved);
    } catch (_) {
      // Try the next local TypeScript source.
    }
  }

  try {
    return require("typescript");
  } catch (_) {
    throw new Error("TSPerf could not find TypeScript locally. Open a workspace with node_modules/typescript or use VS Code's bundled TypeScript extension.");
  }
}

function formatDocumentPath(uri) {
  if (vscode && uri) {
    try {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (workspaceFolder) {
        return vscode.workspace.asRelativePath(uri, false);
      }
    } catch (_) {
      // Fall back to basename below.
    }
  }
  return uri && uri.fsPath ? path.basename(uri.fsPath) : "unknown";
}

function buildExportPayload(ts, uri, position, maxDepth, result) {
  return {
    schemaVersion: 1,
    tool: {
      name: "TSPerf Local",
      version: getExtensionVersion(),
    },
    file: formatDocumentPath(uri),
    cursor: {
      line: position.line + 1,
      character: position.character + 1,
    },
    typescriptVersion: ts.version || "unknown",
    maxDepth,
    elapsedMs: Number(result.elapsedMs.toFixed(3)),
    metrics: {
      score: result.metrics.score,
      typeLength: result.metrics.typeLength,
      unionMembers: result.metrics.unionMembers,
      intersectionMembers: result.metrics.intersectionMembers,
      propertyCount: result.metrics.propertyCount,
      signatureCount: result.metrics.signatureCount,
      graphNodes: result.metrics.graphNodes,
      maxGraphDepth: result.metrics.maxGraphDepth,
    },
  };
}

function buildCodeLensState(uri, position, result) {
  return {
    uri: uri.toString(),
    line: position.line,
    title: `TSPerf: ${formatScore(result.metrics.score)} | ${result.metrics.graphNodes} nodes | depth ${result.metrics.maxGraphDepth}`,
  };
}

function getExtensionVersion() {
  try {
    return require("../package.json").version;
  } catch (_) {
    return "unknown";
  }
}

function buildDefaultExportUri(filePath) {
  const fileName = `tsperf-${sanitizeFileName(filePath)}.json`;
  const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  if (workspaceFolder) {
    return vscode.Uri.joinPath(workspaceFolder.uri, fileName);
  }
  return vscode.Uri.file(path.join(process.cwd(), fileName));
}

function sanitizeFileName(value) {
  const normalized = String(value || "metrics")
    .replace(/[\\/]+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^\.+/, "")
    .replace(/^-+|-+$/g, "");
  return normalized || "metrics";
}

function inspectTypeAtPosition(ts, document, position, maxDepth) {
  const fileName = document.uri.fsPath;
  const sourceText = document.getText();
  const offset = document.offsetAt(position);
  const compilerOptions = loadCompilerOptions(ts, fileName);
  const host = createLanguageServiceHost(ts, fileName, sourceText, compilerOptions);
  const service = ts.createLanguageService(host);
  const program = service.getProgram();
  const sourceFile = program && program.getSourceFile(fileName);
  if (!program || !sourceFile) {
    throw new Error("TSPerf could not create a TypeScript program for this file.");
  }

  const checker = program.getTypeChecker();
  const node = findSmallestNodeAt(sourceFile, offset) || sourceFile;
  const started = performance.now();
  const type = checker.getTypeAtLocation(node);
  const typeText = checker.typeToString(type, node, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias);
  const elapsedMs = performance.now() - started;
  const metrics = buildMetrics(ts, checker, type, typeText, maxDepth);

  service.dispose();
  return {
    elapsedMs,
    typeText,
    metrics,
  };
}

function loadCompilerOptions(ts, fileName) {
  const configPath = ts.findConfigFile(path.dirname(fileName), ts.sys.fileExists, "tsconfig.json");
  if (!configPath) {
    return {
      allowJs: false,
      checkJs: false,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      noEmit: true,
      strict: false,
      target: ts.ScriptTarget.ES2022,
    };
  }
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    return {};
  }
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));
  return parsed.options || {};
}

function createLanguageServiceHost(ts, fileName, sourceText, compilerOptions) {
  const versions = new Map([[fileName, "0"]]);
  return {
    getCompilationSettings: () => compilerOptions,
    getCurrentDirectory: () => path.dirname(fileName),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    getScriptFileNames: () => Array.from(versions.keys()),
    getScriptVersion: (name) => versions.get(name) || "0",
    getScriptSnapshot: (name) => {
      if (name === fileName) {
        return ts.ScriptSnapshot.fromString(sourceText);
      }
      if (!fs.existsSync(name)) {
        return undefined;
      }
      return ts.ScriptSnapshot.fromString(fs.readFileSync(name, "utf8"));
    },
    fileExists: ts.sys.fileExists,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };
}

function findSmallestNodeAt(sourceFile, offset) {
  let best;
  function visit(node) {
    if (offset >= node.getFullStart() && offset <= node.getEnd()) {
      best = node;
      node.forEachChild(visit);
    }
  }
  visit(sourceFile);
  return best;
}

function buildMetrics(ts, checker, type, typeText, maxDepth) {
  const seen = new Set();
  const metrics = {
    typeLength: typeText.length,
    unionMembers: type.isUnion && type.isUnion() ? type.types.length : 0,
    intersectionMembers: type.isIntersection && type.isIntersection() ? type.types.length : 0,
    propertyCount: safeCount(() => checker.getPropertiesOfType(type).length),
    signatureCount: safeCount(() => checker.getSignaturesOfType(type, ts.SignatureKind.Call).length + checker.getSignaturesOfType(type, ts.SignatureKind.Construct).length),
    graphNodes: 0,
    maxGraphDepth: 0,
    score: 0,
  };

  walkType(checker, type, 0, maxDepth, seen, metrics);
  metrics.score = Math.round(
    metrics.typeLength / 12 +
      metrics.unionMembers * 8 +
      metrics.intersectionMembers * 10 +
      metrics.propertyCount * 2 +
      metrics.signatureCount * 6 +
      metrics.graphNodes * 3 +
      metrics.maxGraphDepth * 8
  );
  return metrics;
}

function walkType(checker, type, depth, maxDepth, seen, metrics) {
  if (!type || depth > maxDepth) {
    return;
  }
  const id = type.id || checker.typeToString(type).slice(0, 200);
  if (seen.has(id)) {
    return;
  }
  seen.add(id);
  metrics.graphNodes += 1;
  metrics.maxGraphDepth = Math.max(metrics.maxGraphDepth, depth);

  const children = [];
  if (type.isUnion && type.isUnion()) {
    children.push(...type.types);
  }
  if (type.isIntersection && type.isIntersection()) {
    children.push(...type.types);
  }
  for (const prop of safeArray(() => checker.getPropertiesOfType(type))) {
    const propType = safeValue(() => checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration || prop.declarations?.[0]));
    if (propType) {
      children.push(propType);
    }
  }
  for (const child of children.slice(0, 80)) {
    walkType(checker, child, depth + 1, maxDepth, seen, metrics);
  }
}

function safeCount(fn) {
  try {
    return fn();
  } catch (_) {
    return 0;
  }
}

function safeArray(fn) {
  try {
    return fn() || [];
  } catch (_) {
    return [];
  }
}

function safeValue(fn) {
  try {
    return fn();
  } catch (_) {
    return undefined;
  }
}

function formatScore(score) {
  if (score < 50) {
    return `low ${score}`;
  }
  if (score < 150) {
    return `med ${score}`;
  }
  return `high ${score}`;
}

function buildTooltip(result) {
  return [
    `Type load: ${result.elapsedMs.toFixed(3)}ms`,
    `Complexity: ${result.metrics.score}`,
    `Length: ${result.metrics.typeLength}`,
    `Properties: ${result.metrics.propertyCount}`,
    `Graph: ${result.metrics.graphNodes} nodes / depth ${result.metrics.maxGraphDepth}`,
    "",
    "Click to inspect the current type.",
  ].join("\n");
}

module.exports = {
  activate,
  deactivate,
  inspectTypeAtPosition,
  buildMetrics,
  formatDocumentPath,
  buildExportPayload,
  buildCodeLensState,
  sanitizeFileName,
};
