/**
 * Unit Tests for SemanticSearch
 */

import { SemanticSearch } from '../src/core/SemanticSearch.js';
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';
import { jest } from '@jest/globals';

describe('SemanticSearch', () => {
    let service;
    let mockPipe;

    beforeEach(() => {
        service = new SemanticSearch();
        mockPipe = jest.fn();
        pipeline.mockReset();
    });

    describe('init', () => {
        test('loads model successfully', async () => {
            pipeline.mockResolvedValue(mockPipe);

            const result = await service.init();

            expect(result).toBe(true);
            expect(service.isAvailable()).toBe(true);
            expect(pipeline).toHaveBeenCalledWith('feature-extraction', expect.any(String));
        });

        test('handles loading failure', async () => {
            pipeline.mockRejectedValue(new Error('Load failed'));

            const result = await service.init();

            expect(result).toBe(false);
            expect(service.isAvailable()).toBe(false);
        });

        test('returns true if already loaded', async () => {
            service.isLoaded = true;
            const result = await service.init();
            expect(result).toBe(true);
            expect(pipeline).not.toHaveBeenCalled();
        });
    });

    describe('embed', () => {
        beforeEach(async () => {
            pipeline.mockResolvedValue(mockPipe);
            await service.init();
        });

        test('returns embedding vector', async () => {
            const mockOutput = { data: [0.1, 0.2, 0.3] };
            mockPipe.mockResolvedValue(mockOutput);

            const result = await service.embed('text');

            expect(result).toEqual([0.1, 0.2, 0.3]);
            expect(mockPipe).toHaveBeenCalledWith('text', expect.objectContaining({ pooling: 'mean' }));
        });

        test('returns null on failure', async () => {
            mockPipe.mockRejectedValue(new Error('Embed failed'));
            const result = await service.embed('text');
            expect(result).toBeNull();
        });

        test('returns null if not loaded', async () => {
            service.isLoaded = false;
            service.pipe = null;
            const result = await service.embed('text');
            expect(result).toBeNull();
        });
    });

    describe('cosineSimilarity', () => {
        test('calculates correct dot product', () => {
            const vecA = [1, 0, 0];
            const vecB = [0.5, 0.5, 0];
            // 1*0.5 + 0 + 0 = 0.5
            expect(service.cosineSimilarity(vecA, vecB)).toBe(0.5);
        });

        test('returns 0 for mismatched lengths', () => {
            expect(service.cosineSimilarity([1], [1, 2])).toBe(0);
        });
    });

    describe('search', () => {
        beforeEach(async () => {
            pipeline.mockResolvedValue(mockPipe);
            await service.init();
        });

        test('ranks results by score', async () => {
            // Mock embedding for query
            mockPipe.mockResolvedValueOnce({ data: [1, 0, 0] }); // Query vector
            service.setThreshold(0); // Ensure all valid scores are returned

            // Mock embeddings already exist on prompts
            const prompts = [
                { id: '1', embedding: [0, 1, 0] }, // Score 0
                { id: '2', embedding: [1, 0, 0] }, // Score 1
                { id: '3', embedding: [0.5, 0.5, 0] } // Score 0.5
            ];

            // Mock embed call inside search
            // The service calls embed(query) internally. 
            // We mocked the pipe output above for that single call.

            const results = await service.search('query', prompts);

            expect(results.length).toBe(3);
            expect(results[0].id).toBe('2');
            expect(results[1].id).toBe('3');
            expect(results[2].id).toBe('1');
        });

        test('filters filters by threshold', async () => {
            mockPipe.mockResolvedValueOnce({ data: [1, 0, 0] });
            service.setThreshold(0.8);

            const prompts = [
                { id: '1', embedding: [0.1, 0, 0] },
                { id: '2', embedding: [0.9, 0, 0] }
            ];

            const results = await service.search('query', prompts);
            expect(results.length).toBe(1);
            expect(results[0].id).toBe('2');
        });
    });
});
