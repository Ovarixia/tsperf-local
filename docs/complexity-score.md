# Complexity Score

TSPerf Local reports a lightweight complexity score for the TypeScript type under the cursor. The score is meant to help maintainers spot types that deserve deeper profiling, not to predict exact compiler cost.

## What The Score Uses

The analyzer combines a small set of local TypeScript compiler API signals:

- Type text length.
- Union and intersection member counts.
- Property count.
- Call and construct signature count.
- Traversed type graph size.
- Maximum traversed graph depth.

These values are collected locally from the active document. TSPerf Local does not upload source code, type text, paths, or metrics.

When metrics are exported as JSON, the payload intentionally omits source code and full type text. It uses a relative workspace path when possible, or a basename fallback outside a workspace.

## How To Interpret It

Higher scores usually indicate broader inferred object graphs, deeply nested generic shapes, large unions, or types with many visible properties. These are useful starting points when a project has slow editor feedback or type-checking hotspots.

Use the score as a triage signal:

1. Inspect a suspicious identifier, expression, or type alias.
2. Compare nearby types or alternative definitions.
3. Use TypeScript compiler diagnostics or traces for final performance decisions.

## Current Limits

- The score is approximate and may change as the analyzer improves.
- Runtime timing varies by machine, VS Code state, TypeScript version, and workspace size.
- Traversal depth is capped by `tsperf.maxDepth`, so extremely large graphs are summarized rather than fully expanded.
- A low score does not guarantee a type is cheap during a full project build.

## Example

The README demo inspects `ApiResponse<InvoiceWorkflow<EnterpriseCustomer>>` in `fixtures/complex-api-model.ts` and reports:

```json
{
  "score": 994,
  "typeLength": 307,
  "unionMembers": 2,
  "intersectionMembers": 0,
  "propertyCount": 2,
  "signatureCount": 0,
  "graphNodes": 300,
  "maxGraphDepth": 6
}
```

The important signal is not the exact number. The useful signal is that this type traverses a comparatively large graph and is worth inspecting before it spreads through public APIs.
