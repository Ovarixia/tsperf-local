"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { inspectTypeAtPosition } = require("../src/extension");

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

function positionForNeedle(text, needle) {
  const offset = text.indexOf(needle);
  assert.notStrictEqual(offset, -1, `Could not find ${needle} in fixture.`);
  const beforeTarget = text.slice(0, offset);
  const lines = beforeTarget.split("\n");
  return {
    line: lines.length - 1,
    character: lines[lines.length - 1].length,
  };
}

function inspectFixture(relativePath, target) {
  const fixturePath = path.join(__dirname, "..", relativePath);
  const sourceText = fs.readFileSync(fixturePath, "utf8");
  const document = makeDocument(fixturePath, sourceText);
  const result = inspectTypeAtPosition(ts, document, positionForNeedle(sourceText, target), 6);
  return result.metrics;
}

function assertBetween(value, min, max, label) {
  assert.ok(value >= min, `${label} expected >= ${min}, received ${value}.`);
  assert.ok(value <= max, `${label} expected <= ${max}, received ${value}.`);
}

const cases = [
  {
    name: "large union",
    fixture: "fixtures/type-shapes.ts",
    target: "unionTarget;",
    expected: {
      score: [500, 800],
      unionMembers: 10,
      graphNodes: [100, 190],
      maxGraphDepth: [5, 6],
    },
  },
  {
    name: "wide intersection",
    fixture: "fixtures/type-shapes.ts",
    target: "intersectionTarget;",
    expected: {
      score: [250, 450],
      intersectionMembers: 4,
      propertyCount: [8, 14],
      graphNodes: [50, 110],
    },
  },
  {
    name: "recursive json",
    fixture: "fixtures/type-shapes.ts",
    target: "recursiveTarget;",
    expected: {
      score: [300, 520],
      unionMembers: 6,
      graphNodes: [80, 150],
    },
  },
  {
    name: "mapped readonly catalog",
    fixture: "fixtures/type-shapes.ts",
    target: "mappedTarget;",
    expected: {
      score: [180, 380],
      graphNodes: [30, 80],
      maxGraphDepth: [4, 6],
    },
  },
  {
    name: "generic pipeline",
    fixture: "fixtures/type-shapes.ts",
    target: "genericTarget;",
    expected: {
      score: [400, 700],
      graphNodes: [100, 190],
      maxGraphDepth: [4, 6],
    },
  },
  {
    name: "complex api model",
    fixture: "fixtures/complex-api-model.ts",
    target: "result;",
    expected: {
      score: [850, 1150],
      unionMembers: 2,
      graphNodes: [250, 360],
      maxGraphDepth: [5, 6],
    },
  },
];

const summary = [];
for (const testCase of cases) {
  const metrics = inspectFixture(testCase.fixture, testCase.target);
  for (const [metricName, expected] of Object.entries(testCase.expected)) {
    if (Array.isArray(expected)) {
      assertBetween(metrics[metricName], expected[0], expected[1], `${testCase.name} ${metricName}`);
    } else {
      assert.strictEqual(metrics[metricName], expected, `${testCase.name} ${metricName}`);
    }
  }
  summary.push({
    name: testCase.name,
    score: metrics.score,
    graphNodes: metrics.graphNodes,
    maxGraphDepth: metrics.maxGraphDepth,
  });
}

console.log(JSON.stringify(summary, null, 2));
