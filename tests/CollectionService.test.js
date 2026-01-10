/**
 * Unit Tests for CollectionService
 */

import {
    createCollection,
    validateFilters
} from '../src/core/CollectionService.js';

// Mock ID generator
const mockGenerateId = () => '_col123';

describe('CollectionService', () => {

    describe('createCollection', () => {
        test('creates collection with correct structure', () => {
            const filters = { category: 'coding' };
            const collection = createCollection(mockGenerateId, 'My Collection', filters);

            expect(collection.id).toBe('_col123');
            expect(collection.name).toBe('My Collection');
            expect(collection.filters).toEqual(filters);
            expect(collection.filters).not.toBe(filters); // Should be a copy
        });
    });

    describe('validateFilters', () => {
        test('validates when at least one filter is present', () => {
            expect(validateFilters({ category: 'coding' })).toBe(true);
            expect(validateFilters({ client: 'acme' })).toBe(true);
            expect(validateFilters({ status: 'live' })).toBe(true);
            expect(validateFilters({ search: 'query' })).toBe(true);
        });

        test('invalidates when no filters are set', () => {
            expect(validateFilters({})).toBe(false);
            expect(validateFilters({ other: 'field' })).toBe(false);
        });

        test('handles mixed valid/invalid fields', () => {
            expect(validateFilters({ category: '', client: 'acme' })).toBe(true);
        });
    });
});
