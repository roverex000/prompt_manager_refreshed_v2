/**
 * Unit Tests for PromptService
 */

import {
    createPrompt,
    createVersion,
    findVersion,
    filterPrompts,
    sortPrompts,
    keywordSearch,
    extractCategories,
    extractClients,
    duplicatePrompt
} from '../src/core/PromptService.js';

// Mock ID generator
const mockGenerateId = () => '_test123';

describe('PromptService', () => {

    describe('createPrompt', () => {
        test('creates a prompt with default values', () => {
            const prompt = createPrompt(mockGenerateId);

            expect(prompt.id).toBe('_test123');
            expect(prompt.title).toBe('New Prompt');
            expect(prompt.status).toBe('draft');
            expect(prompt.versions).toEqual([]);
            expect(prompt.embedding).toBeNull();
        });

        test('sets date_created to current time', () => {
            const before = new Date().toISOString();
            const prompt = createPrompt(mockGenerateId);
            const after = new Date().toISOString();

            expect(prompt.date_created >= before).toBe(true);
            expect(prompt.date_created <= after).toBe(true);
        });
    });

    describe('createVersion', () => {
        test('creates first version with version_no 1', () => {
            const prompt = { versions: [], prompt_text: 'test', notes: 'note' };
            const version = createVersion(prompt);

            expect(version.version_no).toBe(1);
            expect(version.prompt_text).toBe('test');
            expect(version.notes).toBe('note');
        });

        test('increments version_no based on existing versions', () => {
            const prompt = {
                versions: [{ version_no: 1 }, { version_no: 2 }],
                prompt_text: 'v3',
                notes: ''
            };
            const version = createVersion(prompt);

            expect(version.version_no).toBe(3);
        });
    });

    describe('findVersion', () => {
        test('finds version by number', () => {
            const prompt = {
                versions: [
                    { version_no: 1, notes: 'first' },
                    { version_no: 2, notes: 'second' }
                ]
            };

            expect(findVersion(prompt, 1).notes).toBe('first');
            expect(findVersion(prompt, 2).notes).toBe('second');
            expect(findVersion(prompt, 3)).toBeUndefined();
        });
    });

    describe('filterPrompts', () => {
        const prompts = [
            { id: '1', category: 'coding', client: 'acme', status: 'live' },
            { id: '2', category: 'coding', client: 'beta', status: 'draft' },
            { id: '3', category: 'writing', client: 'acme', status: 'live' }
        ];

        test('filters by category', () => {
            const result = filterPrompts(prompts, { category: 'coding' });
            expect(result.length).toBe(2);
        });

        test('filters by client', () => {
            const result = filterPrompts(prompts, { client: 'acme' });
            expect(result.length).toBe(2);
        });

        test('filters by multiple criteria', () => {
            const result = filterPrompts(prompts, { category: 'coding', status: 'live' });
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('1');
        });

        test('returns all when no filters', () => {
            const result = filterPrompts(prompts, {});
            expect(result.length).toBe(3);
        });
    });

    describe('sortPrompts', () => {
        const prompts = [
            { title: 'Zebra', date_created: '2024-01-01' },
            { title: 'Apple', date_created: '2024-03-01' },
            { title: 'Mango', date_created: '2024-02-01' }
        ];

        test('sorts by name ascending', () => {
            const result = sortPrompts(prompts, 'name-asc');
            expect(result[0].title).toBe('Apple');
            expect(result[2].title).toBe('Zebra');
        });

        test('sorts by date descending', () => {
            const result = sortPrompts(prompts, 'date-desc');
            expect(result[0].title).toBe('Apple'); // March = newest
        });
    });

    describe('keywordSearch', () => {
        const prompts = [
            { title: 'Tweet Generator', description: 'Create tweets', prompt_text: '', tags: 'social', notes: '' },
            { title: 'Email Writer', description: 'Write emails', prompt_text: '', tags: 'business', notes: '' }
        ];

        test('finds matches in title', () => {
            const result = keywordSearch(prompts, 'tweet');
            expect(result.length).toBe(1);
        });

        test('finds matches in tags', () => {
            const result = keywordSearch(prompts, 'social');
            expect(result.length).toBe(1);
        });

        test('is case-insensitive', () => {
            const result = keywordSearch(prompts, 'EMAIL');
            expect(result.length).toBe(1);
        });

        test('returns all when empty query', () => {
            const result = keywordSearch(prompts, '');
            expect(result.length).toBe(2);
        });
    });

    describe('extractCategories', () => {
        test('extracts unique categories', () => {
            const prompts = [
                { category: 'coding' },
                { category: 'writing' },
                { category: 'coding' },
                { category: '' }
            ];
            const result = extractCategories(prompts);
            expect(result).toEqual(['coding', 'writing']);
        });
    });

    describe('duplicatePrompt', () => {
        test('creates a copy with new ID and COPY prefix', () => {
            const original = {
                id: 'original_id',
                title: 'My Prompt',
                description: 'Desc',
                prompt_text: 'Text',
                tags: 'tag1',
                status: 'live',
                notes: 'Notes',
                category: 'Cat',
                client: 'Client',
                date_created: '2024-01-01',
                versions: [{ version_no: 1 }],
                embedding: [0.1, 0.2]
            };

            const duplicate = duplicatePrompt(original, mockGenerateId);

            expect(duplicate.id).toBe('_test123');
            expect(duplicate.title).toBe('COPY My Prompt');
            expect(duplicate.description).toBe('Desc');
            expect(duplicate.prompt_text).toBe('Text');
            expect(duplicate.tags).toBe('tag1');
            expect(duplicate.status).toBe('draft'); // Should reset to draft? Requirement didn't specify but plan assumed draft. Let's assume draft as per plan 'Status=Draft'.
            expect(duplicate.category).toBe('Cat');
            expect(duplicate.client).toBe('Client');
            expect(duplicate.versions).toEqual([]); // Should start fresh
            expect(duplicate.versions).toEqual([]); // Should start fresh

            // CRITICAL: New prompt text needs re-vectoring. 
            // The service MUST reset embedding to null to signal the controller to generate a new one.
            expect(duplicate.embedding).toBeNull();

            // Ensure deep copy
            duplicate.title = 'Changed';
            expect(original.title).toBe('My Prompt');
        });
    });
});
