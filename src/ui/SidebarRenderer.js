/**
 * Sidebar UI Renderer Module
 * Pure functions to generate HTML for sidebar components.
 */

/**
 * Escape HTML to prevent XSS
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
 * Render a single prompt item for the sidebar list
 * @param {object} prompt - Prompt object
 * @param {boolean} isActive - Whether this prompt is currently selected
 * @returns {string} HTML string
 */
function renderPromptItem(prompt, isActive) {
    const tags = prompt.tags
        ? prompt.tags.split(',').map(t => `<span class="tag-pill">${escapeHtml(t.trim())}</span>`).join('')
        : '';

    const liveTag = prompt.status === 'live'
        ? '<span class="tag-pill" style="background:#dcfce7; color:#166534; border-color:#86efac;">LIVE</span>'
        : '';

    const categoryLabel = prompt.category
        ? `<span class="meta-label">${escapeHtml(prompt.category)}</span>`
        : '';

    const clientLabel = prompt.client
        ? `<span class="meta-label">[${escapeHtml(prompt.client)}]</span>`
        : '';

    return `
        <div class="prompt-item ${isActive ? 'active' : ''}" data-id="${prompt.id}">
            <h4>${escapeHtml(prompt.title) || 'Untitled'}</h4>
            <div class="tags-row">
                ${liveTag}
                ${categoryLabel}
                ${clientLabel}
            </div>
            <p>${escapeHtml(prompt.description)}</p>
            <div class="tags-row">${tags}</div>
        </div>
    `;
}

/**
 * Render a smart collection item
 * @param {object} collection 
 * @param {boolean} isActive 
 * @returns {string} HTML string
 */
function renderCollectionItem(collection, isActive) {
    return `
        <div class="collection-item ${isActive ? 'active' : ''}" data-id="${collection.id}">
            <span class="collection-name">${escapeHtml(collection.name)}</span>
            <button class="collection-delete" data-id="${collection.id}" title="Delete">×</button>
        </div>
    `;
}

/**
 * Render a version history row
 * @param {object} version - Version object {version_no, date_created, notes}
 * @param {Function} formatDate - Date formatting function
 * @returns {string} HTML table row
 */
function renderVersionRow(version, formatDate) {
    return `
        <tr>
            <td>v${version.version_no}</td>
            <td>${formatDate(version.date_created)}</td>
            <td>${escapeHtml(version.notes) || '-'}</td>
            <td align="right">
                <button class="btn-diff tiny secondary" data-ver="${version.version_no}">Compare</button>
                <button class="btn-restore tiny secondary" data-ver="${version.version_no}">Restore</button>
            </td>
        </tr>
    `;
}

/**
 * Populate a select dropdown with options
 * @param {HTMLSelectElement} selectEl 
 * @param {string[]} values 
 * @param {string} defaultLabel - Label for "all" option
 */
function populateSelect(selectEl, values, defaultLabel) {
    selectEl.innerHTML = `<option value="">${defaultLabel}</option>`;
    values.forEach(v => {
        selectEl.innerHTML += `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`;
    });
}

/**
 * Populate a datalist with options
 * @param {HTMLDataListElement} datalistEl 
 * @param {string[]} values 
 */
function populateDatalist(datalistEl, values) {
    datalistEl.innerHTML = values.map(v => `<option value="${escapeHtml(v)}">`).join('');
}

export {
    escapeHtml,
    renderPromptItem,
    renderCollectionItem,
    renderVersionRow,
    populateSelect,
    populateDatalist
};
