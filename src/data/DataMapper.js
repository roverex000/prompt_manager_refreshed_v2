/**
 * Data Mapper Module
 * Handles transformation between internal data models and import/export formats.
 */

import { generateId } from '../utils/Utils.js';

/**
 * Convert internal prompt to export format
 * @param {object} p - Internal prompt object
 * @returns {object} Export-ready prompt
 */
export function promptToExport(p) {
    return {
        id: p.id,
        prompt_id: p.id,
        prompt_title: p.title,
        prompt_desc: p.description,
        prompt_text: p.prompt_text,
        tags: p.tags,
        prompt_status: p.status,
        notes: p.notes,
        category: p.category || '',
        client: p.client || '',
        date_created: p.date_created,
        versions: p.versions,
        embedding: p.embedding // Persist embedding if exists
    };
}

/**
 * Convert imported prompt to internal format
 * @param {object} p - Imported prompt object
 * @returns {object} Internal prompt
 */
export function promptFromImport(p) {
    return {
        id: p.id || p.prompt_id || generateId(),
        title: p.title || p.prompt_title || 'Untitled',
        description: p.description || p.prompt_desc || '',
        prompt_text: p.prompt_text || '',
        tags: p.tags || '',
        status: p.status || p.prompt_status || 'draft',
        notes: p.notes || '',
        category: p.category || '',
        client: p.client || '',
        date_created: p.date_created || new Date().toISOString(),
        versions: p.versions || [],
        embedding: p.embedding || null
    };
}

/**
 * Convert internal template to export format
 * @param {object} t - Internal template object
 * @returns {object} Export-ready template
 */
export function templateToExport(t) {
    return {
        template_id: t.id,
        template_desc: t.description,
        template_text: t.template_text,
        template_notes: t.notes || '',
        isFavorite: t.is_favourite,
        order: t.order
    };
}

/**
 * Convert imported template to internal format
 * @param {object} t - Imported template object
 * @returns {object} Internal template
 */
export function templateFromImport(t) {
    return {
        id: t.template_id || t.id || generateId(),
        description: t.template_desc || t.description || 'No Description',
        template_text: t.template_text || '',
        notes: t.template_notes || t.notes || '',
        is_favourite: t.isFavorite || false,
        order: t.order || 0
    };
}

// Legacy object export for backward compatibility
export const DataMapper = {
    promptToExport,
    promptFromImport,
    templateToExport,
    templateFromImport
};
