/**
 * Repository Interface
 * Defines the contract that all storage implementations must follow.
 * This enables swapping storage backends without changing business logic.
 *
 * @interface IRepository
 */

/**
 * Base class for repository implementations.
 * Provides default implementations that throw "not implemented" errors.
 * Concrete implementations (IndexedDBRepo, VaultRepo) should override all methods.
 */
class RepositoryInterface {
    /**
     * Initialize the repository connection
     * @returns {Promise<void>}
     */
    async init() {
        throw new Error('init() must be implemented');
    }

    // --- Prompts ---

    /**
     * Get all prompts
     * @returns {Promise<Array>}
     */
    async getAllPrompts() {
        throw new Error('getAllPrompts() must be implemented');
    }

    /**
     * Save a prompt (create or update)
     * @param {object} prompt
     * @returns {Promise<object>}
     */
    async savePrompt(_prompt) {
        throw new Error('savePrompt() must be implemented');
    }

    /**
     * Delete a prompt by ID
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deletePrompt(_id) {
        throw new Error('deletePrompt() must be implemented');
    }

    // --- Templates ---

    /**
     * Get all templates
     * @returns {Promise<Array>}
     */
    async getAllTemplates() {
        throw new Error('getAllTemplates() must be implemented');
    }

    /**
     * Save a template (create or update)
     * @param {object} template
     * @returns {Promise<object>}
     */
    async saveTemplate(_template) {
        throw new Error('saveTemplate() must be implemented');
    }

    /**
     * Delete a template by ID
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteTemplate(_id) {
        throw new Error('deleteTemplate() must be implemented');
    }

    // --- Collections ---

    /**
     * Get all collections
     * @returns {Promise<Array>}
     */
    async getAllCollections() {
        throw new Error('getAllCollections() must be implemented');
    }

    /**
     * Save a collection (create or update)
     * @param {object} collection
     * @returns {Promise<object>}
     */
    async saveCollection(_collection) {
        throw new Error('saveCollection() must be implemented');
    }

    /**
     * Delete a collection by ID
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteCollection(_id) {
        throw new Error('deleteCollection() must be implemented');
    }
}

export { RepositoryInterface };
