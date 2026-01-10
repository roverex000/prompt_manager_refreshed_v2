/**
 * Template Service Module
 * Business logic for template operations.
 */

/**
 * Factory for creating new template objects
 * @param {Function} generateId - ID generator function
 * @returns {object} New template with default values
 */
function createTemplate(generateId) {
    return {
        id: generateId(),
        description: 'New Template',
        template_text: '',
        notes: '',
        is_favourite: false,
        order: 0
    };
}

/**
 * Duplicate a template with a new ID
 * @param {object} template - Template to duplicate
 * @param {Function} generateId - ID generator function
 * @returns {object} New template copy
 */
function duplicateTemplate(template, generateId) {
    return {
        ...template,
        id: generateId(),
        description: `${template.description} (Copy)`
    };
}

/**
 * Extract variables from template text (${varname} pattern)
 * @param {string} templateText
 * @returns {string[]} Array of unique variable names
 */
function extractVariables(templateText) {
    const regex = /\${([^}]+)}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(templateText)) !== null) {
        if (!variables.includes(match[1])) {
            variables.push(match[1]);
        }
    }
    return variables;
}

/**
 * Substitute variables in template text
 * @param {string} templateText - Template with ${var} placeholders
 * @param {object} values - Map of variable name to value
 * @returns {string} Processed text
 */
function substituteVariables(templateText, values) {
    return templateText.replace(/\${([^}]+)}/g, (match, varName) => {
        return values[varName] ?? match; // Keep placeholder if no value
    });
}

/**
 * Filter templates by search query
 * @param {Array} templates
 * @param {string} query
 * @returns {Array} Filtered templates
 */
function filterTemplates(templates, query) {
    if (!query) return templates;
    const q = query.toLowerCase();
    return templates.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.template_text || '').toLowerCase().includes(q)
    );
}

/**
 * Sort templates - favourites first, then by order
 * @param {Array} templates
 * @returns {Array} Sorted templates
 */
function sortTemplates(templates) {
    return [...templates].sort((a, b) => {
        if (a.is_favourite !== b.is_favourite) {
            return b.is_favourite ? 1 : -1; // Favourites first
        }
        return (a.order || 0) - (b.order || 0);
    });
}

export {
    createTemplate,
    duplicateTemplate,
    extractVariables,
    substituteVariables,
    filterTemplates,
    sortTemplates
};
