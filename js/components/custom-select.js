// Custom Select Component - App-styled dropdown replacement
// Transforms native <select> elements into custom styled dropdowns

export class CustomSelect {
    constructor(selectElement, options = {}) {
        this.select = selectElement;
        this.options = {
            searchable: options.searchable ?? (selectElement.options.length > 8),
            searchPlaceholder: options.searchPlaceholder || 'Search...',
            ...options
        };
        
        this.isOpen = false;
        this.highlightedIndex = -1;
        this.filteredOptions = [];
        
        this.init();
    }
    
    init() {
        // Hide native select but keep it for form submission
        this.select.classList.add('native-select');
        this.select.setAttribute('tabindex', '-1');
        
        // Create custom select wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'custom-select';
        
        // Create trigger button
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'custom-select-trigger';
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');
        
        // Create value display
        this.valueDisplay = document.createElement('span');
        this.valueDisplay.className = 'custom-select-value';
        
        // Create arrow
        const arrow = document.createElement('span');
        arrow.className = 'custom-select-arrow';
        arrow.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        
        this.trigger.appendChild(this.valueDisplay);
        this.trigger.appendChild(arrow);
        
        // Create dropdown
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'custom-select-dropdown';
        this.dropdown.setAttribute('role', 'listbox');
        
        // Add search if enabled
        if (this.options.searchable) {
            this.searchWrapper = document.createElement('div');
            this.searchWrapper.className = 'custom-select-search';
            
            this.searchInput = document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.placeholder = this.options.searchPlaceholder;
            this.searchInput.setAttribute('aria-label', 'Search options');
            
            this.searchWrapper.appendChild(this.searchInput);
            this.dropdown.appendChild(this.searchWrapper);
        }
        
        // Create options container
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'custom-select-options';
        this.dropdown.appendChild(this.optionsContainer);
        
        // Build the structure
        this.wrapper.appendChild(this.trigger);
        this.wrapper.appendChild(this.dropdown);
        
        // Insert wrapper after native select
        this.select.parentNode.insertBefore(this.wrapper, this.select.nextSibling);
        this.wrapper.appendChild(this.select);
        
        // Build options
        this.buildOptions();
        this.updateDisplay();
        
        // Bind events
        this.bindEvents();
    }
    
    buildOptions(filter = '') {
        this.optionsContainer.innerHTML = '';
        this.filteredOptions = [];
        
        const filterLower = filter.toLowerCase();
        let hasVisibleOptions = false;
        
        Array.from(this.select.options).forEach((option, index) => {
            // Skip options that don't match filter
            if (filter && !option.text.toLowerCase().includes(filterLower)) {
                return;
            }
            
            hasVisibleOptions = true;
            
            const optionEl = document.createElement('div');
            optionEl.className = 'custom-select-option';
            optionEl.setAttribute('role', 'option');
            optionEl.setAttribute('data-value', option.value);
            optionEl.setAttribute('data-index', index);
            optionEl.textContent = option.text;
            
            // Mark placeholder option
            if (option.value === '' || option.disabled) {
                optionEl.classList.add('disabled');
            }
            
            // Mark selected option
            if (option.selected && option.value !== '') {
                optionEl.classList.add('selected');
            }
            
            this.filteredOptions.push({ element: optionEl, index });
            this.optionsContainer.appendChild(optionEl);
        });
        
        // Show no results message
        if (!hasVisibleOptions) {
            const noResults = document.createElement('div');
            noResults.className = 'custom-select-no-results';
            noResults.textContent = 'No options found';
            this.optionsContainer.appendChild(noResults);
        }
    }
    
    updateDisplay() {
        const selectedOption = this.select.options[this.select.selectedIndex];
        
        if (selectedOption && selectedOption.value !== '') {
            this.valueDisplay.textContent = selectedOption.text;
            this.trigger.classList.remove('placeholder');
        } else {
            // Show placeholder text
            const placeholder = this.select.options[0];
            this.valueDisplay.textContent = placeholder ? placeholder.text : 'Select an option';
            this.trigger.classList.add('placeholder');
        }
    }
    
