// People Picker Component
// A searchable dropdown component for selecting people

/**
 * Dummy people data
 */
const DUMMY_PEOPLE = [
    { id: '1', name: 'John Smith', email: 'john.smith@cohesity.com', department: 'Engineering' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@cohesity.com', department: 'Legal' },
    { id: '3', name: 'Michael Chen', email: 'michael.chen@cohesity.com', department: 'Sales' },
    { id: '4', name: 'Emily Davis', email: 'emily.davis@cohesity.com', department: 'Marketing' },
    { id: '5', name: 'David Wilson', email: 'david.wilson@cohesity.com', department: 'Engineering' },
    { id: '6', name: 'Lisa Anderson', email: 'lisa.anderson@cohesity.com', department: 'HR' },
    { id: '7', name: 'Robert Taylor', email: 'robert.taylor@cohesity.com', department: 'Finance' },
    { id: '8', name: 'Jennifer Martinez', email: 'jennifer.martinez@cohesity.com', department: 'Legal' },
    { id: '9', name: 'James Brown', email: 'james.brown@cohesity.com', department: 'Operations' },
    { id: '10', name: 'Maria Garcia', email: 'maria.garcia@cohesity.com', department: 'Engineering' },
    { id: '11', name: 'William Lee', email: 'william.lee@cohesity.com', department: 'Sales' },
    { id: '12', name: 'Patricia White', email: 'patricia.white@cohesity.com', department: 'Marketing' },
    { id: '13', name: 'Richard Harris', email: 'richard.harris@cohesity.com', department: 'Legal' },
    { id: '14', name: 'Linda Clark', email: 'linda.clark@cohesity.com', department: 'Engineering' },
    { id: '15', name: 'Joseph Lewis', email: 'joseph.lewis@cohesity.com', department: 'Finance' }
];

/**
 * Create a people picker component
 * @param {string} containerId - The ID of the container element
 * @param {Object} options - Configuration options
 * @returns {Object} People picker instance with methods
 */
export function createPeoplePicker(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found`);
        return null;
    }

    // Get people data from localStorage or use dummy data
    const getPeople = () => {
        try {
            const storedUsers = localStorage.getItem('legalFrontDoor_users');
            if (storedUsers) {
                const users = JSON.parse(storedUsers);
                if (Array.isArray(users) && users.length > 0) {
                    return users;
                }
            }
        } catch (e) {
            console.error('Error loading users from localStorage:', e);
        }
        return DUMMY_PEOPLE;
    };

    const peopleData = getPeople();

    const {
        placeholder = 'Search for a person...',
        allowClear = true,
        onSelect = null,
        onClear = null,
        value = null
    } = options;

    let selectedPerson = value ? peopleData.find(p => p.id === value) : null;
    let isOpen = false;
    
    // M3 FIX: Store bound handler for cleanup
    let boundDocumentClickHandler = null;

    // Create the people picker HTML structure
    const pickerHTML = `
        <div class="people-picker">
            <div class="people-picker-input-wrapper">
                <input 
                    type="text" 
                    class="people-picker-input form-control" 
                    placeholder="${placeholder}"
                    autocomplete="off"
                    readonly
                />
                <div class="people-picker-actions">
                    ${allowClear && selectedPerson ? '<button type="button" class="people-picker-clear" aria-label="Clear selection">&times;</button>' : ''}
                    <button type="button" class="people-picker-toggle" aria-label="Toggle dropdown">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="people-picker-dropdown" style="display: none;">
                <div class="people-picker-search">
                    <input 
                        type="text" 
                        class="people-picker-search-input" 
                        placeholder="Type to search..."
                        autocomplete="off"
                    />
                </div>
                <div class="people-picker-list"></div>
            </div>
        </div>
    `;

    container.innerHTML = pickerHTML;

    const pickerElement = container.querySelector('.people-picker');
    const inputWrapper = container.querySelector('.people-picker-input-wrapper');
    const input = container.querySelector('.people-picker-input');
    const toggleBtn = container.querySelector('.people-picker-toggle');
    const dropdown = container.querySelector('.people-picker-dropdown');
    const searchInput = container.querySelector('.people-picker-search-input');
    const list = container.querySelector('.people-picker-list');

    // Helper to get current clear button
    function getClearButton() {
        return container.querySelector('.people-picker-clear');
    }

    // Update display based on selected person
    function updateDisplay() {
        const clearBtn = getClearButton();
        if (selectedPerson) {
            input.value = selectedPerson.name;
            input.classList.add('has-value');
            if (allowClear && !clearBtn) {
                const actions = container.querySelector('.people-picker-actions');
                const clear = document.createElement('button');
                clear.type = 'button';
                clear.className = 'people-picker-clear';
                clear.setAttribute('aria-label', 'Clear selection');
                clear.innerHTML = '&times;';
                clear.addEventListener('click', handleClear);
                actions.insertBefore(clear, toggleBtn);
            }
        } else {
            input.value = '';
            input.classList.remove('has-value');
            if (clearBtn) {
                clearBtn.remove();
            }
        }
    }

    // Filter people based on search query
    function filterPeople(query) {
        if (!query || query.trim() === '') {
            return peopleData;
        }
        
        const lowerQuery = query.toLowerCase();
        return peopleData.filter(person => 
            person.name.toLowerCase().includes(lowerQuery) ||
            person.email.toLowerCase().includes(lowerQuery) ||
            person.department.toLowerCase().includes(lowerQuery)
        );
    }

    // Render people list
    function renderPeopleList(people) {
        if (people.length === 0) {
            list.innerHTML = '<div class="people-picker-empty">No people found</div>';
            return;
        }

        list.innerHTML = people.map(person => `
            <div class="people-picker-item" data-person-id="${person.id}">
                <div class="people-picker-item-avatar">
                    ${person.name.charAt(0).toUpperCase()}
                </div>
                <div class="people-picker-item-info">
                    <div class="people-picker-item-name">${person.name}</div>
                    <div class="people-picker-item-details">${person.email} • ${person.department}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        list.querySelectorAll('.people-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                const personId = item.getAttribute('data-person-id');
                const person = peopleData.find(p => p.id === personId);
                if (person) {
                    selectPerson(person);
                }
            });
        });
    }

    // Select a person
    function selectPerson(person) {
        selectedPerson = person;
        updateDisplay();
        closeDropdown();
        
        if (onSelect) {
            onSelect(person);
        }

        // Trigger change event
        const event = new CustomEvent('peoplePickerChange', {
            detail: { person, value: person.id }
        });
        container.dispatchEvent(event);
    }

    // Clear selection
    function handleClear(e) {
        e.stopPropagation();
        selectedPerson = null;
        updateDisplay();
        closeDropdown();
        
        if (onClear) {
            onClear();
        }

        // Trigger change event
        const event = new CustomEvent('peoplePickerChange', {
            detail: { person: null, value: null }
        });
        container.dispatchEvent(event);
    }

    // Open dropdown
    function openDropdown() {
        isOpen = true;
        dropdown.style.display = 'block';
        pickerElement.classList.add('is-open');
        searchInput.focus();
        renderPeopleList(peopleData);
    }

    // Close dropdown
    function closeDropdown() {
        isOpen = false;
        dropdown.style.display = 'none';
        pickerElement.classList.remove('is-open');
        searchInput.value = '';
    }

    // Toggle dropdown
    function toggleDropdown() {
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    // Event listeners
    inputWrapper.addEventListener('click', (e) => {
        const clearBtn = getClearButton();
        if (e.target !== clearBtn && e.target !== clearBtn?.firstChild) {
            toggleDropdown();
        }
    });

    // Handle clear button clicks (delegated since button may be created/destroyed)
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('people-picker-clear') || e.target.closest('.people-picker-clear')) {
            e.stopPropagation();
            handleClear(e);
        }
    });

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const filtered = filterPeople(query);
        renderPeopleList(filtered);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
            input.focus();
        }
    });

    // Close dropdown when clicking outside - M3 FIX: Store reference for cleanup
    boundDocumentClickHandler = (e) => {
        if (!pickerElement.contains(e.target)) {
            closeDropdown();
        }
    };
    document.addEventListener('click', boundDocumentClickHandler);

    // Initialize display
    updateDisplay();

    // Return public API
    return {
        getValue: () => selectedPerson ? selectedPerson.id : null,
        getPerson: () => selectedPerson,
        setValue: (personId) => {
            const person = peopleData.find(p => p.id === personId);
            if (person) {
                selectPerson(person);
            }
        },
        clear: () => {
            handleClear({ stopPropagation: () => {} });
        },
        // M3 FIX: Cleanup method to prevent memory leaks
        destroy: () => {
            if (boundDocumentClickHandler) {
                document.removeEventListener('click', boundDocumentClickHandler);
                boundDocumentClickHandler = null;
            }
            if (container) {
                container.innerHTML = '';
            }
        }
    };
}

