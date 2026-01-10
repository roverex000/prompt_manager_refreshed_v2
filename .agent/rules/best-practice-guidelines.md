---
trigger: always_on
---

System Instructions & Best-Practice Guidelines
# 1. Fundamental Architectural Principles to Follow
## 1.1 Separation of Concerns (SoC) & Single Responsibility Principle (SRP)
- Design each module so it has one responsibility, and one reason to change. 
- Separate distinct concerns: data model / persistence, business logic, UI rendering / user interaction, external dependencies (e.g. embedding model).
- Avoid mixing storage logic, UI logic, and business logic together in the same file/class.

## 1.2 Layered / Clean Architecture (Domain-driven, with well-defined layers)
- Organise code into layers: a core “domain/business logic” layer, a data access (repository/storage) layer, and a UI (presentation + interaction) layer. Outer adaptations (e.g. embedding model, file-vault, external APIs) should be kept at the outermost layers. 
- Dependencies should flow inward: outer layers (UI, storage adapters, third-party integrations) depend on inner layers (domain logic, data model), but not vice-versa. This ensures core logic remains independent of UI frameworks or storage backends. 

## 1.3 Component- / Module-based Structure (even without a heavy framework)
- Divide the application into small, logically coherent modules or components (each responsible for one piece of UI or one domain function). This supports reusability, easier maintenance, and simpler testing. 
PixelFreeStudio Blog -
- Ensure UI modules (views, controllers) are thin wrappers over domain logic; the domain logic should not depend on UI code.

## 1.4 Data Model and Schema Defined Upfront (but with flexibility)
- Define a clear data schema from the start (e.g. prompt entity, version history, metadata, tags, workspace or client context, chain/flow references).
- Build the data model in a way that supports future extension (e.g. adding metadata, tags, prompt-chain references) without breaking backward compatibility.

## 1.5 Storage Abstraction (Repository Pattern)
- Abstract storage behind a uniform interface (e.g. PromptRepo.save(), PromptRepo.fetchAll(), PromptRepo.delete()), hiding implementation details (IndexedDB, file-vault, localStorage, etc.).
- This allows swapping or extending storage backends without touching business logic or UI code.

## 1.6 Feature Modularity and Optionality
- Treat optional or “heavy” features (e.g. semantic search / embedding, file-vault mode) as modules that can be enabled or disabled. The core app should function even if such features fail or are not supported.
- Encapsulate third-party dependencies (e.g. embedding models, external libraries) within modules so failures or updates do not cascade into the core logic.

## 1.7 Testability & Maintainability
- Write business logic in isolation from UI so that modules can be unit-tested (and later integration- or end-to-end tested) without relying on DOM or external dependencies. Clean architecture supports this. 
- Maintain code hygiene: consistent naming, clear interfaces, minimal coupling, no duplication, clear documentation or module-level comments.
- Use version control, meaningful commits, and code reviews (if multiple developers).

## 1.8 Performance & Scalability Awareness
- Design data flow and operations to scale: e.g. persistence and retrieval should handle hundreds/thousands of prompts without performance collapse (use pagination, background indexing, lazy loading where appropriate).
- For UI, ensure responsiveness: avoid blocking main thread for heavy operations (e.g. embedding computation), handle async tasks properly, provide feedback / loading indicators.

## 1.9 Accessibility and Responsive UI Design
- Use scalable layout techniques (flex, grid, relative units, responsive breakpoints) rather than fixed viewport-height divisions.
- Ensure UI remains usable across screen sizes (desktop, small laptop, tablet) and supports keyboard navigation / focus outlines / accessibility standards.
- Avoid globally disabling default browser accessibility features (e.g. focus outlines).

# 2. Recommended Project Structure (Folder / Module Layout)

Your project folder should reflect logical separation. For example:

