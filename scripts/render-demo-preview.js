"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const ts = require("typescript");
const { inspectTypeAtPosition } = require("../src/extension");

const root = path.join(__dirname, "..");
const fixturePath = path.join(root, "fixtures", "complex-api-model.ts");
const assetsDir = path.join(root, "docs", "assets");
const framesDir = path.join(assetsDir, "demo-preview-frames");
const gifPath = path.join(assetsDir, "tsperf-local-demo-preview.gif");
const contactSheetPath = path.join(assetsDir, "tsperf-local-demo-preview-contact-sheet.png");
const sourceText = fs.readFileSync(fixturePath, "utf8");
const lines = sourceText.split("\n");

function makeDocument(fileName, text) {
  const lineStarts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      lineStarts.push(index + 1);
    }
  }

  return {
    uri: { fsPath: fileName },
    getText: () => text,
    offsetAt: (position) => lineStarts[position.line] + position.character,
  };
}

const resultLine = lines.findIndex((line) => line.trim() === "result;") + 1;
const document = makeDocument(fixturePath, sourceText);
const metrics = inspectTypeAtPosition(ts, document, { line: resultLine - 1, character: 0 }, 6);
const display = {
  elapsedMs: Number(metrics.elapsedMs.toFixed(3)),
  score: metrics.metrics.score,
  typeLength: metrics.metrics.typeLength,
  unionMembers: metrics.metrics.unionMembers,
  intersectionMembers: metrics.metrics.intersectionMembers,
  propertyCount: metrics.metrics.propertyCount,
  signatureCount: metrics.metrics.signatureCount,
  graphNodes: metrics.metrics.graphNodes,
  maxGraphDepth: metrics.metrics.maxGraphDepth,
};
const stableMetrics = Object.fromEntries(Object.entries(display).filter(([key]) => key !== "elapsedMs"));

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(raw) {
  let value = escapeHtml(raw);
  value = value.replace(/("[^"]*")/g, '<span class="str">$1</span>');
  value = value.replace(/\b(type|declare|const|true|false)\b/g, '<span class="kw">$1</span>');
  value = value.replace(
    /\b(ApiResponse|InvoiceWorkflow|EnterpriseCustomer|Customer|CustomerSegment|Array|Record|string|unknown|TData)\b/g,
    '<span class="type">$1</span>'
  );
  value = value.replace(/\b(ok|requestId|data|warnings|error|code|message|details)(?=\s*:)/g, '<span class="prop">$1</span>');
  value = value.replace(/\b(result)\b/g, '<span class="id">$1</span>');
  return value || " ";
}

function codeBlock() {
  const start = 120;
  const end = 131;
  const gutter = [];
  const code = [];
  for (let lineNumber = start; lineNumber <= end; lineNumber += 1) {
    gutter.push(String(lineNumber));
    const className = lineNumber === resultLine ? "line focus" : "line";
    code.push(`<span class="${className}">${highlight(lines[lineNumber - 1])}</span>`);
  }
  return {
    gutter: gutter.join("\n"),
    code: code.join(""),
  };
}

function outputBlock() {
  return `TSPerf Local
============
File: fixtures/complex-api-model.ts
Cursor: ${resultLine}:1
Load time: ${display.elapsedMs.toFixed(3)}ms
Complexity score: ${display.score}
Type length: ${display.typeLength}
Union members: ${display.unionMembers}
Intersection members: ${display.intersectionMembers}
Properties: ${display.propertyCount}
Signatures: ${display.signatureCount}
Graph nodes: ${display.graphNodes}
Max graph depth: ${display.maxGraphDepth}`;
}

function htmlFor(state) {
  const code = codeBlock();
  const showPalette = state === "palette";
  const showOutput = state === "output";
  const status = showOutput ? `TSPerf: ${display.elapsedMs.toFixed(1)}ms | high ${display.score}` : "TSPerf";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TSPerf Local Demo ${state}</title>
<style>
:root{--panel:#1e1e1e;--panel2:#252526;--border:#333;--text:#d4d4d4;--muted:#8b949e;--blue:#3794ff;--purple:#c586c0;--cyan:#4ec9b0;--yellow:#dcdcaa;--str:#ce9178}
*{box-sizing:border-box}body{margin:0;width:1400px;height:900px;background:#101010;color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}.window{width:1320px;height:820px;margin:40px auto;border:1px solid #2d2d2d;border-radius:10px;overflow:hidden;background:var(--panel);box-shadow:0 30px 80px rgba(0,0,0,.55)}.titlebar{height:40px;background:#181818;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--border);gap:12px}.traffic{display:flex;gap:8px}.dot{width:12px;height:12px;border-radius:50%}.dot:nth-child(1){background:#ff5f57}.dot:nth-child(2){background:#ffbd2e}.dot:nth-child(3){background:#28c840}.title{color:#ccc;font-size:13px;flex:1;text-align:center}.main{height:756px;display:grid;grid-template-columns:54px 238px 1fr}.activity{background:#181818;border-right:1px solid var(--border);padding-top:18px;display:flex;flex-direction:column;align-items:center;gap:24px;color:#858585}.icon{width:24px;height:24px;border-radius:6px;border:2px solid currentColor;opacity:.7}.active{color:var(--blue);opacity:1}.sidebar{background:var(--panel2);border-right:1px solid var(--border);padding:14px 12px}.side-title{font-size:11px;color:#bbb;text-transform:uppercase;margin-bottom:14px}.tree{font-size:13px;line-height:24px;color:#ccc}.folder{font-weight:650}.file{padding-left:16px;color:#b9c2cf}.selected{background:#37373d;border-radius:4px;color:white;padding:2px 6px 2px 16px;margin-left:-6px}.workbench{min-height:0;display:grid;grid-template-rows:${showOutput ? "452px 280px 24px" : "732px 24px"}}.editor{min-height:0;background:#1e1e1e;overflow:hidden;position:relative}.tab{height:34px;display:flex;align-items:center;padding:0 16px;background:#2d2d2d;border-bottom:1px solid var(--border);color:#fff;font-size:13px;width:232px}.codewrap{height:${showOutput ? "418px" : "698px"};display:grid;grid-template-columns:58px 1fr;font-family:"SFMono-Regular",Menlo,Monaco,Consolas,monospace;font-size:14px;line-height:24px;padding-top:${showOutput ? "42px" : "150px"};overflow:hidden}.gutter{color:#6e7681;text-align:right;padding-right:14px;white-space:pre}.code{white-space:pre;color:var(--text)}.line{display:block;height:24px}.focus{margin-left:-6px;padding-left:6px;background:rgba(55,148,255,.15);border-left:2px solid var(--blue)}.kw{color:var(--purple)}.type{color:var(--cyan)}.str{color:var(--str)}.id{color:#9cdcfe}.prop{color:var(--yellow)}.panel{min-height:0;background:#1e1e1e;border-top:1px solid var(--border);display:grid;grid-template-rows:36px 1fr}.panel-tabs{height:36px;background:#252526;display:flex;align-items:center;gap:24px;padding:0 16px;border-bottom:1px solid var(--border);font-size:12px;color:#bbb;text-transform:uppercase}.panel-tabs .on{color:#fff;border-bottom:1px solid var(--blue);height:36px;display:flex;align-items:center}.output{min-height:0;display:grid;grid-template-columns:1fr 330px}pre{margin:0;padding:14px 18px;font-family:"SFMono-Regular",Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:19px;color:#d4d4d4;white-space:pre-wrap}.metrics{border-left:1px solid var(--border);padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;align-content:start;background:#202020}.metric{border:1px solid #363636;border-radius:6px;padding:10px 12px;background:#1b1b1b}.metric span{display:block;color:var(--muted);font-size:11px;margin-bottom:4px}.metric strong{color:#fff;font-size:22px;font-weight:650}.status{height:24px;background:#007acc;display:flex;align-items:center;justify-content:space-between;padding:0 12px;color:white;font-size:12px}.right{display:flex;gap:16px;opacity:.95}.palette{position:absolute;left:50%;top:76px;transform:translateX(-50%);width:620px;background:#252526;border:1px solid #454545;border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.5);overflow:hidden}.palette .input{height:48px;display:flex;align-items:center;padding:0 18px;border-bottom:1px solid #3a3a3a;color:#fff;font-size:15px}.palette .item{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:#094771;color:#fff;font-size:14px}.palette .hint{color:#c8d7e6;font-size:12px}.callout{position:absolute;right:28px;bottom:34px;background:#111827;border:1px solid #314158;color:#dbeafe;padding:10px 12px;border-radius:6px;font-size:13px}
</style></head><body><div class="window"><div class="titlebar"><div class="traffic"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="title">complex-api-model.ts - tsperf-local</div></div><div class="main"><div class="activity"><div class="icon active"></div><div class="icon"></div><div class="icon"></div><div class="icon"></div></div><aside class="sidebar"><div class="side-title">Explorer</div><div class="tree"><div class="folder">&#9662; tsperf-local</div><div class="file">README.md</div><div class="file">package.json</div><div class="folder">&#9662; fixtures</div><div class="file selected">complex-api-model.ts</div><div class="folder">&#9656; src</div><div class="folder">&#9656; tests</div></div></aside><section class="workbench"><div class="editor"><div class="tab">complex-api-model.ts</div><div class="codewrap"><div class="gutter">${code.gutter}</div><div class="code">${code.code}</div></div>${showPalette ? '<div class="palette"><div class="input">&gt; TSPerf: Inspect Type At Cursor</div><div class="item"><span>TSPerf: Inspect Type At Cursor</span><span class="hint">tsperf.inspectType</span></div></div>' : ""}${state === "cursor" ? '<div class="callout">Cursor on a nested API workflow type</div>' : ""}</div>${showOutput ? `<div class="panel"><div class="panel-tabs"><span>Problems</span><span class="on">Output</span><span>Debug Console</span><span>Terminal</span></div><div class="output"><pre>${outputBlock()}</pre><div class="metrics"><div class="metric"><span>Load time</span><strong>${display.elapsedMs.toFixed(1)}ms</strong></div><div class="metric"><span>Score</span><strong>${display.score}</strong></div><div class="metric"><span>Graph nodes</span><strong>${display.graphNodes}</strong></div><div class="metric"><span>Max depth</span><strong>${display.maxGraphDepth}</strong></div></div></div></div>` : ""}<div class="status"><span>${status}</span><span class="right"><span>TypeScript</span><span>Spaces: 2</span><span>UTF-8</span></span></div></section></div></div></body></html>`;
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function fileUrl(filePath) {
  return `file://${filePath}`;
}

function renderRasterAssets() {
  for (let index = 0; index < 3; index += 1) {
    run("npx", [
      "-y",
      "playwright",
      "screenshot",
      "--browser=chromium",
      "--viewport-size=1400,900",
      fileUrl(path.join(framesDir, `frame-${index}.html`)),
      path.join(framesDir, `frame-${index}.png`),
    ]);
  }

  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-framerate",
    "1",
    "-i",
    path.join(framesDir, "frame-%d.png"),
    "-vf",
    "scale=1100:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
    "-loop",
    "0",
    gifPath,
  ]);

  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    path.join(framesDir, "frame-0.png"),
    "-i",
    path.join(framesDir, "frame-1.png"),
    "-i",
    path.join(framesDir, "frame-2.png"),
    "-filter_complex",
    "[0:v]scale=466:-1[a];[1:v]scale=466:-1[b];[2:v]scale=466:-1[c];[a][b][c]hstack=inputs=3",
    "-frames:v",
    "1",
    "-update",
    "1",
    contactSheetPath,
  ]);
}

fs.mkdirSync(framesDir, { recursive: true });
for (const [index, state] of ["cursor", "palette", "output"].entries()) {
  fs.writeFileSync(path.join(framesDir, `frame-${index}.html`), htmlFor(state));
}
fs.writeFileSync(path.join(assetsDir, "tsperf-local-demo-preview-metrics.json"), JSON.stringify(stableMetrics, null, 2));
if (process.argv.includes("--render")) {
  renderRasterAssets();
}
console.log(JSON.stringify({ framesDir, gifPath, contactSheetPath, display }, null, 2));
