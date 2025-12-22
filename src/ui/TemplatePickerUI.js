/**
 * Template Picker UI Module
 * Functions for template picker modal rendering.
 */

/**
 * Escape HTML for safe rendering
 * @param {string} unsafe 
 * @returns {string}
 */
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

/**
 * Render a template item for the picker list
 * @param {object} template 
 * @returns {string} HTML string
 */
function renderTemplatePickerItem(template) {
    const favStar = template.is_favourite ? '★ ' : '';
    return `
        <div class="template-picker-item" data-id="${template.id}">
            <strong>${favStar}${escapeHtml(template.description)}</strong>
            <p class="template-notes">${escapeHtml(template.notes) || ''}</p>
        </div>
    `;
}

/**
 * Render a template item for the manager list
 * @param {object} template 
 * @param {boolean} isSelected 
 * @returns {string} HTML string
 */
function renderTemplateManagerItem(template, isSelected) {
    const favStar = template.is_favourite ? '★ ' : '';
    return `
        <div class="template-manager-item ${isSelected ? 'active' : ''}" data-id="${template.id}">
            ${favStar}${escapeHtml(template.description)}
        </div>
    `;
}

/**
 * Generate input fields for template variables
 * @param {string[]} variables - Array of variable names
 * @returns {string} HTML for variable input form
 */
function renderVariableInputs(variables) {
    if (!variables.length) {
        return '<p>No variables found in this template.</p>';
    }

    return variables.map(v => `
        <div class="var-field">
            <label for="var-${v}">${escapeHtml(v)}</label>
            <input type="text" id="var-${v}" data-var="${v}" placeholder="Enter value...">
        </div>
    `).join('');
}

export {
    escapeHtml,
    renderTemplatePickerItem,
    renderTemplateManagerItem,
    renderVariableInputs
};
