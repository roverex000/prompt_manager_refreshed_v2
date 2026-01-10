# Prompt Manager v3

A modular, browser-based AI prompt management application with semantic search capabilities.

## Features

- **Prompt Library**: Create, edit, version, and organize prompts
- **Template System**: Reusable templates with variable substitution
- **Smart Collections**: Filter-based dynamic prompt groupings
- **Semantic Search**: AI-powered similarity search (via Transformers.js)
- **Dual Storage**: IndexedDB (local) or File System API (vault mode)
- **Dark Mode**: System-aware theme with manual toggle

## Quick Start

1. Open `index.html` in a modern browser (Chrome/Edge recommended)
2. Create prompts, organize with categories/clients/tags
3. Toggle vault mode to persist to local files

## Project Structure

```
/
├── app.js                 # Main application entry & App class
├── index.html             # UI shell
├── src/
│   ├── config.js          # Constants & feature flags
│   ├── core/              # Business logic (no UI dependencies)
│   │   ├── PromptService.js
│   │   ├── TemplateService.js
│   │   ├── CollectionService.js
│   │   └── SemanticSearch.js
│   ├── repo/              # Storage layer
│   │   ├── RepositoryInterface.js
│   │   ├── IndexedDBRepo.js
│   │   └── VaultRepo.js
│   ├── data/              # Data transformation
│   │   └── DataMapper.js
│   ├── ui/                # UI components
│   │   ├── SidebarRenderer.js
│   │   ├── TemplatePickerUI.js
│   │   ├── Toast.js
│   │   └── ModalHelpers.js
│   ├── utils/             # Shared utilities
│   │   ├── Utils.js
│   │   └── Logger.js
│   └── styles/            # Modular CSS
│       ├── main.css       # Import manifest
│       └── modules/       # CSS partials
└── tests/                 # Jest unit tests
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed architectural documentation.

## Browser Requirements

- Chrome 86+ / Edge 86+ (File System Access API for vault mode)
- Any modern browser for IndexedDB mode
