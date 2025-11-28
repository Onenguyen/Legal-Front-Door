// Multi-select dropdown component
// M3 FIX: Added proper cleanup methods to prevent memory leaks
export class MultiSelect {
    constructor(selectId, options = {}) {
        this.select = document.getElementById(selectId);
        this.initialized = false;
        
        if (!this.select) return;
        
        this.placeholder = options.placeholder || this.select.getAttribute('data-placeholder') || 'Select options';
        this.onChange = options.onChange || (() => {});
        this.values = [];
        
        // M3 FIX: Bind handlers for cleanup
        this._boundDocumentClick = this._handleDocumentClick.bind(this);
        
        this.init();
        this.initialized = true;
    }
    
    // M3 FIX: Separate handler method for cleanup
    _handleDocumentClick(e) {
        if (!this.container.contains(e.target)) {
            this.dropdown.classList.remove('show');
        }
    }
    
    init() {
        this.select.style.display = 'none';
        
        // Generate unique ID for ARIA relationships
        this.uniqueId = 'multiselect-' + Math.random().toString(36).substr(2, 9);
        
        // Container
        this.container = document.createElement('div');
        this.container.className = 'multi-select-container';
        
        // Button (Display) - with ARIA attributes for accessibility
        this.button = document.createElement('div');
        this.button.className = 'multi-select-button form-control';
        this.button.setAttribute('role', 'combobox');
        this.button.setAttribute('aria-haspopup', 'listbox');
        this.button.setAttribute('aria-expanded', 'false');
        this.button.setAttribute('aria-controls', this.uniqueId + '-listbox');
        this.button.setAttribute('tabindex', '0');
        this.button.innerHTML = `<span>${this.placeholder}</span><span class="arrow" aria-hidden="true">▼</span>`;
        
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.multi-select-dropdown').forEach(d => {
                if (d !== this.dropdown) d.classList.remove('show');
            });
            this.toggleDropdown();
        });
        
        // Keyboard navigation
        this.button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleDropdown();
            } else if (e.key === 'Escape' && this.dropdown.classList.contains('show')) {
                e.preventDefault();
                this.dropdown.classList.remove('show');
                this.button.setAttribute('aria-expanded', 'false');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!this.dropdown.classList.contains('show')) {
                    this.toggleDropdown();
                }
                // Focus first checkbox in dropdown
                const firstCheckbox = this.dropdown.querySelector('input[type="checkbox"]');
                if (firstCheckbox) firstCheckbox.focus();
            }
        });
        
        // Dropdown - with ARIA listbox role
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'multi-select-dropdown';
        this.dropdown.setAttribute('role', 'listbox');
        this.dropdown.setAttribute('id', this.uniqueId + '-listbox');
        this.dropdown.setAttribute('aria-multiselectable', 'true');
        
        // Options with ARIA support
        Array.from(this.select.options).forEach((option, index) => {
            if (option.value === '') return; // Skip placeholder/empty option
            
            const item = document.createElement('div');
            item.className = 'multi-select-item';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', option.selected.toString());
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option.value;
            checkbox.checked = option.selected;
            checkbox.id = this.uniqueId + '-option-' + index;
            
            const label = document.createElement('label');
            label.textContent = option.text;
            label.setAttribute('for', checkbox.id);
            
            item.appendChild(checkbox);
            item.appendChild(label);
            
            item.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                item.setAttribute('aria-selected', checkbox.checked.toString());
                this.updateSelection();
            });
            
            // Keyboard navigation within dropdown
            checkbox.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.dropdown.classList.remove('show');
                    this.button.setAttribute('aria-expanded', 'false');
                    this.button.focus();
                }
            });
            
            this.dropdown.appendChild(item);
        });
        
        this.container.appendChild(this.button);
        this.container.appendChild(this.dropdown);
        
        this.select.parentNode.insertBefore(this.container, this.select);
        
        // Close when clicking outside - M3 FIX: Use bound handler for cleanup
        document.addEventListener('click', this._boundDocumentClick);
    }
    
    toggleDropdown() {
        const isOpen = this.dropdown.classList.toggle('show');
        this.button.classList.toggle('active');
        this.button.setAttribute('aria-expanded', isOpen.toString());
    }
    
    updateSelection() {
        const checkboxes = this.dropdown.querySelectorAll('input[type="checkbox"]');
        const selectedValues = [];
        const selectedTexts = [];
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                selectedValues.push(cb.value);
                selectedTexts.push(cb.nextSibling.textContent);
            }
        });
        
        this.values = selectedValues;
        
        // Update button text
        const textSpan = this.button.querySelector('span');
        if (selectedValues.length === 0) {
            textSpan.textContent = this.placeholder;
            this.button.classList.remove('has-value');
        } else {
            this.button.classList.add('has-value');
            if (selectedValues.length <= 2) {
                textSpan.textContent = selectedTexts.join(', ');
            } else {
                textSpan.textContent = `${selectedValues.length} selected`;
            }
        }
        
        // Trigger change callback
        this.onChange(selectedValues);
    }
    
    getValues() {
        return this.values;
    }
    
    setValues(values) {
        if (!this.initialized || !this.dropdown) return;
        
        if (!Array.isArray(values)) {
            values = [values];
        }
        
        const checkboxes = this.dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = values.includes(cb.value);
        });
        
        this.updateSelection();
    }
    
    clear() {
        if (!this.initialized || !this.dropdown) return;
        
        const checkboxes = this.dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        
        this.updateSelection();
    }
    
    // M3 FIX: Cleanup method to prevent memory leaks
    destroy() {
        if (!this.initialized) return;
        
        // Remove document-level event listener
        document.removeEventListener('click', this._boundDocumentClick);
        
        // Remove the container from DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // Show the original select again
        if (this.select) {
            this.select.style.display = '';
        }
        
        this.initialized = false;
    }
}

// Also expose globally for backwards compatibility with non-module scripts
if (typeof window !== 'undefined') {
    window.MultiSelect = MultiSelect;
}

