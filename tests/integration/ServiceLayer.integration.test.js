/**
 * Integration Tests: Service Layer
 * Tests business logic services with real data structures.
 */

import { describe, test, expect } from '@jest/globals';
import * as PromptService from '../../src/core/PromptService.js';
import * as TemplateService from '../../src/core/TemplateService.js';
import * as CollectionService from '../../src/core/CollectionService.js';

describe('Service Layer Integration', () => {

    describe('PromptService Workflows', () => {
        const generateId = () => 'test-' + Math.random().toString(36).substr(2, 9);

        test('should create, version, and filter prompts', () => {
            // Create prompts
            const p1 = PromptService.createPrompt(generateId);
            const p2 = PromptService.createPrompt(generateId);
            const p3 = PromptService.createPrompt(generateId);

            // Update with different categories
            PromptService.updatePromptFromForm(p1, { title: 'Alpha', category: 'A', status: 'live' });
            PromptService.updatePromptFromForm(p2, { title: 'Beta', category: 'B', status: 'draft' });
            PromptService.updatePromptFromForm(p3, { title: 'Gamma', category: 'A', status: 'draft' });

            const prompts = [p1, p2, p3];

            // Filter by category
            const catA = PromptService.filterPrompts(prompts, { category: 'A' });
            expect(catA).toHaveLength(2);

            // Filter by status
            const drafts = PromptService.filterPrompts(prompts, { status: 'draft' });
            expect(drafts).toHaveLength(2);

            // Combined filter
            const catADraft = PromptService.filterPrompts(prompts, { category: 'A', status: 'draft' });
            expect(catADraft).toHaveLength(1);
            expect(catADraft[0].title).toBe('Gamma');
        });

        test('should create version history', () => {
            const prompt = PromptService.createPrompt(generateId);
            prompt.prompt_text = 'Version 1 text';
            prompt.notes = 'Initial';

            // Create first version
            const v1 = PromptService.createVersion(prompt);
            prompt.versions.push(v1);

            prompt.prompt_text = 'Version 2 text';
            prompt.notes = 'Updated';

            // Create second version
            const v2 = PromptService.createVersion(prompt);
            prompt.versions.push(v2);

            expect(prompt.versions).toHaveLength(2);
            expect(v1.version_no).toBe(1);
            expect(v2.version_no).toBe(2);
            expect(PromptService.findVersion(prompt, 1).prompt_text).toBe('Version 1 text');
        });

        test('should sort prompts correctly', () => {
            const p1 = { title: 'Zebra', date_created: '2024-01-01T00:00:00Z' };
            const p2 = { title: 'Alpha', date_created: '2024-06-15T00:00:00Z' };
            const p3 = { title: 'Mango', date_created: '2024-03-10T00:00:00Z' };
            const prompts = [p1, p2, p3];

            const byName = PromptService.sortPrompts(prompts, 'name-asc');
            expect(byName.map(p => p.title)).toEqual(['Alpha', 'Mango', 'Zebra']);

            const byDateDesc = PromptService.sortPrompts(prompts, 'date-desc');
            expect(byDateDesc.map(p => p.title)).toEqual(['Alpha', 'Mango', 'Zebra']);

            const byDateAsc = PromptService.sortPrompts(prompts, 'date-asc');
            expect(byDateAsc.map(p => p.title)).toEqual(['Zebra', 'Mango', 'Alpha']);
        });

        test('should perform keyword search across fields', () => {
            const prompts = [
                { title: 'Email Template', description: 'For newsletters', prompt_text: 'Hello' },
                { title: 'Code Review', description: 'Technical', prompt_text: 'Review this code' },
                { title: 'Meeting Notes', description: 'Summarize', prompt_text: 'Meeting summary' }
            ];

            const results = PromptService.keywordSearch(prompts, 'email');
            expect(results).toHaveLength(1);

            const codeResults = PromptService.keywordSearch(prompts, 'code');
            expect(codeResults).toHaveLength(1); // 'Code Review' title (prompt_text has 'code' word)
        });
    });

    describe('TemplateService Workflows', () => {
        const generateId = () => 'tmpl-' + Math.random().toString(36).substr(2, 9);

        test('should create and apply templates', () => {
            const template = TemplateService.createTemplate(generateId);
            template.template_text = 'Hello ${name}, welcome to ${company}!';

            const variables = TemplateService.extractVariables(template.template_text);
            expect(variables).toContain('name');
            expect(variables).toContain('company');

            const applied = TemplateService.substituteVariables(template.template_text, {
                name: 'John',
                company: 'Acme'
            });
            expect(applied).toBe('Hello John, welcome to Acme!');
        });

        test('should duplicate template correctly', () => {
            const original = TemplateService.createTemplate(generateId);
            original.description = 'Original Template';
            original.template_text = 'Some text';
            original.is_favourite = true;

            const copy = TemplateService.duplicateTemplate(original, generateId);

            expect(copy.id).not.toBe(original.id);
            expect(copy.description).toBe('Original Template (Copy)');
            expect(copy.template_text).toBe(original.template_text);
            expect(copy.is_favourite).toBe(true); // Preserved on copy
        });
    });

    describe('CollectionService Workflows', () => {
        const generateId = () => 'coll-' + Math.random().toString(36).substr(2, 9);

        test('should create collection with current filter state', () => {
            const filterState = {
                search: 'keyword',
                category: 'AI',
                client: 'Acme',
                status: 'live'
            };

            const collection = CollectionService.createCollection(generateId, 'My AI Prompts', filterState);

            expect(collection.name).toBe('My AI Prompts');
            expect(collection.filters.category).toBe('AI');
            expect(collection.filters.status).toBe('live');
        });
    });
});
