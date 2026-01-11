---
trigger: always_on
---

# Architecture Overview

## Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (app.js)                    │
│  Event handling, DOM manipulation, state coordination   │
├─────────────────────────────────────────────────────────┤
│              UI Components (src/ui/)                    │
│  SidebarRenderer, TemplatePickerUI, Toast, Modals       │
├─────────────────────────────────────────────────────────┤
│             Business Logic (src/core/)                  │
│  PromptService, TemplateService, CollectionService      │
├─────────────────────────────────────────────────────────┤
│            Data & Storage (src/repo/, src/data/)        │
│  RepositoryInterface ← IndexedDBRepo, VaultRepo         │
│  DataMapper (import/export transformations)             │
├─────────────────────────────────────────────────────────┤
│          External Adapters (src/core/SemanticSearch)    │
│  Transformers.js embedding model                        │
└─────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Separation of Concerns
- **Core services** contain pure business logic (no DOM, no storage calls)
- **Repositories** handle persistence (IndexedDB, File System API)
- **UI modules** handle rendering (receive data, return HTML strings)

### 2. Repository Pattern
All storage implementations extend `RepositoryInterface`:

```javascript
class RepositoryInterface {
    async getAllPrompts() { }
    async savePrompt(prompt) { }
    async deletePrompt(id) { }
    // ... templates, collections
}
```

This allows swapping `IndexedDBRepo` ↔ `VaultRepo` without changing business logic.

### 3. Feature Modularity
- SemanticSearch initializes in background; app works without it
- VaultRepo degrades gracefully if File System API unavailable

## Data Flow

```
User Action → App.js → Service (validate/transform) → Repo (persist) → UI Update
```

## Module Dependencies

```
app.js
├── src/config.js
├── src/utils/Utils.js
├── src/data/DataMapper.js
├── src/core/*Service.js
├── src/repo/*Repo.js
└── src/ui/*.js
```

Dependencies flow **inward**: UI → Core → Data. Core modules have no UI dependencies.
