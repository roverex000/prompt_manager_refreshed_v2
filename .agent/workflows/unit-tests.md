---
description: How to run unit tests
---

# Running Unit Tests

## Run All Tests (Unit + Integration)
// turbo
1. Run the test command:
```bash
npm test
```

## Run Unit Tests Only (Exclude Integration)
// turbo
1. Run Jest excluding the integration folder:
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathIgnorePatterns=integration
```

## Run Tests in Watch Mode
// turbo
1. Run Jest in watch mode for development:
```bash
npm run test:watch
```

## Unit Test Files

Unit tests are located in:
- `tests/PromptService.test.js`
- `tests/TemplateService.test.js`
- `tests/CollectionService.test.js`
- `tests/SemanticSearch.test.js`
- `tests/App.test.js`

## Notes
- Use `npm test` for full test suite before committing
- Watch mode re-runs tests on file changes
