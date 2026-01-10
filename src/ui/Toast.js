/**
 * Toast Notification Module
 * Non-blocking user notifications to replace alert() calls.
 */

// Toast container element
let container = null;

/**
 * Initialize the toast container
 */
function initContainer() {
    if (container) return;

    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    `;
    document.body.appendChild(container);
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {'info'|'success'|'warning'|'error'} type - Toast type
 * @param {number} duration - Duration in milliseconds (default 4000)
 */
function show(message, type = 'info', duration = 4000) {
    initContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        padding: 12px 20px;
        border-radius: 12px;
        color: white;
        font-family: var(--font-sans, sans-serif);
        font-size: 0.9rem;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        pointer-events: auto;
        animation: slideIn 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
    `;

    // Type-specific colors
    const colors = {
        info: '#4A7A75',
        success: '#16a34a',
        warning: '#f59e0b',
        error: '#E07A5F'
    };
    toast.style.backgroundColor = colors[type] || colors.info;

    toast.textContent = message;
    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show info toast
 */
function info(message, duration) {
    show(message, 'info', duration);
}

/**
 * Show success toast
 */
function success(message, duration) {
    show(message, 'success', duration);
}

/**
 * Show warning toast
 */
function warning(message, duration) {
    show(message, 'warning', duration);
}

/**
 * Show error toast
 */
function error(message, duration) {
    show(message, 'error', duration);
}

// Add CSS animation (inject once)
function injectStyles() {
    if (document.getElementById('toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Auto-inject styles when module loads (browser only)
if (typeof document !== 'undefined') {
    injectStyles();
}

export const Toast = {
    show,
    info,
    success,
    warning,
    error
};