    bindEvents() {
        // Toggle dropdown on trigger click
        this.trigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });
        
        // Option selection
        this.optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (option && !option.classList.contains('disabled')) {
                this.selectOption(option);
            }
        });
        
        // Hover highlight
        this.optionsContainer.addEventListener('mouseover', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (option && !option.classList.contains('disabled')) {
                this.highlightOption(option);
            }
        });
        
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.buildOptions(e.target.value);
                this.highlightedIndex = -1;
            });
            
            // Prevent dropdown from closing when clicking search
            this.searchInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Keyboard navigation
        this.trigger.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.dropdown.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) {
                this.close();
            }
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                this.trigger.focus();
            }
        });
        
        // Sync with native select changes
        this.select.addEventListener('change', () => {
            this.updateDisplay();
            this.buildOptions();
        });
    }
    
    handleKeydown(e) {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (!this.isOpen) {
                    this.open();
                } else if (this.highlightedIndex >= 0) {
                    const option = this.filteredOptions[this.highlightedIndex];
                    if (option && !option.element.classList.contains('disabled')) {
                        this.selectOption(option.element);
                    }
                }
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                if (!this.isOpen) {
                    this.open();
                } else {
                    this.navigateOptions(1);
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (this.isOpen) {
                    this.navigateOptions(-1);
                }
                break;
                
            case 'Tab':
                if (this.isOpen) {
                    this.close();
                }
                break;
                
            case 'Home':
                if (this.isOpen) {
                    e.preventDefault();
                    this.highlightedIndex = -1;
                    this.navigateOptions(1);
                }
                break;
                
            case 'End':
                if (this.isOpen) {
                    e.preventDefault();
                    this.highlightedIndex = this.filteredOptions.length;
                    this.navigateOptions(-1);
                }
                break;
                
            default:
                // Type to search (if not using search input)
                if (!this.options.searchable && e.key.length === 1) {
                    this.typeToSearch(e.key);
                }
        }
    }
    
    navigateOptions(direction) {
        const options = this.filteredOptions.filter(o => !o.element.classList.contains('disabled'));
        if (options.length === 0) return;
        
        // Find current position in filtered options
        let currentPos = options.findIndex((o, i) => i === this.highlightedIndex);
        let newPos = currentPos + direction;
        
        // Wrap around
        if (newPos < 0) newPos = options.length - 1;
        if (newPos >= options.length) newPos = 0;
        
        this.highlightedIndex = newPos;
        this.highlightOption(options[newPos].element);
    }
    
    highlightOption(optionEl) {
        // Remove highlight from all
        this.optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('highlighted');
        });
        
        // Add highlight to target
        optionEl.classList.add('highlighted');
        
        // Update index
        const index = this.filteredOptions.findIndex(o => o.element === optionEl);
        if (index >= 0) {
            this.highlightedIndex = index;
        }
        
        // Scroll into view
        optionEl.scrollIntoView({ block: 'nearest' });
    }
    
    typeToSearch(char) {
        // Simple type-to-search: find first option starting with typed character
        const charLower = char.toLowerCase();
        const matchingOption = this.filteredOptions.find(o => 
            !o.element.classList.contains('disabled') &&
            o.element.textContent.toLowerCase().startsWith(charLower)
        );
        
        if (matchingOption) {
            this.highlightOption(matchingOption.element);
            if (!this.isOpen) {
                this.selectOption(matchingOption.element);
            }
        }
    }
    
    selectOption(optionEl) {
        const value = optionEl.getAttribute('data-value');
        const index = parseInt(optionEl.getAttribute('data-index'), 10);
        
        // Update native select
        this.select.selectedIndex = index;
        this.select.value = value;
        
        // Mark the data-touched attribute for validation styling
        this.select.setAttribute('data-touched', 'true');
        
        // Dispatch change event
        this.select.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Update display
        this.updateDisplay();
        this.buildOptions();
        
        // Close dropdown
        this.close();
        this.trigger.focus();
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.wrapper.classList.add('open');
        this.trigger.setAttribute('aria-expanded', 'true');
        
        // Reset search
        if (this.searchInput) {
            this.searchInput.value = '';
            this.buildOptions();
            // Focus search input
            setTimeout(() => this.searchInput.focus(), 50);
        }
        
        // Highlight current selection
        const selectedOption = this.optionsContainer.querySelector('.custom-select-option.selected');
        if (selectedOption) {
            this.highlightOption(selectedOption);
        } else {
            this.highlightedIndex = -1;
        }
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.wrapper.classList.remove('open');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.highlightedIndex = -1;
        
        // Remove highlights
        this.optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('highlighted');
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    // Public API methods
    getValue() {
        return this.select.value;
    }
    
    setValue(value) {
        this.select.value = value;
        this.updateDisplay();
        this.buildOptions();
    }
    
    refresh() {
        this.buildOptions();
        this.updateDisplay();
    }
    
    destroy() {
        // Remove wrapper, restore native select
        this.select.classList.remove('native-select');
        this.select.removeAttribute('tabindex');
        this.wrapper.parentNode.insertBefore(this.select, this.wrapper);
        this.wrapper.remove();
    }
}

// Auto-initialize all select.form-control elements
export function initCustomSelects(container = document) {
    const selects = container.querySelectorAll('select.form-control:not(.native-select)');
    const instances = [];
    
    selects.forEach(select => {
        // Skip if already initialized
        if (select.closest('.custom-select')) return;
        
        const instance = new CustomSelect(select);
        instances.push(instance);
    });
    
    return instances;
}

// Export for global access
if (typeof window !== 'undefined') {
    window.CustomSelect = CustomSelect;
    window.initCustomSelects = initCustomSelects;
}

