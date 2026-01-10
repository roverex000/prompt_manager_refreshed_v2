/**
 * Prompt Service Module
 * Pure business logic for prompt operations - no UI dependencies.
 */

/**
 * Factory for creating new prompt objects
 * @param {Function} generateId - ID generator function
 * @returns {object} New prompt with default values
 */
function createPrompt(generateId) {
    return {
        id: generateId(),
        title: 'New Prompt',
        description: '',
        prompt_text: '',
        tags: '',
        status: 'draft',
        notes: '',
        category: '',
        client: '',
        date_created: new Date().toISOString(),
        versions: [],
        embedding: null
    };
}

/**
 * Create a new version entry for a prompt
 * @param {object} prompt - The prompt to version
 * @returns {object} New version entry
 */
function createVersion(prompt) {
    const lastVer = prompt.versions.length > 0
        ? prompt.versions[prompt.versions.length - 1].version_no
        : 0;

    return {
        version_no: lastVer + 1,
        prompt_text: prompt.prompt_text,
        notes: prompt.notes,
        date_created: new Date().toISOString()
    };
}

/**
 * Find a version by version number
 * @param {object} prompt - Prompt with versions array
 * @param {number} versionNo - Version number to find
 * @returns {object|undefined} Version object or undefined
 */
function findVersion(prompt, versionNo) {
    return prompt.versions.find(v => v.version_no === versionNo);
}

/**
 * Update prompt fields from form data
 * @param {object} prompt - Prompt to update
 * @param {object} formData - Object with field values {title, description, category, etc.}
 * @returns {object} Updated prompt (same reference, mutated)
 */
function updatePromptFromForm(prompt, formData) {
    prompt.title = formData.title ?? prompt.title;
    prompt.description = formData.description ?? prompt.description;
    prompt.category = formData.category ?? prompt.category;
    prompt.client = formData.client ?? prompt.client;
    prompt.status = formData.status ?? prompt.status;
    prompt.prompt_text = formData.prompt_text ?? prompt.prompt_text;
    prompt.tags = formData.tags ?? prompt.tags;
    prompt.notes = formData.notes ?? prompt.notes;
    return prompt;
}

/**
 * Extract unique categories from prompts
 * @param {Array} prompts
 * @returns {string[]} Sorted unique categories
 */
function extractCategories(prompts) {
    const set = new Set(prompts.map(p => p.category).filter(Boolean));
    return [...set].sort();
}

/**
 * Extract unique clients from prompts
 * @param {Array} prompts
 * @returns {string[]} Sorted unique clients
 */
function extractClients(prompts) {
    const set = new Set(prompts.map(p => p.client).filter(Boolean));
    return [...set].sort();
}

/**
 * Extract unique statuses from prompts
 * @param {Array} prompts
 * @returns {string[]} Sorted unique statuses
 */
function extractStatuses(prompts) {
    const set = new Set(prompts.map(p => p.status).filter(Boolean));
    return [...set].sort();
}

/**
 * Filter prompts by criteria
 * @param {Array} prompts
 * @param {object} filter - {category, client, status}
 * @returns {Array} Filtered prompts
 */
function filterPrompts(prompts, filter) {
    return prompts.filter(p => {
        const matchesCat = filter.category ? p.category === filter.category : true;
        const matchesClient = filter.client ? p.client === filter.client : true;
        const matchesStatus = filter.status ? p.status === filter.status : true;
        return matchesCat && matchesClient && matchesStatus;
    });
}

/**
 * Sort prompts by specified field
 * @param {Array} prompts
 * @param {string} sortKey - 'date-desc', 'date-asc', 'name-asc', 'cat-asc', 'client-asc'
 * @returns {Array} Sorted prompts (new array)
 */
function sortPrompts(prompts, sortKey) {
    const sorted = [...prompts];
    switch (sortKey) {
    case 'date-desc':
        return sorted.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
    case 'date-asc':
        return sorted.sort((a, b) => new Date(a.date_created) - new Date(b.date_created));
    case 'name-asc':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'cat-asc':
        return sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    case 'client-asc':
        return sorted.sort((a, b) => (a.client || '').localeCompare(b.client || ''));
    default:
        return sorted;
    }
}

/**
 * Search prompts by keyword (non-semantic)
 * @param {Array} prompts
 * @param {string} query - Search string
 * @returns {Array} Matching prompts
 */
function keywordSearch(prompts, query) {
    if (!query) return prompts;
    const q = query.toLowerCase();
    return prompts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.prompt_text || '').toLowerCase().includes(q) ||
        (p.tags || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
    );
}

/**
 * Duplicate a prompt
 * @param {object} prompt - Source prompt
 * @param {Function} generateId - ID generator
 * @returns {object} New prompt copy
 */
function duplicatePrompt(prompt, generateId) {
    return {
        ...prompt,
        id: generateId(),
        title: `COPY ${prompt.title || 'Untitled'}`,
        status: 'draft',
        date_created: new Date().toISOString(),
        versions: [],
        embedding: null
    };
}

export {
    createPrompt,
    createVersion,
    findVersion,
    updatePromptFromForm,
    extractCategories,
    extractClients,
    extractStatuses,
    filterPrompts,
    sortPrompts,
    keywordSearch,
    duplicatePrompt
};
