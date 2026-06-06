# Local Verification

## 2026-06-06

### Command

```bash
npm test
```

### Example Result

```json
{
  "elapsedMs": 3.794,
  "score": 288,
  "typeLength": 6,
  "propertyCount": 50,
  "graphNodes": 57,
  "typeText": "string"
}
```

`elapsedMs` can vary between machines and runs.

### Privacy Check

- The extension runtime did not make network calls.
- No private workspace content was uploaded.
- The smoke test used only `fixtures/sample.ts` and the local `typescript` dev dependency.

## 2026-05-21

### Commands

```bash
node --check src/extension.js
node smoke snippet using local TypeScript module and fixtures/sample.ts
```

### Result

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

### Privacy Check

- No network calls were made for package installation.
- No GitHub comments or pull requests were made during local verification.
- No private workspace content was uploaded.
- The smoke test used only `fixtures/sample.ts` and an already-present local TypeScript installation.
