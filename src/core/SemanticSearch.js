/**
 * Semantic Search Module
 * Handles AI-powered embedding generation and similarity search.
 * Uses Xenova Transformers for browser-based inference.
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';

// Configure for browser usage
env.allowLocalModels = false;
env.useBrowserCache = true;

class SemanticSearch {
    constructor() {
        this.pipe = null;
        this.modelName = 'Xenova/all-MiniLM-L6-v2';
        this.isLoaded = false;
        this.isLoading = false;
        this.loadError = null;
        this.minScore = 0.25; // Default threshold
    }

    setThreshold(val) {
        this.minScore = parseFloat(val);
    }

    /**
     * Initialize the embedding model.
     * Can be called multiple times safely - will only load once.
     * @returns {Promise<boolean>} True if model loaded successfully
     */
    async init() {
        if (this.isLoaded) return true;
        if (this.isLoading) return false;

        this.isLoading = true;
        this.loadError = null;
        console.log("Loading Semantic Model...");

        try {
            this.pipe = await pipeline('feature-extraction', this.modelName);
            this.isLoaded = true;
            console.log("Semantic Model Loaded.");
            return true;
        } catch (e) {
            this.loadError = e;
            console.error("Failed to load semantic model:", e);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Check if semantic search is available
     * @returns {boolean}
     */
    isAvailable() {
        return this.isLoaded && !this.loadError;
    }

    /**
     * Generate embedding for a single text
     * @param {string} text - Text to embed
     * @returns {Promise<number[]|null>} Embedding vector or null
     */
    async embed(text) {
        if (!this.pipe || !text) return null;

        try {
            const output = await this.pipe(text, { pooling: 'mean', normalize: true });
            return Array.from(output.data);
        } catch (e) {
            console.error("Embedding failed:", e);
            return null;
        }
    }

    /**
     * Compute cosine similarity between two vectors
     * @param {number[]} vecA 
     * @param {number[]} vecB 
     * @returns {number} Similarity score (0-1 for normalized vectors)
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dot = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
        }
        return dot; // Assumes normalized vectors
    }

    /**
     * Search prompts by semantic similarity to a query
     * @param {string} query - Search query text
     * @param {Array} prompts - Array of prompt objects with embedding field
     * @param {number} topK - Maximum results to return
     * @returns {Promise<Array<{id: string, score: number}>>} Ranked results
     */
    async search(query, prompts, topK = 50) {
        if (!this.isLoaded) return [];

        const queryVec = await this.embed(query);
        if (!queryVec) return [];

        const scored = prompts
            .filter(p => p.embedding) // Must have embedding
            .map(p => ({
                id: p.id,
                score: this.cosineSimilarity(queryVec, p.embedding)
            }))
            .filter(result => result.score >= this.minScore);

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }

    /**
     * Build embedding text from prompt fields for indexing
     * @param {object} prompt - Prompt object
     * @returns {string} Concatenated text for embedding
     */
    buildEmbeddingText(prompt) {
        return `${prompt.title || ''} ${prompt.description || ''} ${prompt.notes || ''} ${prompt.prompt_text || ''}`;
    }
}

export { SemanticSearch };
