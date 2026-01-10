/**
 * Collection Service Module
 * Business logic for smart collections.
 */

/**
 * Factory for creating new collection objects
 * @param {Function} generateId - ID generator function
 * @param {string} name - Collection name
 * @param {object} filters - Filter criteria to save
 * @returns {object} New collection
 */
function createCollection(generateId, name, filters) {
    return {
        id: generateId(),
        name: name,
        filters: { ...filters }
    };
}

/**
 * Validate that filters have at least one criterion set
 * @param {object} filters - Filter object
 * @returns {boolean} True if valid
 */
function validateFilters(filters) {
    return !!(filters.search || filters.category || filters.client || filters.status);
}

export {
    createCollection,
    validateFilters
};
