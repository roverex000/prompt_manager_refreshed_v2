/**
 * IndexedDB Repository Module
 * Handles all IndexedDB persistence operations for prompts, templates, and collections.
 */

const DB_NAME = 'PromptManagerV2';
const DB_VERSION = 2;

class IndexedDBRepo {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // Handle if database is locked by another tab
            request.onblocked = () => {
                alert("Database Update Blocked: Please close all other tabs/windows of this app and refresh.");
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // V1 Stores
                if (!db.objectStoreNames.contains('prompts')) {
                    const promptStore = db.createObjectStore('prompts', { keyPath: 'id' });
                    promptStore.createIndex('category', 'category', { unique: false });
                    promptStore.createIndex('client', 'client', { unique: false });
                }
                if (!db.objectStoreNames.contains('templates')) {
                    db.createObjectStore('templates', { keyPath: 'id' });
                }
                // V2 Stores (Collections)
                if (!db.objectStoreNames.contains('collections')) {
                    db.createObjectStore('collections', { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };

            request.onerror = (e) => {
                console.error("DB Error:", e);
                alert("Database Error. Check console for details.");
                reject("DB Error");
            };
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            // Safety check: if db didn't upgrade correctly, store might not exist
            if (!this.db.objectStoreNames.contains(storeName)) {
                console.warn(`Store ${storeName} missing. DB Upgrade failed?`);
                resolve([]);
                return;
            }

            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => {
                console.error(`Error reading ${storeName}`, e);
                reject(e);
            };
        });
    }

    async put(storeName, item) {
        return new Promise((resolve) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.put(item);
            tx.oncomplete = () => resolve(item);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.delete(id);
            tx.oncomplete = () => resolve();
        });
    }

    async clearAll() {
        return new Promise((resolve) => {
            const names = ['prompts', 'templates', 'collections'].filter(n => this.db.objectStoreNames.contains(n));
            const tx = this.db.transaction(names, 'readwrite');
            names.forEach(n => tx.objectStore(n).clear());
            tx.oncomplete = () => resolve();
        });
    }

    // --- Unified Interface Methods ---
    async getAllPrompts() {
        return this.getAll('prompts');
    }

    async getAllTemplates() {
        return this.getAll('templates');
    }

    async getAllCollections() {
        return this.getAll('collections');
    }

    async savePrompt(prompt) {
        return this.put('prompts', prompt);
    }

    async saveTemplate(template) {
        return this.put('templates', template);
    }

    async saveCollection(collection) {
        return this.put('collections', collection);
    }

    async deletePrompt(id) {
        return this.delete('prompts', id);
    }

    async deleteTemplate(id) {
        return this.delete('templates', id);
    }

    async deleteCollection(id) {
        return this.delete('collections', id);
    }
}

export { IndexedDBRepo };
