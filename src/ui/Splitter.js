/**
 * Splitter - Drag-to-resize pane handler
 * Manages horizontal and vertical splitters with localStorage persistence
 */
export class Splitter {
    constructor() {
        this.isDragging = false;
        this.currentSplitter = null;
        this.init();
    }

    /**
     * Initialize all splitter elements with event listeners
     */
    init() {
        document.querySelectorAll('.splitter').forEach(el => {
            el.addEventListener('mousedown', (e) => this.startDrag(e, el));
            // Touch support for tablets
            el.addEventListener('touchstart', (e) => this.startDrag(e, el), { passive: false });
        });
    }

    /**
     * Begin drag operation
     * @param {MouseEvent|TouchEvent} e - The initiating event
     * @param {HTMLElement} splitter - The splitter element
     */
    startDrag(e, splitter) {
        e.preventDefault();
        this.isDragging = true;
        this.currentSplitter = splitter;

        const isHorizontal = splitter.dataset.splitter === 'horizontal';
        splitter.classList.add('dragging');
        document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (e) => {
            if (!this.isDragging) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            if (isHorizontal) {
                // Horizontal splitter: resize left pane width
                const width = Math.max(200, Math.min(450, clientX));
                document.documentElement.style.setProperty('--pane-nav-width', `${width}px`);
            } else {
                // Vertical splitter: resize top/bottom in right pane
                const container = splitter.parentElement;
                const rect = container.getBoundingClientRect();
                const offsetY = clientY - rect.top;
                const percentage = (offsetY / rect.height) * 100;
                const clampedPercentage = Math.max(15, Math.min(85, percentage));
                document.documentElement.style.setProperty('--pane-list-height', `${clampedPercentage}%`);
            }
        };

        const onMouseUp = () => {
            this.isDragging = false;
            splitter.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);

            this.saveSizes();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onMouseMove, { passive: false });
        document.addEventListener('touchend', onMouseUp);
    }

    /**
     * Save current pane sizes to localStorage
     */
    saveSizes() {
        const sizes = {
            navWidth: getComputedStyle(document.documentElement).getPropertyValue('--pane-nav-width').trim(),
            listHeight: getComputedStyle(document.documentElement).getPropertyValue('--pane-list-height').trim()
        };
        try {
            localStorage.setItem('pane-sizes', JSON.stringify(sizes));
        } catch (e) {
            console.warn('Could not save pane sizes to localStorage:', e);
        }
    }

    /**
     * Load saved pane sizes from localStorage
     */
    loadSizes() {
        try {
            const saved = localStorage.getItem('pane-sizes');
            if (saved) {
                const { navWidth, listHeight } = JSON.parse(saved);
                if (navWidth) {
                    document.documentElement.style.setProperty('--pane-nav-width', navWidth);
                }
                if (listHeight) {
                    document.documentElement.style.setProperty('--pane-list-height', listHeight);
                }
            }
        } catch (e) {
            console.warn('Could not load pane sizes from localStorage:', e);
        }
    }

    /**
     * Reset pane sizes to defaults
     */
    resetSizes() {
        document.documentElement.style.setProperty('--pane-nav-width', '280px');
        document.documentElement.style.setProperty('--pane-list-height', '40%');
        localStorage.removeItem('pane-sizes');
    }
}
