class MultiSelect {
    constructor(selectId, options = {}) {
        this.select = document.getElementById(selectId);
        this.initialized = false;
        
        if (!this.select) return;
        
        this.placeholder = options.placeholder || this.select.getAttribute('data-placeholder') || 'Select options';
        this.onChange = options.onChange || (() => {});
        this.values = [];
        
        this.init();
        this.initialized = true;
    }
    
    init() {
        this.select.style.display = 'none';
        
        // Container
        this.container = document.createElement('div');
        this.container.className = 'multi-select-container';
        
        // Button (Display)
        this.button = document.createElement('div');
        this.button.className = 'multi-select-button form-control';
        this.button.innerHTML = `<span>${this.placeholder}</span><span class="arrow">▼</span>`;
        
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.multi-select-dropdown').forEach(d => {
                if (d !== this.dropdown) d.classList.remove('show');
            });
            this.toggleDropdown();
        });
        
        // Dropdown
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'multi-select-dropdown';
        
        // Options
        Array.from(this.select.options).forEach(option => {
            if (option.value === '') return; // Skip placeholder/empty option
            
            const item = document.createElement('div');
            item.className = 'multi-select-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option.value;
            checkbox.checked = option.selected;
            
            const label = document.createElement('span');
            label.textContent = option.text;
            
            item.appendChild(checkbox);
            item.appendChild(label);
            
            item.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                this.updateSelection();
            });
            
            this.dropdown.appendChild(item);
        });
        
        this.container.appendChild(this.button);
        this.container.appendChild(this.dropdown);
        
        this.select.parentNode.insertBefore(this.container, this.select);
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.dropdown.classList.remove('show');
            }
        });
    }
    
    toggleDropdown() {
        this.dropdown.classList.toggle('show');
        this.button.classList.toggle('active');
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
}

