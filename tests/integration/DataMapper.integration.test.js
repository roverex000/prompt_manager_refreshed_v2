/**
 * Integration Tests: DataMapper
 * Tests data transformation between internal and external formats.
 */

import { describe, test, expect } from '@jest/globals';
import {
    promptToExport,
    promptFromImport,
    templateToExport,
    templateFromImport
} from '../../src/data/DataMapper.js';

describe('DataMapper Integration', () => {

    describe('Prompt Transformation', () => {
        const internalPrompt = {
            id: 'p123',
            title: 'My Prompt',
            description: 'A description',
            prompt_text: 'Hello world',
            tags: 'ai,test',
            status: 'live',
            notes: 'Some notes',
            category: 'General',
            client: 'Acme',
            date_created: '2024-01-01T00:00:00Z',
            versions: [{ version_no: 1, prompt_text: 'v1' }],
            embedding: [0.1, 0.2, 0.3]
        };

        test('should round-trip prompt through export/import', () => {
            const exported = promptToExport(internalPrompt);
            const reimported = promptFromImport(exported);

            expect(reimported.id).toBe(internalPrompt.id);
            expect(reimported.title).toBe(internalPrompt.title);
            expect(reimported.prompt_text).toBe(internalPrompt.prompt_text);
            expect(reimported.embedding).toEqual(internalPrompt.embedding);
        });

        test('should handle legacy import format', () => {
            const legacyFormat = {
                prompt_id: 'legacy-1',
                prompt_title: 'Legacy Title',
                prompt_desc: 'Legacy desc',
                prompt_text: 'Legacy text',
                prompt_status: 'draft'
            };

            const imported = promptFromImport(legacyFormat);

            expect(imported.id).toBe('legacy-1');
            expect(imported.title).toBe('Legacy Title');
            expect(imported.description).toBe('Legacy desc');
            expect(imported.status).toBe('draft');
        });

        test('should provide defaults for missing fields', () => {
            const minimal = { prompt_text: 'Just text' };
            const imported = promptFromImport(minimal);

            expect(imported.id).toBeDefined();
            expect(imported.title).toBe('Untitled');
            expect(imported.status).toBe('draft');
            expect(imported.versions).toEqual([]);
            expect(imported.embedding).toBeNull();
        });
    });

    describe('Template Transformation', () => {
        const internalTemplate = {
            id: 't456',
            description: 'My Template',
            template_text: 'Hello ${name}',
            notes: 'Template notes',
            is_favourite: true,
            order: 5
        };

        test('should round-trip template through export/import', () => {
            const exported = templateToExport(internalTemplate);
            const reimported = templateFromImport(exported);

            expect(reimported.id).toBe(internalTemplate.id);
            expect(reimported.description).toBe(internalTemplate.description);
            expect(reimported.template_text).toBe(internalTemplate.template_text);
            expect(reimported.is_favourite).toBe(true);
        });

        test('should handle legacy template format', () => {
            const legacy = {
                template_id: 'legacy-t1',
                template_desc: 'Old Template',
                template_text: 'Old text',
                template_notes: 'Old notes',
                isFavorite: true
            };

            const imported = templateFromImport(legacy);

            expect(imported.id).toBe('legacy-t1');
            expect(imported.description).toBe('Old Template');
            expect(imported.notes).toBe('Old notes');
            expect(imported.is_favourite).toBe(true);
        });
    });
});
