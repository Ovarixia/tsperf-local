"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { buildExportPayload, inspectTypeAtPosition, sanitizeFileName } = require("../src/extension");

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

function inspectFixture(relativePath, needle, needleOffset = 0) {
  const fixturePath = path.join(__dirname, "..", relativePath);
  const sourceText = fs.readFileSync(fixturePath, "utf8");
  const document = makeDocument(fixturePath, sourceText);
  const position = positionForNeedle(sourceText, needle, needleOffset);
  const result = inspectTypeAtPosition(ts, document, position, 6);
  const payload = buildExportPayload(ts, document.uri, position, 6, result);
  return {
    fixturePath,
    sourceText,
    position,
    result,
    payload,
    serialized: JSON.stringify(payload, null, 2),
  };
}

const sample = inspectFixture("fixtures/sample.ts", "invoice.customer.address.city", "invoice.customer.address.city".lastIndexOf("city"));
assert.strictEqual(sample.payload.schemaVersion, 1);
assert.strictEqual(sample.payload.tool.name, "TSPerf Local");
assert.strictEqual(sample.payload.file, "sample.ts");
assert.strictEqual(sample.payload.cursor.line, sample.position.line + 1);
assert.strictEqual(sample.payload.cursor.character, sample.position.character + 1);
assert.strictEqual(sample.payload.typescriptVersion, ts.version);
assert.strictEqual(sample.payload.maxDepth, 6);
assert.ok(sample.payload.elapsedMs >= 0, "Expected elapsedMs to be non-negative.");
assert.deepStrictEqual(sample.payload.metrics, {
  score: sample.result.metrics.score,
  typeLength: sample.result.metrics.typeLength,
  unionMembers: sample.result.metrics.unionMembers,
  intersectionMembers: sample.result.metrics.intersectionMembers,
  propertyCount: sample.result.metrics.propertyCount,
  signatureCount: sample.result.metrics.signatureCount,
  graphNodes: sample.result.metrics.graphNodes,
  maxGraphDepth: sample.result.metrics.maxGraphDepth,
});
assert.ok(!Object.hasOwn(sample.payload, "typeText"), "Export payload must not include type text.");
assert.ok(!sample.serialized.includes(sample.fixturePath), "Export payload must not include absolute file paths.");
assert.ok(!sample.serialized.includes("invoice.customer.address.city"), "Export payload must not include source code.");
assert.ok(!sample.serialized.includes("1 Main Street"), "Export payload must not include fixture data.");

const complex = inspectFixture("fixtures/complex-api-model.ts", "result;");
assert.strictEqual(complex.payload.file, "complex-api-model.ts");
assert.ok(complex.payload.metrics.score >= 500, "Expected complex fixture to produce a high score.");
assert.ok(complex.payload.metrics.graphNodes >= 200, "Expected complex fixture to traverse a large graph.");
assert.ok(complex.payload.metrics.maxGraphDepth >= 5, "Expected complex fixture to reach a nested graph.");
assert.ok(!complex.serialized.includes(complex.fixturePath), "Complex export payload must not include absolute file paths.");
assert.ok(!complex.serialized.includes("declare const result"), "Complex export payload must not include source code.");

assert.strictEqual(sanitizeFileName("fixtures/complex-api-model.ts"), "fixtures-complex-api-model.ts");
assert.strictEqual(sanitizeFileName("../private file.ts"), "private-file.ts");

console.log(
  JSON.stringify(
    {
      sample: sample.payload,
      complex: {
        file: complex.payload.file,
        score: complex.payload.metrics.score,
        graphNodes: complex.payload.metrics.graphNodes,
        maxGraphDepth: complex.payload.metrics.maxGraphDepth,
      },
    },
    null,
    2
  )
);
