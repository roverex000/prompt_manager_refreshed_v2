import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { App } from '../app.js';

// Mock dependencies
jest.mock('../src/repo/IndexedDBRepo.js');
jest.mock('../src/repo/VaultRepo.js');
jest.mock('../src/core/SemanticSearch.js');
jest.mock('../src/core/PromptService.js');
jest.mock('../src/core/TemplateService.js');
jest.mock('../src/core/CollectionService.js');
jest.mock('../src/ui/SidebarRenderer.js');
jest.mock('../src/ui/TemplatePickerUI.js');

describe('App.filterAndSortPrompts', () => {
    let app;
    let mockPrompts;

    beforeEach(() => {
        // Mock DOM elements required by App constructor
        document.body.innerHTML = `
            <div id="prompt-list"></div>
            <div id="collection-list"></div>
            <div id="editor-container"></div>
            <div id="empty-state"></div>
            <div id="dirty-indicator"></div>
            <input type="checkbox" id="toggle-semantic-mode" />
            
            <input id="edit-title" />
            <input id="edit-description" />
            <input id="edit-category" />
            <input id="edit-client" />
            <select id="edit-status"></select>
            <textarea id="edit-prompt-text"></textarea>
            <input id="edit-tags" />
            <textarea id="edit-notes"></textarea>

            <input id="search-input" />
            <select id="filter-category"></select>
            <select id="filter-client"></select>
            <select id="filter-status"></select>
            <select id="filter-sort"></select>
        `;

        app = new App();

        // Setup initial state
        mockPrompts = [
            { id: '1', title: 'Alpha', category: 'Coding', client: 'Client A', status: 'live', date_created: '2025-01-01T10:00:00Z', prompt_text: 'Code stuff', tags: 'js' },
            { id: '2', title: 'Beta', category: 'Writing', client: 'Client B', status: 'draft', date_created: '2025-01-02T10:00:00Z', prompt_text: 'Write stuff', tags: 'copy' },
            { id: '3', title: 'Gamma', category: 'Coding', client: 'Client A', status: 'draft', date_created: '2025-01-03T10:00:00Z', prompt_text: 'More code', tags: 'python' }
        ];

        app.state.prompts = mockPrompts;
        app.state.filter = { search: '', category: '', client: '', status: '', sort: 'date-desc' };
        app.state.semanticMode = false;

        // Mock Semantic Search
        app.semantic = {
            isLoaded: true,
            search: jest.fn().mockResolvedValue([])
        };
    });

    test('should return all prompts when no filters set', async () => {
        const result = await app.filterAndSortPrompts();
        expect(result).toHaveLength(3);
        // Default sort is date-desc
        expect(result[0].id).toBe('3');
        expect(result[1].id).toBe('2');
        expect(result[2].id).toBe('1');
    });

    test('should filter by category', async () => {
        app.state.filter.category = 'Coding';
        const result = await app.filterAndSortPrompts();
        expect(result).toHaveLength(2);
        expect(result.map(p => p.id)).toEqual(expect.arrayContaining(['1', '3']));
    });

    test('should filter by client', async () => {
        app.state.filter.client = 'Client B';
        const result = await app.filterAndSortPrompts();
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
    });

    test('should filter by status', async () => {
        app.state.filter.status = 'live';
        const result = await app.filterAndSortPrompts();
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    test('should search by keyword (title/content)', async () => {
        app.state.filter.search = 'code';
        const result = await app.filterAndSortPrompts();
        expect(result).toHaveLength(2); // Alpha (Code stuff), Gamma (More code)
    });

    test('should sort by date ascending', async () => {
        app.state.filter.sort = 'date-asc';
        const result = await app.filterAndSortPrompts();
        expect(result.map(p => p.id)).toEqual(['1', '2', '3']);
    });

    test('should sort by name ascending', async () => {
        app.state.filter.sort = 'name-asc';
        const result = await app.filterAndSortPrompts();
        expect(result.map(p => p.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    test('should use semantic search when enabled', async () => {
        app.state.semanticMode = true;
        app.state.filter.search = 'coding tasks';

        // Mock semantic results to return specific scores
        // Say Gamma (id 3) matches best, then Alpha (id 1)
        app.semantic.search.mockResolvedValue([
            { id: '3', score: 0.9 },
            { id: '1', score: 0.8 }
        ]);

        const result = await app.filterAndSortPrompts();

        expect(app.semantic.search).toHaveBeenCalledWith('coding tasks', mockPrompts);

        // Should return sorted by score
        // Only items in the prompt list are returned (mockPrompts has 3 items)
        // If semantic returns subset, do we filter others? 
        // Logic says: "We want to persist the items that match the filters, but re-order them by score."
        // And "Items not in semantic results (score 0) will drop to bottom."

        expect(result).toHaveLength(3);
        expect(result[0].id).toBe('3'); // Score 0.9
        expect(result[1].id).toBe('1'); // Score 0.8
        expect(result[2].id).toBe('2'); // Score 0 (default)
    });

    test('should combine keyword filter (category) with semantic sort', async () => {
        app.state.semanticMode = true;
        app.state.filter.search = 'some query'; // Triggers semantic path
        app.state.filter.category = 'Coding';   // Should filter out 'Beta' (Writing)

        app.semantic.search.mockResolvedValue([
            { id: '3', score: 0.9 },
            { id: '1', score: 0.8 },
            { id: '2', score: 0.5 } // Beta results, but should be filtered out by category
        ]);

        const result = await app.filterAndSortPrompts();

        expect(result).toHaveLength(2); // Beta removed
        expect(result[0].id).toBe('3');
        expect(result[1].id).toBe('1');
    });
});
