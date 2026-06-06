"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { formatDocumentPath, inspectTypeAtPosition } = require("../src/extension");

const fixturePath = path.join(__dirname, "..", "fixtures", "sample.ts");
const sourceText = fs.readFileSync(fixturePath, "utf8");

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

function positionForNeedle(text, needle, needleOffset = 0) {
  const offset = text.indexOf(needle);
  assert.notStrictEqual(offset, -1, `Could not find ${needle} in fixture.`);
  const targetOffset = offset + needleOffset;
  const beforeTarget = text.slice(0, targetOffset);
  const lines = beforeTarget.split("\n");
  return {
    line: lines.length - 1,
    character: lines[lines.length - 1].length,
  };
}

const document = makeDocument(fixturePath, sourceText);
const cityAccess = "invoice.customer.address.city";
const cityPosition = positionForNeedle(sourceText, cityAccess, cityAccess.lastIndexOf("city"));
const result = inspectTypeAtPosition(ts, document, cityPosition, 6);

assert.ok(result.elapsedMs >= 0, "Expected elapsedMs to be non-negative.");
assert.strictEqual(result.typeText, "string");
assert.ok(result.metrics.score > 0, "Expected a positive complexity score.");
assert.ok(result.metrics.typeLength > 0, "Expected a non-empty type string.");
assert.ok(result.metrics.graphNodes > 0, "Expected the type graph to include nodes.");
assert.strictEqual(formatDocumentPath({ fsPath: fixturePath }), "sample.ts");

console.log(
  JSON.stringify(
    {
      elapsedMs: Number(result.elapsedMs.toFixed(3)),
      score: result.metrics.score,
      typeLength: result.metrics.typeLength,
      propertyCount: result.metrics.propertyCount,
      graphNodes: result.metrics.graphNodes,
      typeText: result.typeText,
    },
    null,
    2
  )
);
