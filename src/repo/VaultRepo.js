/**
 * Vault Repository Module (File System Access API)
 * Handles file-based persistence for prompts and templates.
 * @implements {RepositoryInterface}
 */

import { RepositoryInterface } from './RepositoryInterface.js';

class VaultRepo extends RepositoryInterface {
    constructor() {
        super();
        this.dirHandle = null;
        this.isConnected = false;
        this.fileMap = new Map(); // Maps ID -> Filename
    }

    async selectDirectory() {
        try {
            this.dirHandle = await window.showDirectoryPicker();
            this.isConnected = true;
            return true;
        } catch (err) {
            console.error('Vault Connection Cancelled', err);
            return false;
        }
    }

    async loadAll() {
        if (!this.dirHandle) return { prompts: [], templates: [] };

        const prompts = [];
        const templates = [];
        this.fileMap.clear();

        // 1. Collect all file handles first
        const fileHandles = [];
        for await (const entry of this.dirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                fileHandles.push(entry);
            }
        }

        // 2. Read in parallel (Batched)
        const BATCH_SIZE = 50;
        for (let i = 0; i < fileHandles.length; i += BATCH_SIZE) {
            const batch = fileHandles.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (entry) => {
                try {
                    const fileHandle = await this.dirHandle.getFileHandle(entry.name);
                    const file = await fileHandle.getFile();
                    const text = await file.text();
                    const json = JSON.parse(text);

                    // Map ID to Filename
                    if (json.id) {
                        this.fileMap.set(json.id, entry.name);
                    }

                    if (json.prompt_text !== undefined) prompts.push(json);
                    else if (json.template_text !== undefined) templates.push(json);
                } catch (e) {
                    console.warn(`Skipping file: ${entry.name}`, e);
                }
            }));
        }

        return { prompts, templates };
    }

    async savePrompt(prompt) {
        if (!this.dirHandle) throw new Error('Vault not connected');

        const safeTitle = (prompt.title || 'Untitled').replace(/[^a-z0-9]/gi, '_');
        const newFileName = `${safeTitle}__${prompt.id}.json`;

        // Check for rename (prevent duplicates)
        const oldFileName = this.fileMap.get(prompt.id);
        if (oldFileName && oldFileName !== newFileName) {
            try {
                await this.dirHandle.removeEntry(oldFileName);
            } catch (e) { console.warn('Could not delete old file on rename', e); }
        }

        await this.writeFile(newFileName, prompt);
        this.fileMap.set(prompt.id, newFileName);

        return newFileName;
    }

    async saveTemplate(template) {
        if (!this.dirHandle) throw new Error('Vault not connected');

        const safeDesc = (template.description || 'Template').replace(/[^a-z0-9]/gi, '_');
        const newFileName = `TEMPLATE_${safeDesc}__${template.id}.json`;

        // Check for rename
        const oldFileName = this.fileMap.get(template.id);
        if (oldFileName && oldFileName !== newFileName) {
            try {
                await this.dirHandle.removeEntry(oldFileName);
            } catch (e) { console.warn('Could not delete old file on rename', e); }
        }

        await this.writeFile(newFileName, template);
        this.fileMap.set(template.id, newFileName);
    }

    /**
     * Delete a file using the cached fileMap (improved performance)
     * Falls back to scanning if ID not in map
     */
    async deleteFile(id) {
        if (!this.dirHandle) return;

        // Try cached filename first (fast path)
        const cachedFileName = this.fileMap.get(id);
        if (cachedFileName) {
            try {
                await this.dirHandle.removeEntry(cachedFileName);
                this.fileMap.delete(id);
                return;
            } catch (e) {
                console.warn('Cached file not found, scanning...', e);
            }
        }

        // Fallback: scan directory (slow path)
        for await (const entry of this.dirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                try {
                    const fileHandle = await this.dirHandle.getFileHandle(entry.name);
                    const file = await fileHandle.getFile();
                    const text = await file.text();
                    const json = JSON.parse(text);

                    if (json.id === id) {
                        await this.dirHandle.removeEntry(entry.name);
                        this.fileMap.delete(id);
                        return;
                    }
                } catch (e) {
                    console.warn(`Error checking file: ${entry.name}`, e);
                }
            }
        }
    }

    async writeFile(fileName, data) {
        const fileHandle = await this.dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    }

    // --- Unified Interface Methods ---
    async getAllPrompts() {
        const data = await this.loadAll();
        return data.prompts;
    }

    async getAllTemplates() {
        const data = await this.loadAll();
        return data.templates;
    }

    async deletePrompt(id) {
        return this.deleteFile(id);
    }

    async deleteTemplate(id) {
        return this.deleteFile(id);
    }

    // --- Collections (not file-persisted in vault mode) ---
    async getAllCollections() {
        // Collections are not persisted in vault mode (localStorage fallback)
        return [];
    }

    async saveCollection(collection) {
        // No-op for vault mode
        return collection;
    }

    async deleteCollection(_id) {
        // No-op for vault mode
    }
}

export { VaultRepo };
