/**
 * Unit Tests for TemplateService
 */

import {
    createTemplate,
    duplicateTemplate,
    extractVariables,
    substituteVariables,
    filterTemplates,
    sortTemplates
} from '../src/core/TemplateService.js';

const mockGenerateId = () => '_tmpl123';

describe('TemplateService', () => {

    describe('createTemplate', () => {
        test('creates template with default values', () => {
            const template = createTemplate(mockGenerateId);

            expect(template.id).toBe('_tmpl123');
            expect(template.description).toBe('New Template');
            expect(template.is_favourite).toBe(false);
        });
    });

    describe('duplicateTemplate', () => {
        test('creates copy with new ID and "(Copy)" suffix', () => {
            const original = { id: 'old', description: 'My Template', template_text: 'content' };
            const copy = duplicateTemplate(original, mockGenerateId);

            expect(copy.id).toBe('_tmpl123');
            expect(copy.description).toBe('My Template (Copy)');
            expect(copy.template_text).toBe('content');
        });
    });

    describe('extractVariables', () => {
        test('extracts ${var} patterns', () => {
            const text = 'Hello ${name}, your order ${orderId} is ready';
            const vars = extractVariables(text);

            expect(vars).toEqual(['name', 'orderId']);
        });

        test('returns unique variables only', () => {
            const text = '${name} said hello to ${name}';
            const vars = extractVariables(text);

            expect(vars).toEqual(['name']);
        });

        test('returns empty array for no variables', () => {
            const vars = extractVariables('Plain text with no variables');
            expect(vars).toEqual([]);
        });
    });

    describe('substituteVariables', () => {
        test('replaces variables with values', () => {
            const text = 'Hello ${name}, you are ${age} years old';
            const result = substituteVariables(text, { name: 'Alice', age: '30' });

            expect(result).toBe('Hello Alice, you are 30 years old');
        });

        test('keeps placeholder if no value provided', () => {
            const text = 'Hello ${name}';
            const result = substituteVariables(text, {});

            expect(result).toBe('Hello ${name}');
        });
    });

    describe('filterTemplates', () => {
        const templates = [
            { description: 'Email Template', template_text: 'Dear...' },
            { description: 'Tweet Generator', template_text: 'Check out...' }
        ];

        test('filters by description', () => {
            const result = filterTemplates(templates, 'email');
            expect(result.length).toBe(1);
        });

        test('filters by content', () => {
            const result = filterTemplates(templates, 'dear');
            expect(result.length).toBe(1);
        });
    });

    describe('sortTemplates', () => {
        test('sorts favourites first', () => {
            const templates = [
                { description: 'B', is_favourite: false, order: 0 },
                { description: 'A', is_favourite: true, order: 0 }
            ];
            const result = sortTemplates(templates);

            expect(result[0].description).toBe('A');
        });
    });
});
