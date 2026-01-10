/**
 * Modal UI Helpers Module
 * Helper functions for modal dialogs.
 */

/**
 * Show a confirmation dialog
 * @param {string} message
 * @returns {boolean}
 */
function confirm(message) {
    return window.confirm(message);
}

/**
 * Show a prompt dialog
 * @param {string} message
 * @param {string} defaultValue
 * @returns {string|null}
 */
function prompt(message, defaultValue = '') {
    return window.prompt(message, defaultValue);
}

/**
 * Show an alert
 * @param {string} message
 */
function alert(message) {
    window.alert(message);
}

/**
 * Generic modal opener
 * @param {string} modalId - ID of the dialog element
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && modal.showModal) {
        modal.showModal();
    }
}

/**
 * Generic modal closer
 * @param {string} modalId - ID of the dialog element
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && modal.close) {
        modal.close();
    }
}

/**
 * Setup close button handlers for all modals
 */
function setupModalCloseButtons() {
    document.querySelectorAll('dialog .close-btn').forEach(btn => {
        btn.onclick = () => btn.closest('dialog')?.close();
    });
}

export {
    confirm,
    prompt,
    alert,
    openModal,
    closeModal,
    setupModalCloseButtons
};
