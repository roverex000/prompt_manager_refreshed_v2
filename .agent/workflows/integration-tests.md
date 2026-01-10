---
description: How to run integration tests
---

# Running Integration Tests

## Run All Tests (Unit + Integration)
// turbo
1. Run the test command:
```bash
npm test
```

## Run Integration Tests Only
// turbo
1. Run Jest with the integration folder:
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/integration
```

## Test Files

Integration tests are located in:
- `tests/integration/DataMapper.integration.test.js` — Data transformation round-trips
- `tests/integration/ServiceLayer.integration.test.js` — Service layer workflows

## Notes
- All tests use Jest with `jsdom` environment
- Integration tests test multiple modules working together
- Use `npm test` for full test suite before committing