/src
  /domain
    prompt/
      Prompt.js              # Prompt entity / model definition
      PromptService.js       # Business logic (create, update, version, clone, metadata, prompt-chain, validation)
    template/
      Template.js
      TemplateService.js
    chain/                   # (optional) workflow-chain / prompt-flow logic
      Chain.js
      ChainService.js
  /storage
    IndexedDBRepo.js         # Implementation of repository interface for IndexedDB
    VaultRepo.js             # Implementation for File System API vault mode
    RepositoryInterface.js   # Interface (or abstract class) that defines contract for storage
  /search
    SemanticSearch.js        # Embedding model loading, indexing, searching logic
  /ui
    components/              # UI components
      PromptList.js
      PromptEditor.js
      TemplateManager.js
      ChainView.js           # if supporting prompt-chain UI
      Modal.js               # generic modal/dialog components
    controllers/
      MainController.js      # glue UI and domain logic, orchestrate app flows
    utils/
      DOMUtils.js            # DOM helper functions
  /utils
    diff.js                  # diff & merge logic
    dateUtils.js             # date/time helpers (created, modified, last used)
    validation.js            # input validation logic
    clipboard.js             # clipboard helpers
  index.js                   # App entry point, bootstrap, initialisation
  config.js                  # Configuration, constants, feature flags (e.g. enableSearch, vaultMode, etc.)


## Rationale:
- The domain folder hosts all business rules and data-models, independent of storage or UI.
- The storage folder abstracts persistence implementations behind a common interface — switching from IndexedDB to another store in future is straightforward.
- The search folder encapsulates the semantic search feature; if disabled or broken, core app remains functional.
- The ui folder contains only UI and interaction logic: rendering, event handling, user-driven flows — no business logic or storage code directly.
- Shared utilities and helpers are placed separately to avoid duplication.

This structure aligns with component-based architecture and layered / clean architecture best practices. 

# 3. Recommended Development Workflow & Practices

To ensure code quality and maintainability:

## Start with domain and storage abstraction before UI features
- First define data models and repository interface.
- Implement storage backend (IndexedDB, vault) behind that interface.
- Write domain services (prompt creation, versioning, template substitution) that only rely on domain & storage interface.
- Build UI only after domain logic is stable.

## Write unit tests for core logic (domain + storage) early
- PromptService: create, update, version history, clone, metadata.
- TemplateService: variable substitution, validation.
- StorageRepo: CRUD tests to ensure data consistency.
- (Optional) SemanticSearch module: test embedding logic separately (mocking model) to ensure correct indexing / search behaviour.

This ensures regressions are caught early and refactoring becomes safer. Clean architecture greatly facilitates testability. 

## Feature toggles for optional / heavy modules
- Use configuration flags (in config.js) to turn on/off features like semantic search, vault mode, prompt-chains, etc.
- On startup, application should detect whether dependencies (e.g. File System API, embedding model) are available; if not, degrade gracefully.

## Async operations and performance handling
- Heavy tasks (e.g. embedding generation, bulk indexing, large storage reads) should be asynchronous; UI should stay responsive with loading indicators or progress feedback.
- Avoid blocking the main thread. Use async/await, promises, or Web Workers if needed.

## Avoid duplication and code smells
- Don’t copy/paste code — extract repeated logic into helpers / utility modules.
- Adhere to DRY (don’t repeat yourself) and keep modules small and focused.

## Code styling, linting, documentation
- Use a linter (ESLint or similar) to enforce consistency, catch errors early, avoid common pitfalls.
- Document module boundaries and interfaces: e.g. in README or in code comments for services / repos.
- Use meaningful naming, clear parameter interfaces, and avoid implicit dependencies between modules.

## Version control discipline and commit granularity
- Make small, incremental commits that reflect one logical change at a time.
- For each new feature or refactor, create a separate branch; integrate only when tests and QA pass.

## 4. Additional Best-Practice Recommendations (Future-proofing / Scalability / Maintainability)
- Use a modular component-based UI even without a framework: Even if building in plain JS / HTML / CSS, treat UI pieces as independent components (with clear props, state, lifecycle) rather than ad-hoc DOM manipulations. This eases future migration to a framework (e.g. React / Vue) if needed. 
- Plan for extensibility: design data models and services anticipating future features: tagging / metadata, prompt-chains, prompt-variants, export/import, collaboration, multi-workspace support, etc. Avoid “hard-coding” assumptions like “only one prompt version history per prompt.”
- Isolate external dependencies: third-party libraries (e.g. embedding models) should be used behind an interface so they can be replaced without rewriting core logic — ensures longevity and easier maintenance.
- Graceful degradation and fallback: if a feature fails (e.g. storage backend fails, embedding model fails to load), the rest of the app should continue functioning, with clear user feedback.
- Accessibility & responsiveness by default: build UI with responsive layout (CSS flex/grid, relative units), keyboard navigation, focus states, and scalable design — not as an afterthought.