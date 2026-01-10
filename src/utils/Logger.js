/**
 * Logger Module
 * Centralized logging with log levels for debugging and future extensibility.
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Default level - can be changed via setLevel()
let currentLevel = LOG_LEVELS.DEBUG;

/**
 * Set the minimum log level
 * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'} level
 */
function setLevel(level) {
    currentLevel = LOG_LEVELS[level] ?? LOG_LEVELS.DEBUG;
}

/**
 * Format log message with timestamp
 * @param {string} level
 * @param {string} message
 * @returns {string}
 */
function formatMessage(level, message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Log debug message
 * @param {string} message
 * @param {...any} args
 */
function debug(message, ...args) {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
        console.log(formatMessage('DEBUG', message), ...args);
    }
}

/**
 * Log info message
 * @param {string} message
 * @param {...any} args
 */
function info(message, ...args) {
    if (currentLevel <= LOG_LEVELS.INFO) {
        console.log(formatMessage('INFO', message), ...args);
    }
}

/**
 * Log warning message
 * @param {string} message
 * @param {...any} args
 */
function warn(message, ...args) {
    if (currentLevel <= LOG_LEVELS.WARN) {
        console.warn(formatMessage('WARN', message), ...args);
    }
}

/**
 * Log error message
 * @param {string} message
 * @param {...any} args
 */
function error(message, ...args) {
    if (currentLevel <= LOG_LEVELS.ERROR) {
        console.error(formatMessage('ERROR', message), ...args);
    }
}

export const Logger = {
    setLevel,
    debug,
    info,
    warn,
    error,
    LOG_LEVELS
};
