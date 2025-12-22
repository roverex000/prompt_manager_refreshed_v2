import { IndexedDBRepo } from './src/repo/IndexedDBRepo.js';
import { VaultRepo } from './src/repo/VaultRepo.js';
import { SemanticSearch } from './src/core/SemanticSearch.js';
import * as PromptService from './src/core/PromptService.js';
import * as TemplateService from './src/core/TemplateService.js';
import * as CollectionService from './src/core/CollectionService.js';
import * as SidebarRenderer from './src/ui/SidebarRenderer.js';
import * as TemplatePickerUI from './src/ui/TemplatePickerUI.js';

/**
 * PROMPT MANAGER v3 - Modular Architecture
 * Features: Separated Persistence Layer, Error Trapping, Semantic Search
 */

// Storage & Theme Constants
const STORAGE_MODE = { LOCAL: 'local', VAULT: 'vault' };
const THEME = { DARK: 'dark', LIGHT: 'light' };
const STORAGE_KEYS = { MODE: 'storageMode', THEME: 'theme' };

const Utils = {
    generateId: () => '_' + Math.random().toString(36).substr(2, 9),

    formatDate: (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    },

    escapeHtml: (unsafe) => {
        if (!unsafe) return "";
        return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    },

    diffWords: (oldText, newText) => {
        const oldWords = (oldText || "").split(/(\s+)/);
        const newWords = (newText || "").split(/(\s+)/);
        if (oldText === newText) return Utils.escapeHtml(oldText);
        return `<del>${Utils.escapeHtml(oldText)}</del><hr><ins>${Utils.escapeHtml(newText)}</ins>`;
    },

    downloadJSON: (data, filename) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

// --- 2. DATA ADAPTER ---
const DataMapper = {
    promptToExport: (p) => {
        return {
            id: p.id,
            prompt_id: p.id,
            prompt_title: p.title,
            prompt_desc: p.description,
            prompt_text: p.prompt_text,
            tags: p.tags,
            prompt_status: p.status,
            notes: p.notes,
            category: p.category || "",
            client: p.client || "",
            date_created: p.date_created,
            versions: p.versions,
            embedding: p.embedding // Persist embedding if exists
        };
    },

    promptFromImport: (p) => {
        return {
            id: p.id || p.prompt_id || Utils.generateId(),
            title: p.title || p.prompt_title || "Untitled",
            description: p.description || p.prompt_desc || "",
            prompt_text: p.prompt_text || "",
            tags: p.tags || "",
            status: p.status || p.prompt_status || "draft",
            notes: p.notes || "",
            category: p.category || "",
            client: p.client || "",
            date_created: p.date_created || new Date().toISOString(),
            versions: p.versions || [],
            embedding: p.embedding || null
        };
    },

    templateToExport: (t) => {
        return {
            template_id: t.id,
            template_desc: t.description,
            template_text: t.template_text,
            template_notes: t.notes || "",
            isFavorite: t.is_favourite,
            order: t.order
        };
    },

    templateFromImport: (t) => {
        return {
            id: t.template_id || t.id || Utils.generateId(),
            description: t.template_desc || t.description || "No Description",
            template_text: t.template_text || "",
            notes: t.template_notes || t.notes || "",
            is_favourite: t.isFavorite || false,
            order: t.order || 0
        };
    }
};

// --- 3. SEMANTIC SEARCH ---
// SemanticSearch is now imported from src/core/SemanticSearch.js

// --- 4. APP LOGIC ---
class App {
    constructor() {
        this.store = new IndexedDBRepo();
        this.vault = new VaultRepo();
        this.semantic = new SemanticSearch();
        this.state = {
            storageMode: localStorage.getItem(STORAGE_KEYS.MODE) || STORAGE_MODE.LOCAL,
            prompts: [],
            templates: [],
            collections: [],
            currentPrompt: null,
            currentPromptId: null,
            activeCollectionId: null,
            isDirty: false,
            semanticMode: true, // Default to Semantic Mode
            filter: { search: '', category: '', client: '', status: '', sort: 'date-desc' }
        };

        this.dom = {
            list: document.getElementById('prompt-list'),
            collectionList: document.getElementById('collection-list'),
            editor: document.getElementById('editor-container'),
            empty: document.getElementById('empty-state'),
            dirty: document.getElementById('dirty-indicator'),
            toggleSemantic: document.getElementById('toggle-semantic-mode'),
            inputs: {
                title: document.getElementById('edit-title'),
                desc: document.getElementById('edit-description'),
                cat: document.getElementById('edit-category'),
                client: document.getElementById('edit-client'),
                status: document.getElementById('edit-status'),
                text: document.getElementById('edit-prompt-text'),
                tags: document.getElementById('edit-tags'),
                notes: document.getElementById('edit-notes'),
            },
            filters: {
                search: document.getElementById('search-input'),
                cat: document.getElementById('filter-category'),
                client: document.getElementById('filter-client'),
                status: document.getElementById('filter-status'),
                sort: document.getElementById('filter-sort'),
            }
        };
    }

    async init() {
        try {
            await this.store.init();
            await this.loadData();
            this.renderSidebar();
            this.renderCollections();
            this.setupEventListeners();
            this.populateFilterDropdowns();

            // --- Semantic Init ---
            // Don't await this, let it load in background
            this.semantic.init().then(() => {
                this.updateSearchPlaceholder("Search prompts (Semantic Ready)...");
                this.reindexStalePrompts();
            });

            // --- Dark Mode Init ---
            const theme = localStorage.getItem(STORAGE_KEYS.THEME);
            if (theme === THEME.DARK) {
                document.body.classList.add('dark-mode');
            }
            this.updateThemeIcon();

            // --- Vault Auto-Init (Optional) ---
            if (this.state.storageMode === STORAGE_MODE.VAULT) {
                console.log("Vault Mode Active. Waiting for connection...");
                this.renderSidebar();
            }

        } catch (err) {
            console.error("App Initialization Failed:", err);
            alert("App failed to start. See console (F12) for details.");
        }
    }

    async loadData() {
        this.showLoading(true);
        try {
            if (this.state.storageMode === STORAGE_MODE.VAULT && this.vault.isConnected) {
                const data = await this.vault.loadAll();
                this.state.prompts = data.prompts;
                this.state.templates = data.templates;
                this.state.collections = await this.store.getAll('collections');
            } else if (this.state.storageMode === STORAGE_MODE.LOCAL) {
                this.state.prompts = await this.store.getAll('prompts');
                this.state.templates = await this.store.getAll('templates');
                this.state.collections = await this.store.getAll('collections');
            } else {
                this.state.prompts = [];
                this.state.templates = [];
            }
            this.state.templates.sort((a, b) => (a.order || 0) - (b.order || 0));

            this.reindexStalePrompts();

        } finally {
            this.showLoading(false);
        }
    }

    async reindexStalePrompts() {
        if (!this.semantic || !this.semantic.isLoaded) return;

        const stalePrompts = this.state.prompts.filter(p => !p.embedding);
        if (stalePrompts.length > 0) {
            console.log(`[Semantic] Re-indexing ${stalePrompts.length} stale prompts...`);
            for (const p of stalePrompts) {
                await this.persistPrompt(p);
            }
            console.log("[Semantic] Background re-indexing complete.");
        }
    }

    showLoading(isLoading) {
        // Simple overlay or cursor change
        if (isLoading) {
            document.body.style.cursor = 'wait';
            const existing = document.getElementById('loading-overlay');
            if (!existing) {
                const div = document.createElement('div');
                div.id = 'loading-overlay';
                div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.5);z-index:9999;display:flex;justify-content:center;align-items:center;font-weight:bold;color:var(--primary);backdrop-filter:blur(2px);';
                div.innerHTML = '<span>Loading Vault...</span>';
                document.body.appendChild(div);
            }
        } else {
            document.body.style.cursor = 'default';
            const existing = document.getElementById('loading-overlay');
            if (existing) existing.remove();
        }
    }

    // --- STORAGE HELPERS (Unified Interface) ---
    async persistPrompt(prompt) {
        // Generate embedding from all text fields (not just prompt_text)
        const textToEmbed = `${prompt.title || ''} ${prompt.description || ''} ${prompt.notes || ''} ${prompt.prompt_text || ''}`.trim();

        if (this.semantic.isLoaded && textToEmbed) {
            prompt.embedding = await this.semantic.embed(textToEmbed);
        }

        if (this.state.storageMode === STORAGE_MODE.VAULT) {
            await this.vault.savePrompt(prompt);
        } else {
            await this.store.put('prompts', prompt);
        }
    }

    async persistTemplate(template) {
        if (this.state.storageMode === STORAGE_MODE.VAULT) {
            await this.vault.saveTemplate(template);
        } else {
            await this.store.put('templates', template);
        }
    }

    async removePrompt(id) {
        if (this.state.storageMode === STORAGE_MODE.VAULT) {
            await this.vault.deletePrompt(id);
        } else {
            await this.store.delete('prompts', id);
        }
    }

    async removeTemplate(id) {
        if (this.state.storageMode === STORAGE_MODE.VAULT) {
            await this.vault.deleteTemplate(id);
        } else {
            await this.store.delete('templates', id);
        }
    }

    // --- RENDER LOGIC ---

    async renderSidebar() {
        const { prompts, filter } = this.state;
        const listEl = this.dom.list;
        listEl.innerHTML = '';

        let filtered = [];

        // Dual Search Mode: Semantic vs Keyword
        // Controlled by Toggle Switch (semanticMode)
        if (filter.search && this.semantic.isLoaded && this.state.semanticMode) {
            // SEMANTIC MODE
            const semanticResults = await this.semantic.search(filter.search, prompts);
            // Create a map of scores
            const scoreMap = new Map(semanticResults.map(r => [r.id, r.score]));

            // Filter by normal filters first
            filtered = prompts.filter(p => {
                const matchesCat = filter.category ? p.category === filter.category : true;
                const matchesClient = filter.client ? p.client === filter.client : true;
                const matchesStatus = filter.status ? p.status === filter.status : true;
                return matchesCat && matchesClient && matchesStatus;
            });

            // Filter out items with very low score if they don't contain keywords?
            // Actually, for pure semantic mode, we trust the score, BUT we usually want some threshold.
            // The scoreMap only contains topK results (default 10).
            // Let's rely on the scoreMap presence + simple keyword fallback for things not in topK?
            // No, user wants straight semantic.

            // Re-Ranking:
            // We want to persist the items that match the filters, but re-order them by score.
            // Items not in semantic results (score 0) will drop to bottom.

            // To ensure we don't hide everything: 
            // The semantic.search(topK=10) might be too small for a filter list. 
            // We should arguably search ALL or a larger set.
            // But for now, let's just stick to the previous hybrid sort logic which was working well, just changing the CONDITION to enter this block.

            filtered.sort((a, b) => {
                const scoreA = scoreMap.get(a.id) || 0;
                const scoreB = scoreMap.get(b.id) || 0;
                return scoreB - scoreA;
            });

        } else {
            // STANDARD KEYWORD MODE
            filtered = prompts.filter(p => {
                const searchSource = (p.title + p.description + p.prompt_text + (p.tags || "")).toLowerCase();
                const matchesSearch = searchSource.includes(filter.search.toLowerCase());

                const matchesCat = filter.category ? p.category === filter.category : true;
                const matchesClient = filter.client ? p.client === filter.client : true;
                const matchesStatus = filter.status ? p.status === filter.status : true;

                return matchesSearch && matchesCat && matchesClient && matchesStatus;
            });

            // Apply Sort (Only in Standard Mode)
            const sortMode = filter.sort || 'date-desc';
            filtered.sort((a, b) => {
                switch (sortMode) {
                    case 'date-asc':
                        return new Date(a.date_created || 0) - new Date(b.date_created || 0);
                    case 'date-desc':
                        return new Date(b.date_created || 0) - new Date(a.date_created || 0);
                    case 'name-asc':
                        return (a.title || '').localeCompare(b.title || '');
                    case 'cat-asc':
                        return (a.category || '').localeCompare(b.category || '');
                    case 'client-asc':
                        return (a.client || '').localeCompare(b.client || '');
                    default:
                        return 0;
                }
            });
        }

        filtered.forEach(p => {
            const el = document.createElement('div');
            el.className = `prompt-item ${this.state.currentPromptId === p.id ? 'active' : ''}`;

            const tags = p.tags ? p.tags.split(',').map(t => `<span class="tag-pill">${t.trim()}</span>`).join('') : '';

            el.innerHTML = `
                <h4>${Utils.escapeHtml(p.title) || 'Untitled'}</h4>
                <div class="tags-row">
                    ${p.status === 'live' ? '<span class="tag-pill" style="background:#dcfce7; color:#166534; border-color:#86efac;">LIVE</span>' : ''}
                    ${p.category ? `<span class="meta-label">${Utils.escapeHtml(p.category)}</span>` : ''}
                    ${p.client ? `<span class="meta-label">[${Utils.escapeHtml(p.client)}]</span>` : ''}
                </div>
                <p>${Utils.escapeHtml(p.description)}</p>
                <div class="tags-row">${tags}</div>
            `;
            el.onclick = () => this.handlePromptSelect(p.id);
            listEl.appendChild(el);
        });

        this.updateDatalists();
    }

    renderCollections() {
        const list = this.dom.collectionList;
        if (!list) return; // Safety check if HTML is outdated

        list.innerHTML = '';
        this.state.collections.forEach(c => {
            const el = document.createElement('div');
            el.className = `collection-item ${this.state.activeCollectionId === c.id ? 'active' : ''}`;
            el.innerHTML = `
                <span>★ ${Utils.escapeHtml(c.name)}</span>
                <button class="delete-btn" title="Delete Collection">&times;</button>
            `;

            el.onclick = (e) => {
                if (e.target.classList.contains('delete-btn')) return;
                this.applyCollection(c);
            };

            el.querySelector('.delete-btn').onclick = (e) => {
                e.stopPropagation();
                this.deleteCollection(c.id);
            };

            list.appendChild(el);
        });
    }

    populateFilterDropdowns() {
        const cats = new Set(this.state.prompts.map(p => p.category).filter(Boolean));
        const clients = new Set(this.state.prompts.map(p => p.client).filter(Boolean));

        const catSelect = this.dom.filters.cat;
        const clientSelect = this.dom.filters.client;

        const currCat = catSelect.value;
        const currClient = clientSelect.value;

        while (catSelect.options.length > 1) catSelect.remove(1);
        while (clientSelect.options.length > 1) clientSelect.remove(1);

        cats.forEach(c => catSelect.add(new Option(c, c)));
        clients.forEach(c => clientSelect.add(new Option(c, c)));

        if (cats.has(currCat)) catSelect.value = currCat;
        if (clients.has(currClient)) clientSelect.value = currClient;
    }

    updateDatalists() {
        const catList = document.getElementById('category-list');
        const clientList = document.getElementById('client-list');
        if (!catList || !clientList) return;

        catList.innerHTML = '';
        clientList.innerHTML = '';

        const cats = new Set(this.state.prompts.map(p => p.category).filter(Boolean));
        const clients = new Set(this.state.prompts.map(p => p.client).filter(Boolean));

        cats.forEach(c => { const op = document.createElement('option'); op.value = c; catList.appendChild(op); });
        clients.forEach(c => { const op = document.createElement('option'); op.value = c; clientList.appendChild(op); });
    }

    loadEditor(id) {
        const prompt = this.state.prompts.find(p => p.id === id);
        if (!prompt) return;

        this.state.currentPrompt = JSON.parse(JSON.stringify(prompt));
        this.state.currentPromptId = id;
        this.setDirty(false);

        const i = this.dom.inputs;
        i.title.value = prompt.title || '';
        i.desc.value = prompt.description || '';
        i.cat.value = prompt.category || '';
        i.client.value = prompt.client || '';
        i.status.value = prompt.status || 'draft';
        i.text.value = prompt.prompt_text || '';
        i.tags.value = prompt.tags || '';
        i.notes.value = prompt.notes || '';

        this.renderVersionHistory();

        this.dom.empty.classList.add('hidden');
        this.dom.editor.classList.remove('hidden');
        this.renderSidebar();
    }

    renderVersionHistory() {
        const tbody = document.getElementById('version-list-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        const versions = this.state.currentPrompt.versions || [];

        [...versions].reverse().forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${v.version_no}</td>
                <td>${Utils.formatDate(v.date_created)}</td>
                <td>${Utils.escapeHtml(v.notes)}</td>
                <td align="right">
                    <button class="tiny secondary btn-view-diff" data-ver="${v.version_no}">Diff</button>
                    <button class="tiny secondary btn-restore-ver" data-ver="${v.version_no}">Restore</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-view-diff').forEach(b => {
            b.onclick = (e) => this.showDiff(parseInt(e.target.dataset.ver));
        });
        tbody.querySelectorAll('.btn-restore-ver').forEach(b => {
            b.onclick = (e) => this.restoreVersion(parseInt(e.target.dataset.ver));
        });
    }

    // --- EVENT HANDLING ---

    setupEventListeners() {
        window.onbeforeunload = (e) => {
            if (this.state.isDirty) e.preventDefault();
        };

        // Safety check helper
        const safeBind = (id, event, handler) => {
            const el = document.getElementById(id);
            if (el) el[event] = handler;
            else console.warn(`Element ${id} missing - Listener not attached.`);
        };

        Object.values(this.dom.inputs).forEach(input => {
            if (input) input.addEventListener('input', () => this.setDirty(true));
        });

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const dialog = btn.closest('dialog');
                if (dialog) dialog.close();
            };
        });

        safeBind('btn-new-prompt', 'onclick', () => this.handleNewPrompt());
        safeBind('btn-save-changes', 'onclick', () => this.saveCurrent(false));
        safeBind('btn-save-version', 'onclick', () => this.saveCurrent(true));
        safeBind('btn-duplicate-prompt', 'onclick', () => this.handleDuplicatePrompt());
        safeBind('btn-delete-prompt', 'onclick', () => this.deleteCurrentPrompt());

        // --- NEW: Copy to Clipboard Binding ---
        safeBind('btn-copy-clipboard', 'onclick', () => this.handleCopyToClipboard());
        safeBind('btn-run-prompt', 'onclick', () => this.handleRunPrompt());

        // Filter Events
        if (this.dom.filters.search) this.dom.filters.search.oninput = (e) => {
            this.state.filter.search = e.target.value;
            this.state.activeCollectionId = null;
            // Debounce render for semantic search
            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.renderSidebar();
            }, 300);
            this.renderCollections();
        };
        if (this.dom.filters.cat) this.dom.filters.cat.onchange = (e) => {
            this.state.filter.category = e.target.value;
            this.state.activeCollectionId = null;
            this.renderSidebar();
            this.renderCollections();
        };
        if (this.dom.filters.client) this.dom.filters.client.onchange = (e) => {
            this.state.filter.client = e.target.value;
            this.state.activeCollectionId = null;
            this.renderSidebar();
            this.renderCollections();
        };
        if (this.dom.filters.status) this.dom.filters.status.onchange = (e) => {
            this.state.filter.status = e.target.value;
            this.state.activeCollectionId = null;
            this.renderSidebar();
            this.renderCollections();
        };
        if (this.dom.filters.sort) this.dom.filters.sort.onchange = (e) => {
            this.state.filter.sort = e.target.value;
            // We want to keep the current filters, just re-order.
            this.state.activeCollectionId = null;
            this.renderSidebar();
        };

        // Collection Events
        // Collection Events
        const saveBtn = document.getElementById('btn-save-search');
        if (saveBtn) {
            saveBtn.onclick = (e) => {
                e.preventDefault(); // Prevent any default button behavior
                this.saveSmartCollection();
            };
        } else {
            console.error("Save Search Button Not Found");
        }

        safeBind('btn-manage-templates', 'onclick', () => this.openTemplateManager());
        safeBind('btn-theme-toggle', 'onclick', () => this.toggleTheme());
        safeBind('btn-vault-toggle', 'onclick', () => this.toggleStorageMode());
        safeBind('btn-vault-connect', 'onclick', () => this.connectVault());

        safeBind('btn-import-export', 'onclick', () => document.getElementById('modal-import-export').showModal());
        safeBind('btn-insert-template', 'onclick', () => this.openTemplatePicker());

        // Sensitivity Slider
        const slider = document.getElementById('semantic-slider');
        const valDisplay = document.getElementById('semantic-val');
        if (slider && valDisplay) {
            slider.oninput = (e) => {
                const val = e.target.value;
                valDisplay.textContent = val;
                this.semantic.setThreshold(val);
                // Re-render query
                this.renderSidebar();
            };
        }

        // Semantic Toggle
        if (this.dom.toggleSemantic) {
            this.dom.toggleSemantic.onchange = (e) => {
                this.state.semanticMode = e.target.checked;
                this.renderSidebar();
            };
        }

        safeBind('btn-export-full', 'onclick', () => this.exportAll());
        safeBind('btn-export-single', 'onclick', () => this.exportSingle());

        safeBind('file-import-full', 'onchange', (e) => this.handleImportFull(e));
        safeBind('file-import-single', 'onchange', (e) => this.handleImportSingle(e));

        safeBind('unsaved-discard', 'onclick', () => this.resolveUnsaved('discard'));
        safeBind('unsaved-save-current', 'onclick', () => this.resolveUnsaved('save'));
        safeBind('unsaved-save-new', 'onclick', () => this.resolveUnsaved('save-new'));
    }

    // --- Clipboard Logic ---
    handleCopyToClipboard() {
        this.copyTextToClipboard(this.dom.inputs.text.value, 'btn-copy-clipboard');
    }

    handleRunPrompt() {
        const text = this.dom.inputs.text.value;
        if (!text) return;

        const regex = /\$\{([^}]+)\}/g;
        const vars = [...text.matchAll(regex)].map(m => m[1]);
        const uniqueVars = [...new Set(vars)];

        if (uniqueVars.length > 0) {
            this.openVariableModal(text, uniqueVars, (finalText) => {
                this.copyTextToClipboard(finalText, 'btn-run-prompt');
            }, 'Copy Result');
        } else {
            this.copyTextToClipboard(text, 'btn-run-prompt');
        }
    }

    async copyTextToClipboard(text, btnId) {
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);

            // Visual Feedback
            const btn = document.getElementById(btnId);
            if (!btn) return;

            const originalText = btn.textContent;
            const originalBg = btn.style.backgroundColor;
            const originalColor = btn.style.color;
            const originalBorder = btn.style.borderColor;

            btn.textContent = "Copied!";
            btn.style.backgroundColor = "#166534"; // Success Green
            btn.style.borderColor = "#166534";
            btn.style.color = "white";

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = originalBg;
                btn.style.borderColor = originalBorder;
                btn.style.color = originalColor;
            }, 2000);

        } catch (err) {
            console.error('Failed to copy', err);
            alert('Could not copy to clipboard. Permission denied?');
        }
    }

    // --- THEME LOGIC ---
    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem(STORAGE_KEYS.THEME, isDark ? THEME.DARK : THEME.LIGHT);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const btn = document.getElementById('btn-theme-toggle');
        if (!btn) return;

        const isDark = document.body.classList.contains('dark-mode');

        // Simple SVG swap
        if (isDark) {
            // Moon Icon
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
            btn.title = "Switch to Light Mode";
        } else {
            // Sun Icon
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
            btn.title = "Switch to Dark Mode";
        }
    }


    // --- VAULT / STORAGE ACTIONS ---

    toggleStorageMode() {
        const newMode = this.state.storageMode === STORAGE_MODE.LOCAL ? STORAGE_MODE.VAULT : STORAGE_MODE.LOCAL;
        this.state.storageMode = newMode;
        localStorage.setItem(STORAGE_KEYS.MODE, newMode);

        // Reset state
        this.state.currentPrompt = null;
        this.state.currentPromptId = null;
        this.dom.editor.classList.add('hidden');
        this.dom.empty.classList.remove('hidden');

        // Re-load
        if (newMode === STORAGE_MODE.LOCAL) {
            this.loadData().then(() => this.renderSidebar());
        } else {
            this.vault.isConnected = false;
            this.state.prompts = [];
            this.state.templates = [];
            this.state.collections = [];
            this.renderSidebar();
            this.renderCollections();
        }
        this.updateVaultUI();
    }

    async connectVault() {
        const success = await this.vault.selectDirectory();
        if (success) {
            await this.loadData();
            this.renderSidebar();
            this.updateVaultUI();
        }
    }

    updateVaultUI() {
        const btn = document.getElementById('btn-vault-toggle');
        const connectBtn = document.getElementById('btn-vault-connect');

        if (this.state.storageMode === STORAGE_MODE.VAULT) {
            if (btn) btn.classList.add('active-vault');
            if (connectBtn) connectBtn.style.display = 'flex';

            if (this.vault.isConnected) {
                if (connectBtn) connectBtn.textContent = 'Vault Connected';
                if (connectBtn) connectBtn.classList.add('connected');
                if (btn) {
                    btn.classList.add('vault-on');
                    btn.classList.remove('vault-off');
                }
            } else {
                if (connectBtn) connectBtn.textContent = 'Open Vault Folder';
                if (connectBtn) connectBtn.classList.remove('connected');
                if (btn) {
                    btn.classList.remove('vault-on');
                    btn.classList.add('vault-off');
                }
            }
        } else {
            if (btn) {
                btn.classList.remove('active-vault', 'vault-on', 'vault-off');
            }
            if (connectBtn) connectBtn.style.display = 'none';
        }
    }

    // --- SMART COLLECTIONS LOGIC ---

    async saveSmartCollection() {
        const name = prompt("Name this Smart Collection (e.g., 'Active Clients'):");
        if (!name) return;

        const f = this.state.filter;
        if (!f.search && !f.category && !f.client && !f.status) {
            alert("Please set some filters (Search, Status, Category, or Client) before saving.");
            return;
        }

        const collection = {
            id: Utils.generateId(),
            name: name,
            filters: { ...this.state.filter }
        };

        try {
            await this.store.put('collections', collection);
            this.state.collections.push(collection);
            this.applyCollection(collection);
        } catch (e) {
            alert("Could not save collection. Database might need a hard refresh.");
        }
    }

    async deleteCollection(id) {
        if (!confirm("Delete this smart collection?")) return;
        await this.store.delete('collections', id);
        this.state.collections = this.state.collections.filter(c => c.id !== id);

        if (this.state.activeCollectionId === id) {
            this.state.activeCollectionId = null;
        }
        this.renderCollections();
    }

    applyCollection(collection) {
        this.state.activeCollectionId = collection.id;
        this.state.filter = { ...collection.filters };

        if (this.dom.filters.search) this.dom.filters.search.value = this.state.filter.search || '';
        if (this.dom.filters.cat) this.dom.filters.cat.value = this.state.filter.category || '';
        if (this.dom.filters.client) this.dom.filters.client.value = this.state.filter.client || '';
        if (this.dom.filters.status) this.dom.filters.status.value = this.state.filter.status || '';

        this.renderSidebar();
        this.renderCollections();
    }

    // --- ACTIONS ---

    handlePromptSelect(id) {
        if (this.state.isDirty && this.state.currentPromptId !== id) {
            this.pendingNavigation = id;
            document.getElementById('modal-unsaved').showModal();
        } else {
            this.loadEditor(id);
        }
    }

    resolveUnsaved(action) {
        const modal = document.getElementById('modal-unsaved');
        modal.close();

        if (action === 'save') this.saveCurrent(false).then(() => this.navigatePending());
        if (action === 'save-new') this.saveCurrent(true).then(() => this.navigatePending());
        if (action === 'discard') {
            this.setDirty(false);
            this.navigatePending();
        }
    }

    navigatePending() {
        if (this.pendingNavigation) {
            this.loadEditor(this.pendingNavigation);
            this.pendingNavigation = null;
        } else if (this.pendingNew) {
            this.createNewPrompt();
            this.pendingNew = false;
        }
    }

    handleNewPrompt() {
        if (this.state.isDirty) {
            this.pendingNew = true;
            document.getElementById('modal-unsaved').showModal();
        } else {
            this.createNewPrompt();
        }
    }

    async createNewPrompt() {
        const newPrompt = PromptService.createPrompt(Utils.generateId);

        await this.persistPrompt(newPrompt);

        this.state.prompts.push(newPrompt);
        this.populateFilterDropdowns();
        this.loadEditor(newPrompt.id);
    }

    async handleDuplicatePrompt() {
        if (!this.state.currentPrompt) return;

        const newPrompt = PromptService.duplicatePrompt(this.state.currentPrompt, Utils.generateId);

        await this.persistPrompt(newPrompt);

        this.state.prompts.push(newPrompt);
        this.populateFilterDropdowns();

        this.loadEditor(newPrompt.id);

        // Ensure sidebar is updated to show new item
        this.renderSidebar();

        // Scroll to top of list? (SidebarRenderer appends, but our sort might put it anywhere. 
        // Default sort is date-desc, so it should be at top since date_created is new).
    }

    setDirty(isDirty) {
        this.state.isDirty = isDirty;
        const ind = this.dom.dirty;
        if (isDirty) {
            ind.textContent = "● UNSAVED";
            ind.classList.add('unsaved');
        } else {
            ind.textContent = "SAVED";
            ind.classList.remove('unsaved');
        }
    }

    async saveCurrent(isVersion) {
        const i = this.dom.inputs;
        const p = this.state.currentPrompt;

        p.title = i.title.value;
        p.description = i.desc.value;
        p.category = i.cat.value;
        p.client = i.client.value;
        p.status = i.status.value;
        p.prompt_text = i.text.value;
        p.tags = i.tags.value;
        p.notes = i.notes.value;

        if (isVersion) {
            const lastVer = p.versions.length > 0 ? p.versions[p.versions.length - 1].version_no : 0;
            p.versions.push({
                version_no: lastVer + 1,
                prompt_text: p.prompt_text,
                notes: p.notes,
                date_created: new Date().toISOString()
            });
        }

        await this.persistPrompt(p);

        const idx = this.state.prompts.findIndex(x => x.id === p.id);
        if (idx >= 0) this.state.prompts[idx] = p;
        else this.state.prompts.push(p);

        this.setDirty(false);
        this.renderSidebar();
        this.renderVersionHistory();
        this.populateFilterDropdowns();
    }

    async deleteCurrentPrompt() {
        if (!confirm("Are you sure you want to delete this prompt?")) return;

        await this.removePrompt(this.state.currentPromptId);

        this.state.prompts = this.state.prompts.filter(p => p.id !== this.state.currentPromptId);
        this.dom.editor.classList.add('hidden');
        this.dom.empty.classList.remove('hidden');
        this.renderSidebar();
    }

    // --- VERSIONING ---
    showDiff(versionNo) {
        const ver = this.state.currentPrompt.versions.find(v => v.version_no === versionNo);
        const currentText = this.dom.inputs.text.value;

        const html = Utils.diffWords(ver.prompt_text, currentText);

        const container = document.getElementById('diff-output');
        container.innerHTML = `
            <p><strong>Comparing Version ${versionNo} (Red) vs Current Editor (Green)</strong></p>
            <hr>
            <div>${html}</div>
        `;

        document.getElementById('btn-restore-version').onclick = () => {
            this.restoreVersion(versionNo);
            document.getElementById('modal-diff').close();
        };

        document.getElementById('modal-diff').showModal();
    }

    restoreVersion(versionNo) {
        const ver = this.state.currentPrompt.versions.find(v => v.version_no === versionNo);
        if (!ver) return;

        this.dom.inputs.text.value = ver.prompt_text;
        this.dom.inputs.notes.value = `Restored from V${versionNo}: ${ver.notes}`;
        this.setDirty(true);
        this.saveCurrent(true);
        alert(`Restored Version ${versionNo}`);
    }

    // --- TEMPLATES SYSTEM ---

    openTemplatePicker() {
        const modal = document.getElementById('modal-template-picker');
        const list = document.getElementById('template-picker-list');
        list.innerHTML = '';

        const sorted = [...this.state.templates].sort((a, b) => {
            if (a.is_favourite === b.is_favourite) return (a.order || 0) - (b.order || 0);
            return a.is_favourite ? -1 : 1;
        });

        sorted.forEach(t => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <span class="tmpl-name">${t.is_favourite ? '★ ' : ''}${Utils.escapeHtml(t.description)}</span>
                <span class="tmpl-note">${Utils.escapeHtml(t.notes || "No additional notes")}</span>
            `;
            div.onclick = () => this.handleTemplateSelection(t);
            list.appendChild(div);
        });

        const search = document.getElementById('template-search');
        if (search) {
            search.oninput = () => {
                const term = search.value.toLowerCase();
                Array.from(list.children).forEach(child => {
                    child.style.display = child.textContent.toLowerCase().includes(term) ? 'flex' : 'none';
                });
            };
            search.value = '';
        }

        modal.showModal();
    }

    handleTemplateSelection(template) {
        document.getElementById('modal-template-picker').close();
        const regex = /\$\{([^}]+)\}/g;
        const vars = [...template.template_text.matchAll(regex)].map(m => m[1]);
        const uniqueVars = [...new Set(vars)];

        if (uniqueVars.length > 0) {
            this.openVariableModal(template.template_text, uniqueVars, (text) => {
                this.insertAtCursor(text);
            });
        } else {
            this.insertAtCursor(template.template_text);
        }
    }

    openVariableModal(templateText, variables, onConfirm, actionLabel = "Insert") {
        const modal = document.getElementById('modal-template-vars');
        const container = document.getElementById('template-vars-container');
        container.innerHTML = '';

        variables.forEach(v => {
            const wrapper = document.createElement('div');
            wrapper.className = 'field-group';
            wrapper.innerHTML = `<label>${Utils.escapeHtml(v)}</label><input type="text" data-var="${Utils.escapeHtml(v)}" class="var-input">`;
            container.appendChild(wrapper);
        });

        const confirmBtn = document.getElementById('btn-confirm-vars');
        confirmBtn.textContent = actionLabel;

        // Remove old listeners to prevent stacking if this was just addingListener (it was assigning .onclick, so it's fine)
        confirmBtn.onclick = () => {
            let text = templateText;
            container.querySelectorAll('.var-input').forEach(inp => {
                const key = inp.dataset.var;
                const val = inp.value;
                // Escape regex special chars in key if necessary? 
                // key comes from match, so it might contain chars.
                // Simplified replacement:
                text = text.split(`\$\{${key}\}`).join(val);
            });
            onConfirm(text);
            modal.close();
        };

        modal.showModal();

        // Auto-focus first input
        const firstInput = container.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    insertAtCursor(text) {
        const textarea = this.dom.inputs.text;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const oldVal = textarea.value;

        textarea.value = oldVal.substring(0, start) + text + oldVal.substring(end);
        this.setDirty(true);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }

    // --- TEMPLATE MANAGER ---
    openTemplateManager() {
        this.renderTemplateManagerList();
        document.getElementById('modal-manage-templates').showModal();

        const safeBind = (id, handler) => {
            const el = document.getElementById(id);
            if (el) el.onclick = handler;
        };

        safeBind('btn-create-template', () => this.editTemplate(null));
        safeBind('btn-save-template', () => this.saveTemplate());
        safeBind('btn-delete-template', () => this.deleteTemplate());
        safeBind('btn-dup-template', () => this.duplicateTemplate());
    }

    renderTemplateManagerList() {
        const list = document.getElementById('manage-template-list');
        list.innerHTML = '';
        this.state.templates.forEach(t => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<span class="tmpl-name">${t.is_favourite ? '★ ' : ''}${Utils.escapeHtml(t.description)}</span>`;
            div.onclick = () => this.editTemplate(t);
            list.appendChild(div);
        });
    }

    editTemplate(t) {
        const idIn = document.getElementById('tmpl-id');
        const descIn = document.getElementById('tmpl-desc');
        const notesIn = document.getElementById('tmpl-notes');
        const textIn = document.getElementById('tmpl-text');
        const favIn = document.getElementById('tmpl-fav');

        if (t) {
            idIn.value = t.id;
            descIn.value = t.description;
            notesIn.value = t.notes || "";
            textIn.value = t.template_text;
            favIn.checked = t.is_favourite;
        } else {
            idIn.value = '';
            descIn.value = '';
            notesIn.value = '';
            textIn.value = '';
            favIn.checked = false;
        }
    }

    async saveTemplate() {
        const id = document.getElementById('tmpl-id').value || Utils.generateId();
        const tmpl = {
            id: id,
            description: document.getElementById('tmpl-desc').value,
            notes: document.getElementById('tmpl-notes').value,
            template_text: document.getElementById('tmpl-text').value,
            is_favourite: document.getElementById('tmpl-fav').checked,
            order: 0
        };

        await this.persistTemplate(tmpl);

        const idx = this.state.templates.findIndex(x => x.id === id);
        if (idx >= 0) this.state.templates[idx] = tmpl;
        else this.state.templates.push(tmpl);

        this.renderTemplateManagerList();
        alert('Template Saved');
    }

    async deleteTemplate() {
        const id = document.getElementById('tmpl-id').value;
        if (!id) return;
        if (!confirm('Delete template?')) return;

        await this.removeTemplate(id);

        this.state.templates = this.state.templates.filter(t => t.id !== id);
        this.editTemplate(null);
        this.renderTemplateManagerList();
    }

    async duplicateTemplate() {
        const id = document.getElementById('tmpl-id').value;
        const original = this.state.templates.find(t => t.id === id);
        if (!original) return;

        const copy = { ...original, id: Utils.generateId(), description: original.description + ' [COPY]' };
        await this.persistTemplate(copy);

        this.state.templates.push(copy);
        this.renderTemplateManagerList();
    }

    // --- IMPORT / EXPORT ---

    exportAll() {
        const exportData = {
            prompts: this.state.prompts.map(p => DataMapper.promptToExport(p)),
            templates: this.state.templates.map(t => DataMapper.templateToExport(t))
        };
        const date = new Date().toISOString().split('T')[0];
        Utils.downloadJSON(exportData, `prompt-manager-backup-${date}.json`);
    }

    exportSingle() {
        if (!this.state.currentPrompt) return;
        const data = {
            prompt: DataMapper.promptToExport(this.state.currentPrompt)
        };
        const date = new Date().toISOString().split('T')[0];
        const safeTitle = this.state.currentPrompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        Utils.downloadJSON(data, `${safeTitle}-${date}.json`);
    }

    handleImportFull(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                this.showLoading(true);
                const data = JSON.parse(e.target.result);
                if (!data.prompts && !data.templates) throw new Error("Invalid Backup Format");

                if (!confirm("This will add/overwrite data to your current storage. Continue?")) {
                    this.showLoading(false);
                    return;
                }

                // If Local, clear first (legacy behavior). If Vault, just add/overwrite.
                if (this.state.storageMode === STORAGE_MODE.LOCAL) {
                    await this.store.clearAll();
                }

                const prompts = (data.prompts || []).map(p => DataMapper.promptFromImport(p));
                const templates = (data.templates || []).map(t => DataMapper.templateFromImport(t));

                // Use helper methods for consistency
                await Promise.all(prompts.map(p => this.persistPrompt(p)));
                await Promise.all(templates.map(t => this.persistTemplate(t)));

                alert("Backup Restored Successfully.");
                await this.loadData();
                this.renderSidebar();
                this.updateVaultUI();
                this.showLoading(false);

            } catch (err) {
                console.error(err);
                alert("Import Failed: " + err.message);
                this.showLoading(false);
            }
        };
        reader.readAsText(file);
    }

    handleImportSingle(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);

                let pRaw = null;
                if (data.prompt) pRaw = data.prompt;
                else if (data.prompt_title || data.title) pRaw = data;
                else throw new Error("File does not appear to contain a valid prompt.");

                const pInternal = DataMapper.promptFromImport(pRaw);
                pInternal.id = Utils.generateId();
                pInternal.title = pInternal.title + " (Imported)";

                await this.persistPrompt(pInternal);

                alert("Prompt Imported Successfully!");
                document.getElementById('modal-import-export').close();

                await this.loadData();
                this.renderSidebar();
                this.populateFilterDropdowns();
                if (pInternal.id) this.loadEditor(pInternal.id);

            } catch (err) {
                console.error(err);
                alert("Import Failed: " + err.message);
            }
        };
        reader.readAsText(file);
    }
    updateSearchPlaceholder(text) {
        if (this.dom.filters.search) this.dom.filters.search.placeholder = text;
    }
}

// Initialise App
window.app = new App(); // Attach to window for debugging
window.addEventListener('DOMContentLoaded', () => window.app.init());