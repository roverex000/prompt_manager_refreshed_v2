/**
 * Utils Module
 * Common utility functions used across the application.
 */

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
export function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Format ISO date string to locale format
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} unsafe - Unescaped string
 * @returns {string} Escaped HTML-safe string
 */
export function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
        .replaceAll('\'', '&#039;');
}

/**
 * Simple word-based diff display
 * @param {string} oldText
 * @param {string} newText
 * @returns {string} HTML diff output
 */
export function diffWords(oldText, newText) {
    if (oldText === newText) return escapeHtml(oldText);
    return `<del>${escapeHtml(oldText)}</del><hr><ins>${escapeHtml(newText)}</ins>`;
}

/**
 * Download data as JSON file
 * @param {object} data - Data to export
 * @param {string} filename - Target filename
 */
export function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Legacy object export for backward compatibility
export const Utils = {
    generateId,
    formatDate,
    escapeHtml,
    diffWords,
    downloadJSON
};
