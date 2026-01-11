# Project Rules & Standards
**Version:** 3.1  
**Purpose:** Specific thresholds, checklists, and templates for this project.

> **Note:** For foundational engineering principles, see `.agent/rules/best-practice-guidelines.md`

---

## 1. Directory Layout

| Folder | Purpose |
|--------|---------|
| **Root** | Config files only (`.eslintrc`, `package.json`, `README.md`) |
| `src/core/` | Business logic services (no UI dependencies) |
| `src/repo/` | Storage implementations (IndexedDB, Vault) |
| `src/ui/` | UI components and renderers |
| `src/utils/` | Shared utility functions |
| `src/styles/` | CSS with `variables.css` for tokens |
| `src/data/` | Data transformation (mappers) |
| `tests/` | Jest test files |
| `tests/mocks/` | Mock implementations for browser APIs |
| `docs/` | Documentation |

---

## 2. Tech Stack Standards

### HTML
- Use semantic elements: `<header>`, `<main>`, `<article>`, `<button>`
- Use `[data-js]` attributes for JS selection (not CSS classes)
- All interactive elements must be keyboard navigable

### CSS
- **BEM naming:** `.block__element--modifier`
- **No magic numbers:** Use CSS variables from `variables.css`
- Example: `padding: var(--spacing-md);` not `padding: 16px;`

### JavaScript
- `const` by default, `let` only when necessary, **never `var`**
- Use `async/await` with `try/catch` (not `.then()`)
- Use ES Modules exclusively (`import`/`export`)
- Use strict equality (`===`)

---

## 3. Testing Requirements

### Coverage Thresholds

| Layer | Minimum | Current |
|-------|---------|---------|
| `src/utils/` | 100% | ~12% |
| `src/core/` | 90% | ~86% |
| `src/repo/` | 80% | ~5% |
| `src/ui/` | 70% | ~18% |
| `app.js` | 60% | ~6% |

### Required Tests

**Unit Tests:**
- All service methods (CRUD, validation)
- All utility functions
- All data transformations

**Integration Tests:**
- Create → Save → Reload → Verify
- Import → Export → Re-import → Verify

**Edge Cases (mandatory):**
- Null/undefined inputs
- Empty strings/arrays
- Missing optional fields

### Mocking

Browser APIs must be mocked in `tests/mocks/`:
```
tests/mocks/
├── IndexedDBMock.js
├── FileSystemMock.js
└── transformers.js
```

### Workflow
- Run `npm test` before every commit
- Run `npm test -- --coverage` before every PR
- New `.js` files require corresponding `.test.js` files

---

## 4. Workflow: Plan-Act-Verify

1. **Plan:** List files to create/edit. Get approval if >3 files.
2. **Act:** Implement in small, atomic steps.
3. **Verify:** Run linter + tests. Check UI in browser if applicable.

---

## 5. Logging Standards

❌ Bad:
```javascript
console.log("Error", err)
```

✅ Good:
```javascript
console.error({ event: "FETCH_FAILED", endpoint: url, error: err.message })
```

---

## 6. Compliance Report Template

After every significant task, generate:

```yaml
COMPLIANCE_REPORT:
  Status: [PASS / FAIL]
  Architecture:
    - Modularity: [Checked]
    - Single Source of Truth: [Checked]
  Quality:
    - Tests Passed: [Yes/No]
    - Linting Passed: [Yes/No]
    - Coverage Delta: [+X% / -X%]
  Security:
    - Secrets Checked: [Yes/No]
    - Input Validation: [Yes/No]
  Self_Correction: "Description of any fixes made during verification."
```