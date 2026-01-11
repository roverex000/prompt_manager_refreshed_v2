---
trigger: always_on
---

trigger: always_on
Engineering Principles & Best Practices
These are the foundational principles that guide how we build software. They apply to any project and should shape your thinking, not just your code.

1. Separation of Concerns
Each module should have one responsibility and one reason to change.

Data/Persistence: How we store and retrieve information
Business Logic: The rules and transformations that make the app work
UI/Interaction: What the user sees and how they interact
Never mix these in the same file. A UI component should not contain database calls. A service should not manipulate the DOM.

2. Layered Architecture (Clean Architecture)
Dependencies flow inward:

UI Layer (app.js, components)
      ↓ depends on
Business Logic Layer (services)
      ↓ depends on
Data Layer (repositories)
      ↓ depends on
Core Domain (models, interfaces)
Core logic never depends on outer layers. This means your business logic doesn't break when you change the UI framework or swap storage backends.

3. Repository Pattern (Storage Abstraction)
Abstract storage behind a uniform interface:

// Interface (what callers see)
repo.save(item)
repo.getAll()
repo.delete(id)
// Implementations (hidden details)
IndexedDBRepo, VaultRepo, CloudRepo...
This allows swapping storage backends without touching business logic.

4. Feature Modularity & Graceful Degradation
Optional features (semantic search, vault mode) should be encapsulated as modules
If a feature fails to load, the core app should still work
Encapsulate third-party dependencies so failures don't cascade
5. Testability by Design
Write code that can be tested in isolation:

Business logic in pure functions (no side effects)
External dependencies injected, not hardcoded
UI is a thin wrapper over tested logic
If you can't test something without the browser, DOM, or network, refactor it.

6. DRY (Don't Repeat Yourself)
Logic should exist in exactly one place.

If you copy-paste code, extract it into a utility. Duplication means bugs get fixed in one place and missed in another.

7. Async Operations & Performance
Heavy operations (embedding, bulk I/O) must be async
Never block the main thread
Show loading indicators for operations >200ms
Use async/await with proper error handling
8. Accessibility & Responsive Design
Use semantic HTML (<button>, <main>, <article>)
Ensure keyboard navigation works
Never remove focus outlines without replacement
Use relative units and responsive layouts
9. Code Hygiene
Consistent naming: camelCase for JS, kebab-case for CSS
Clear interfaces: function signatures should be self-documenting
Minimal coupling: modules should know as little about each other as possible
Comments explain WHY, not what
10. Version Control Discipline
Small, focused commits (one logical change per commit)
Meaningful commit messages
Feature branches merged only when tests pass