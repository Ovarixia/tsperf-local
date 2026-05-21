# Local Verification

Date: 2026-05-21

## Commands

```bash
node --check src/extension.js
node smoke snippet using local TypeScript module and fixtures/sample.ts
```

## Result

```json
{
  "elapsedMs": 3.94,
  "score": 288,
  "typeLength": 6,
  "propertyCount": 50,
  "graphNodes": 57,
  "typeText": "string"
}
```

## Privacy Check

- No network calls were made for package installation.
- No GitHub comments or pull requests were made during local verification.
- No private workspace content was uploaded.
- The smoke test used only `fixtures/sample.ts` and an already-present local TypeScript installation.
