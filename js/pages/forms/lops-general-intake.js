// LOPS General Intake Form Logic - Enhanced UX
import { initializeDefaultUser, createRequest } from '../../core/state.js';
import { onReady, toTitleCase } from '../../utils/dom.js';
import { ROUTES } from '../../core/constants.js';
import { createPeoplePicker } from '../../components/people-picker.js';

// ============================================
// Constants
// ============================================

const AUTOSAVE_KEY = 'lops_intake_draft';
const AUTOSAVE_INTERVAL = 3000; // 3 seconds

// C4 FIX: Input validation limits
const VALIDATION_LIMITS = {
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 5000,
    AGREEMENT_NAME_MAX_LENGTH: 200,
    COMPANY_NAME_MAX_LENGTH: 500,
    ADDRESS_MAX_LENGTH: 500,
    CITY_MAX_LENGTH: 100,
    STATE_MAX_LENGTH: 100,
    POSTAL_CODE_MAX_LENGTH: 20,
    COUNTRY_MAX_LENGTH: 100,
    RECIPIENT_MAX_LENGTH: 200,
    NOTES_MAX_LENGTH: 2000
};

const PREFILL_STORAGE_KEYS = {
    DEPARTMENT: 'prefilledDepartment',
    REQUEST_TYPE: 'prefilledRequestType',
    TITLE: 'prefilledTitle'
};

let prefillContext = {
    department: null,
    requestType: null,
    title: null
};

// ============================================
// Helper Functions
// ============================================

/**
 * Show a conditional section with animation
 * @param {HTMLElement} section - The section element to show
 */
function showSection(section) {
    if (!section) return;
    section.style.display = 'block';
    section.classList.remove('hidden');
    // Scroll to the new section smoothly
    setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

/**
 * Increment a number counter input
 * @param {string} inputId - The ID of the input element
 */
function incrementCounter(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const currentValue = parseInt(input.value) || 0;
    input.value = currentValue + 1;
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Decrement a number counter input (minimum value is 1)
 * @param {string} inputId - The ID of the input element
 */
function decrementCounter(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const currentValue = parseInt(input.value) || 1;
    const minValue = parseInt(input.min) || 1;
    if (currentValue > minValue) {
        input.value = currentValue - 1;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// Make counter functions globally available for onclick handlers
window.incrementCounter = incrementCounter;
window.decrementCounter = decrementCounter;

/**
 * Hide a conditional section and clear its inputs
 * @param {HTMLElement} section - The section element to hide
 * @param {boolean} clearInputs - Whether to clear input values
 */
function hideSection(section, clearInputs = true) {
    if (!section) return;
    section.style.display = 'none';
    section.classList.add('hidden');
    
    if (clearInputs) {
        clearSectionInputs(section);
    }
}

/**
 * Clear all input values within a section
 * @param {HTMLElement} section - The section element
 */
function clearSectionInputs(section) {
    if (!section) return;
    
    // Clear text inputs, textareas, and selects
    section.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea, select').forEach(input => {
        input.value = '';
        removeValidationState(input.closest('.form-group'));
    });
    
    // Reset radio buttons and checkboxes to their default state
    section.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        // Respect the default checked attribute from HTML
        input.checked = input.hasAttribute('checked');
    });
    
    // Clear file inputs
    section.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
    });
    
    // Clear file list displays
    section.querySelectorAll('.file-list').forEach(list => {
        list.innerHTML = '';
    });
}

/**
 * Set required attribute on form fields
 * @param {HTMLElement} container - The container element
 * @param {boolean} required - Whether fields should be required
 * @param {string} selector - CSS selector for fields to modify
 */
function setFieldsRequired(container, required, selector = 'input, select, textarea') {
    if (!container) return;
    
    container.querySelectorAll(selector).forEach(field => {
        if (required) {
            field.setAttribute('required', 'required');
        } else {
            field.removeAttribute('required');
        }
    });
}


/**
 * Get the value of a selected radio button
 * @param {string} name - The name of the radio group
 * @returns {string|null} The selected value or null
 */
function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

/**
 * Get values of all checked checkboxes
 * @param {string} name - The name of the checkbox group
 * @returns {string[]} Array of checked values
 */
function getCheckboxValues(name) {
    const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checked).map(cb => cb.value);
}

/**
 * Display uploaded files in a file list container
 * @param {HTMLInputElement} fileInput - The file input element
 * @param {string} listId - The ID of the file list container
 */
function displayFileList(fileInput, listId) {
    const fileList = document.getElementById(listId);
    if (!fileList) return;
    
    fileList.innerHTML = '';
    
    if (fileInput.files.length > 0) {
        const ul = document.createElement('ul');
        for (let file of fileInput.files) {
            const li = document.createElement('li');
            li.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            ul.appendChild(li);
        }
        fileList.appendChild(ul);
    }
}

// ============================================
// Prefill Helpers
// ============================================

function consumePrefillValue(key) {
    try {
        const value = sessionStorage.getItem(key);
        if (value) {
            sessionStorage.removeItem(key);
            return value;
        }
    } catch (error) {
        console.warn('Unable to read sessionStorage prefill key:', key, error);
    }
    return null;
}

function loadPrefillContext() {
    prefillContext.department = consumePrefillValue(PREFILL_STORAGE_KEYS.DEPARTMENT);
    prefillContext.requestType = consumePrefillValue(PREFILL_STORAGE_KEYS.REQUEST_TYPE);
    prefillContext.title = consumePrefillValue(PREFILL_STORAGE_KEYS.TITLE);
}

function applyPrefillContext() {
    if (prefillContext.requestType) {
        const requestedType = document.querySelector(`input[name="helpType"][value="${prefillContext.requestType}"]`);
        if (requestedType && !requestedType.checked) {
            requestedType.checked = true;
            handleHelpTypeChange();
        }
    }
    updatePrefillBanner();
}

function updatePrefillBanner() {
    if (!prefillBanner || !prefillBannerDetails) return;
    
    const details = [];
    if (prefillContext.department) {
        details.push(`Department: ${prefillContext.department}`);
    }
    if (prefillContext.requestType) {
        details.push(`Request type: ${toTitleCase(prefillContext.requestType)}`);
    }
    if (prefillContext.title) {
        details.push(`Suggested title: "${prefillContext.title}"`);
    }
    
    if (details.length === 0) {
        prefillBanner.style.display = 'none';
        return;
    }
    
    prefillBanner.style.display = 'flex';
    prefillBannerDetails.textContent = details.join(' • ');
}

function clearPrefillContext() {
    prefillContext = { department: null, requestType: null, title: null };
    try {
        Object.values(PREFILL_STORAGE_KEYS).forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
        console.warn('Unable to clear prefill context:', error);
    }
    
    const selectedHelpType = document.querySelector('input[name="helpType"]:checked');
    if (selectedHelpType) {
        selectedHelpType.checked = false;
        handleHelpTypeChange();
    }
    
    updatePrefillBanner();
    updateProgress();
    updateSummary();
}

// ============================================
// Form Section References
// ============================================

let signatureSection;
let contractPullSection;
let otherSection;
let wetInkSection;
let notarizationSection;
let stateField;
let countryField;
let apostilleCountryField;
let mailingAddressSection;
let autoSaveTimer;
let submittingForOtherPicker;
let prefillBanner;
let prefillBannerDetails;
let prefillBannerAction;

// Summary panel elements
let summaryPanelToggle;
let summaryPanelClose;
let formLayout;
let summarySidebarDots;
let summarySidebarCollapsed;

const SUMMARY_COLLAPSED_KEY = 'lops_summary_collapsed';

// ============================================
// Summary Panel Toggle
// ============================================

/**
 * Toggle the summary panel visibility
 * @param {boolean} collapsed - Whether to collapse the panel
 */
function toggleSummaryPanel(collapsed) {
    if (!formLayout) return;
    
    if (collapsed) {
        formLayout.classList.add('summary-collapsed');
        updateDotPositions();
    } else {
        formLayout.classList.remove('summary-collapsed');
        if (!summarySidebarCollapsed) {
            summarySidebarCollapsed = document.getElementById('summarySidebarCollapsed');
        }
        summarySidebarCollapsed?.style.removeProperty('height');
    }
    
    // Save preference to localStorage
    try {
        localStorage.setItem(SUMMARY_COLLAPSED_KEY, collapsed ? 'true' : 'false');
    } catch (e) {
        console.error('Failed to save summary panel state:', e);
    }
}

/**
 * Load summary panel state from localStorage
 */
function loadSummaryPanelState() {
    try {
        const collapsed = localStorage.getItem(SUMMARY_COLLAPSED_KEY) === 'true';
        if (collapsed && formLayout) {
            formLayout.classList.add('summary-collapsed');
        }
    } catch (e) {
        console.error('Failed to load summary panel state:', e);
    }
}

/**
 * Update the collapsed sidebar dots based on required fields
 */
function updateSidebarDots() {
    if (!summarySidebarDots) return;
    
    const requiredFields = getRequiredFields();
    
    // Clear existing dots
    summarySidebarDots.innerHTML = '';
    
    // Field labels and element mappings
    const fieldConfig = {
        'helpType': { label: 'Help Type', element: 'input[name="helpType"]' },
        'fileToSign': { label: 'File to Sign', element: '#fileToSign' },
        'signatureType': { label: 'Signature Type', element: 'input[name="signatureType"]' },
        'wetInkOptions': { label: 'Wet Ink Options', element: 'input[name="wetInkOptions"]' },
        'scannedCopy': { label: 'Scanned Copy', element: 'input[name="scannedCopy"]' },
        'wetInkOriginals': { label: 'Wet Ink Originals', element: 'input[name="wetInkOriginals"]' },
        'notarizationLocation': { label: 'Notarization Location', element: 'input[name="notarizationLocation"]' },
        'wetInkCopies': { label: 'Number of Copies', element: '#wetInkCopies' },
        'notarizationState': { label: 'State', element: '#notarizationState' },
        'notarizationCountry': { label: 'Country', element: '#notarizationCountry' },
        'apostilleCountry': { label: 'Apostille Country', element: '#apostilleCountry' },
        'mailingRecipient': { label: 'Recipient Name', element: '#mailingRecipient' },
        'mailingAddress': { label: 'Street Address', element: '#mailingAddress' },
        'mailingCity': { label: 'City', element: '#mailingCity' },
        'mailingStateProvince': { label: 'State/Province', element: '#mailingStateProvince' },
        'mailingPostalCode': { label: 'Postal Code', element: '#mailingPostalCode' },
        'mailingCountry': { label: 'Mailing Country', element: '#mailingCountry' },
        'salesContract': { label: 'Sales Contract', element: 'input[name="salesContract"]' },
        'originatingEntity': { label: 'Originating Entity', element: 'input[name="originatingEntity"]' },
        'agreementName': { label: 'Agreement Name', element: '#agreementName' },
        'contractPullDescription': { label: 'Description', element: '#contractPullDescription' },
        'otherDescription': { label: 'Description', element: '#otherDescription' }
    };
    
    // Create dots for each required field
    requiredFields.forEach(fieldName => {
        const config = fieldConfig[fieldName];
        if (!config) return;
        
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'summary-sidebar-dot';
        dot.setAttribute('data-field', fieldName);
        dot.setAttribute('data-label', config.label);
        dot.setAttribute('data-selector', config.element); // Store selector for positioning
        dot.setAttribute('aria-label', `Go to ${config.label}`);
        
        // Check if field is completed
        if (checkFieldCompletion(fieldName)) {
            dot.classList.add('completed');
        }
        
        // Click to scroll to field
        dot.addEventListener('click', () => {
            const targetElement = document.querySelector(config.element);
            if (targetElement) {
                // Find the parent form-group for better visibility
                const formGroup = targetElement.closest('.form-group') || targetElement.closest('.form-section') || targetElement;
                formGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Focus the element if it's focusable
                if (targetElement.focus) {
                    setTimeout(() => targetElement.focus(), 500);
                }
            }
        });
        
        summarySidebarDots.appendChild(dot);
    });

    // Update positions after DOM update
    setTimeout(updateDotPositions, 100);
}

/**
 * Update the vertical positions of dots to align with their fields
 */
function updateDotPositions() {
    const formMain = document.querySelector('.form-main');
    
    if (!formMain) return;
    
    const dots = document.querySelectorAll('.summary-sidebar-dot');
    
    if (!summarySidebarCollapsed) {
        summarySidebarCollapsed = document.getElementById('summarySidebarCollapsed');
    }
    
    // Keep the collapsed sidebar the same height as the form so dots never overflow
    if (summarySidebarCollapsed && summarySidebarCollapsed.offsetParent !== null) {
        const formHeight = Math.max(formMain.scrollHeight, formMain.offsetHeight);
        summarySidebarCollapsed.style.height = `${formHeight}px`;
    }
    
    if (dots.length === 0) {
        return;
    }
    
    const formRect = formMain.getBoundingClientRect();
    // Offset for the expand button (approx 60px: 32px height + margins)
    // Actually, since .summary-sidebar-dots is absolute top 0, we align with form top.
    // But we want dots to align with the FIELDS.
    // So relativeTop = fieldTop - formTop.
    
    dots.forEach(dot => {
        const selector = dot.getAttribute('data-selector');
        if (!selector) return;
        
        // Handle radio buttons / groups where multiple elements match
        // For radio/checkbox inputs, we want the group container or the first input
        let target = document.querySelector(selector);
        
        if (target) {
            // Use closest form-group to align with the label/container
            const group = target.closest('.form-group') || target.closest('.form-section') || target;
            const rect = group.getBoundingClientRect();
            
            // Calculate top relative to formMain
            // This works because the sidebar container is aligned with formMain in the grid
            let relativeTop = rect.top - formRect.top;
            
            // Center the dot on the field label (approx 10px down)
            // or center in the group height if desired.
            // Aligning with top of group is usually best for "reading" the form.
            relativeTop += 12; 
            
            // Ensure it doesn't overlap the expand button (approx 60px reserved at top)
            // If the first field is at top, dot might be under button.
            // The button is sticky, so it floats.
            // We might want to push the sidebar content down or just let it be.
            // If we want true alignment, we let it be.
            
            dot.style.top = `${Math.max(0, relativeTop)}px`;
        }
    });
}

// ============================================
// Progress Tracking
// ============================================

function getRequiredFields() {
    const helpType = getRadioValue('helpType');
    const fields = ['helpType'];
    
    if (helpType === 'signature') {
        fields.push('fileToSign', 'signatureType');
        const signatureType = getRadioValue('signatureType');
        
        if (signatureType === 'wetInk') {
            fields.push('wetInkOptions');
            
            const wetInkOptions = getCheckboxValues('wetInkOptions');
            
            // Check if mailing is needed from "Mail original versions" checkbox
            const needsMailingFromCheckbox = wetInkOptions.includes('mailOriginals');
            
            if (wetInkOptions.includes('notarize')) {
                fields.push('notarizationLocation', 'wetInkCopies', 'scannedCopy', 'wetInkOriginals');
                
                const location = getRadioValue('notarizationLocation');
                if (location === 'unitedStates') {
                    fields.push('notarizationState');
                } else if (location === 'outsideUS') {
                    fields.push('notarizationCountry');
                }
                
                // Add apostille country if apostille is Yes
                const apostille = getRadioValue('apostille');
                if (apostille === 'yes') {
                    fields.push('apostilleCountry');
                }
                
                // Add mailing fields when "Mail originals" radio is selected under wet ink originals handling
                const wetInkOriginals = getRadioValue('wetInkOriginals');
                if (wetInkOriginals === 'mailOriginals') {
                    fields.push('mailingRecipient', 'mailingAddress', 'mailingCity', 'mailingStateProvince', 'mailingPostalCode', 'mailingCountry');
                }
            }
            
            // Also add mailing fields when "Mail original versions" checkbox is checked
            if (needsMailingFromCheckbox) {
                // Only add if not already added from above
                if (!fields.includes('mailingRecipient')) {
                    fields.push('mailingRecipient', 'mailingAddress', 'mailingCity', 'mailingStateProvince', 'mailingPostalCode', 'mailingCountry');
                }
            }
        }
    } else if (helpType === 'contractPull') {
        fields.push('salesContract', 'originatingEntity', 'agreementName', 'contractPullDescription');
    } else if (helpType === 'other') {
        fields.push('otherDescription');
    }
    
    return fields;
}

function checkFieldCompletion(fieldName) {
    switch (fieldName) {
        case 'helpType':
            return !!getRadioValue('helpType');
        case 'fileToSign':
            const fileInput = document.getElementById('fileToSign');
            return fileInput && fileInput.files.length > 0;
        case 'signatureType':
            return !!getRadioValue('signatureType');
        case 'wetInkOptions':
            return getCheckboxValues('wetInkOptions').length > 0;
        case 'scannedCopy':
            return !!getRadioValue('scannedCopy');
        case 'wetInkOriginals':
            return !!getRadioValue('wetInkOriginals');
        case 'notarizationLocation':
            return !!getRadioValue('notarizationLocation');
        case 'wetInkCopies':
            const copies = document.getElementById('wetInkCopies');
            return copies && copies.value && parseInt(copies.value) >= 1;
        case 'notarizationState':
            const state = document.getElementById('notarizationState');
            return state && state.value;
        case 'notarizationCountry':
            const country = document.getElementById('notarizationCountry');
            return country && country.value.trim();
        case 'mailingRecipient':
            const recipient = document.getElementById('mailingRecipient');
            return recipient && recipient.value.trim();
        case 'mailingAddress':
            const address = document.getElementById('mailingAddress');
            return address && address.value.trim();
        case 'mailingCity':
            const city = document.getElementById('mailingCity');
            return city && city.value.trim();
        case 'mailingStateProvince':
            const stateProvince = document.getElementById('mailingStateProvince');
            return stateProvince && stateProvince.value.trim();
        case 'mailingPostalCode':
            const postalCode = document.getElementById('mailingPostalCode');
            return postalCode && postalCode.value.trim();
        case 'mailingCountry':
            const mailingCountry = document.getElementById('mailingCountry');
            return mailingCountry && mailingCountry.value.trim();
        case 'apostilleCountry':
            const apostilleCountry = document.getElementById('apostilleCountry');
            return apostilleCountry && apostilleCountry.value.trim();
        case 'salesContract':
            return !!getRadioValue('salesContract');
        case 'originatingEntity':
            return !!getRadioValue('originatingEntity');
        case 'agreementName':
            const agreement = document.getElementById('agreementName');
            return agreement && agreement.value.trim();
        case 'contractPullDescription':
            const contractDesc = document.getElementById('contractPullDescription');
            return contractDesc && contractDesc.value.trim();
        case 'otherDescription':
            const otherDesc = document.getElementById('otherDescription');
            return otherDesc && otherDesc.value.trim();
        default:
            return false;
    }
}

function updateProgress() {
    const requiredFields = getRequiredFields();
    const completedFields = requiredFields.filter(field => checkFieldCompletion(field));
    const progress = requiredFields.length > 0 ? (completedFields.length / requiredFields.length) * 100 : 0;
    
    // Update main progress bar
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const requiredFieldsText = document.getElementById('requiredFieldsText');
    
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    if (progressText) {
        progressText.textContent = `${Math.round(progress)}% Complete`;
    }
    if (requiredFieldsText) {
        requiredFieldsText.textContent = `${completedFields.length} of ${requiredFields.length} required fields completed`;
    }
    
    // Update summary panel progress
    const summaryProgressFill = document.getElementById('summaryProgressFill');
    const summaryProgressText = document.getElementById('summaryProgressText');
    
    if (summaryProgressFill) {
        summaryProgressFill.style.width = `${progress}%`;
    }
    if (summaryProgressText) {
        summaryProgressText.textContent = `${Math.round(progress)}% Complete`;
    }
    
    // Update required fields list in summary
    updateSummaryRequiredFields(requiredFields, completedFields);
    
    // Update collapsed sidebar dots
    updateSidebarDots();
}

function updateSummaryRequiredFields(requiredFields, completedFields) {
    const summaryRequiredList = document.getElementById('summaryRequiredList');
    if (!summaryRequiredList) return;
    
    const fieldLabels = {
        'helpType': 'Select help type',
        'fileToSign': 'Upload file to sign',
        'signatureType': 'Select signature type',
        'wetInkOptions': 'Select Wet Ink options',
        'scannedCopy': 'Scanned copy preference',
        'wetInkOriginals': 'Wet Ink handling',
        'notarizationLocation': 'Notarization location',
        'wetInkCopies': 'Number of copies',
        'notarizationState': 'Notarization State',
        'notarizationCountry': 'Notarization Country',
        'apostilleCountry': 'Apostille country',
        'mailingRecipient': 'Recipient name',
        'mailingAddress': 'Mailing address',
        'mailingCity': 'City',
        'mailingStateProvince': 'State/Province',
        'mailingPostalCode': 'Postal code',
        'mailingCountry': 'Mailing country',
        'salesContract': 'Sales contract status',
        'originatingEntity': 'Originating entity',
        'agreementName': 'Agreement name',
        'contractPullDescription': 'Description',
        'otherDescription': 'Description'
    };
    
    summaryRequiredList.innerHTML = '';
    
    requiredFields.forEach(field => {
        if (!completedFields.includes(field)) {
            const li = document.createElement('li');
            li.textContent = fieldLabels[field] || field;
            summaryRequiredList.appendChild(li);
        }
    });
}

// ============================================
// Summary Panel Updates
// ============================================

function updateSummary() {
    const helpType = getRadioValue('helpType');
    const completionDate = document.getElementById('completionDate')?.value;
    
    // Update request type
    const summaryType = document.getElementById('summaryType');
    if (summaryType) {
        if (helpType) {
            const typeLabels = {
                'signature': 'Signature Request',
                'contractPull': 'Contract Pull',
                'other': 'Other Request'
            };
            summaryType.textContent = typeLabels[helpType] || 'Not selected';
        } else {
            summaryType.textContent = 'Not selected';
        }
    }
    
    // Update completion date
    const summaryDate = document.getElementById('summaryDate');
    if (summaryDate) {
        if (completionDate) {
            // Parse date parts explicitly to avoid timezone issues
            const [year, month, day] = completionDate.split('-');
            const date = new Date(year, month - 1, day);
            summaryDate.textContent = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } else {
            summaryDate.textContent = 'Not set';
        }
    }

    // Update file count
    const summaryFilesSection = document.getElementById('summaryFilesSection');
    const summaryFiles = document.getElementById('summaryFiles');
    
    if (summaryFilesSection && summaryFiles) {
        if (helpType === 'signature') {
            summaryFilesSection.style.display = 'block';
            const fileInput = document.getElementById('fileToSign');
            summaryFiles.textContent = fileInput ? fileInput.files.length : '0';
        } else {
            summaryFilesSection.style.display = 'none';
        }
    }
}

// ============================================
// Auto-save Functionality
// ============================================

function saveFormData() {
    const formData = {
        submittingForOther: submittingForOtherPicker?.getValue() || '',
        completionDate: document.getElementById('completionDate')?.value || '',
        helpType: getRadioValue('helpType'),
        // Signature fields
        signatureType: getRadioValue('signatureType'),
        needsTranslation: document.getElementById('needsTranslation')?.checked || false,
        signatureNotes: document.getElementById('signatureNotes')?.value || '',
        wetInkOptions: getCheckboxValues('wetInkOptions'),
        notarialActs: getCheckboxValues('notarialAct'),
        apostille: getRadioValue('apostille'),
        notarizationLocation: getRadioValue('notarizationLocation'),
        notarizationState: document.getElementById('notarizationState')?.value || '',
        notarizationCountry: document.getElementById('notarizationCountry')?.value || '',
        wetInkCopies: document.getElementById('wetInkCopies')?.value || '',
        scannedCopy: getRadioValue('scannedCopy'),
        wetInkOriginals: getRadioValue('wetInkOriginals'),
        // Contract pull fields
        salesContract: getRadioValue('salesContract'),
        originatingEntity: getRadioValue('originatingEntity'),
        companyNames: document.getElementById('companyNames')?.value || '',
        agreementName: document.getElementById('agreementName')?.value || '',
        contractPullDescription: document.getElementById('contractPullDescription')?.value || '',
        // Other fields
        otherDescription: document.getElementById('otherDescription')?.value || '',
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
        updateAutoSaveStatus('Draft Auto-saved');
        return true;
    } catch (e) {
        console.error('Failed to auto-save:', e);
        updateAutoSaveStatus('Auto-save Failed');
        return false;
    }
}

function loadFormData() {
    try {
        const savedData = localStorage.getItem(AUTOSAVE_KEY);
        if (!savedData) return false;
        
        const formData = JSON.parse(savedData);
        
        // Check if data is older than 7 days
        if (formData.timestamp && (Date.now() - formData.timestamp > 7 * 24 * 60 * 60 * 1000)) {
            localStorage.removeItem(AUTOSAVE_KEY);
            return false;
        }
        
        // Restore basic fields
        if (formData.submittingForOther && submittingForOtherPicker) {
            submittingForOtherPicker.setValue(formData.submittingForOther);
        }
        if (formData.completionDate) {
            const el = document.getElementById('completionDate');
            if (el) el.value = formData.completionDate;
        }
        
        // Restore help type and trigger change
        if (formData.helpType) {
            const radio = document.querySelector(`input[name="helpType"][value="${formData.helpType}"]`);
            if (radio) {
                radio.checked = true;
                handleHelpTypeChange();
            }
        }
        
        // Restore signature fields
        if (formData.signatureType) {
            setTimeout(() => {
                const radio = document.querySelector(`input[name="signatureType"][value="${formData.signatureType}"]`);
                if (radio) {
                    radio.checked = true;
                    handleSignatureTypeChange();
                }
            }, 100);
        }
        
        // Restore other fields
        if (formData.needsTranslation) {
            const el = document.getElementById('needsTranslation');
            if (el) el.checked = true;
        }
        
        // Add more field restorations as needed...
        
        updateAutoSaveStatus('Draft Restored');
        return true;
    } catch (e) {
        console.error('Failed to load auto-save data:', e);
        return false;
    }
}

function clearDraft() {
    if (confirm('Are you sure you want to clear your saved draft? This action cannot be undone.')) {
        localStorage.removeItem(AUTOSAVE_KEY);
        window.location.reload();
    }
}

function updateAutoSaveStatus(message) {
    const status = document.getElementById('autoSaveStatus');
    if (status) {
        status.textContent = message;
        status.style.opacity = '1';
        setTimeout(() => {
            status.style.opacity = '0.7';
        }, 2000);
    }
}

function scheduleAutoSave() {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    autoSaveTimer = setTimeout(() => {
        saveFormData();
    }, AUTOSAVE_INTERVAL);
}

// ============================================
// Inline Validation
// ============================================

function addValidationState(formGroup, isValid) {
    if (!formGroup) return;
    
    removeValidationState(formGroup);
    
    if (isValid) {
        formGroup.classList.add('has-success');
    } else {
        formGroup.classList.add('has-error');
    }
}

function removeValidationState(formGroup) {
    if (!formGroup) return;
    formGroup.classList.remove('has-error', 'has-success');
}

function validateField(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    // Only validate if field has been touched or if it's required
    if (!field.hasAttribute('data-touched') && !field.hasAttribute('required')) return;
    
    let isValid = true;
    
    if (field.hasAttribute('required')) {
        if (field.type === 'radio') {
            const name = field.name;
            isValid = !!getRadioValue(name);
        } else if (field.type === 'checkbox') {
            // For checkbox groups, check if parent has required
            const parent = field.closest('.checkbox-group');
            if (parent && parent.hasAttribute('data-required')) {
                const name = field.name;
                isValid = getCheckboxValues(name).length > 0;
            }
        } else if (field.type === 'file') {
            isValid = field.files && field.files.length > 0;
        } else {
            isValid = field.value.trim() !== '';
        }
    }
    
    addValidationState(formGroup, isValid);
}

// ============================================
// Conditional Logic Handlers
// ============================================

/**
 * Level 1: Handle help type selection (Signature, Contract Pull, Other)
 */
function handleHelpTypeChange() {
    const helpType = getRadioValue('helpType');
    
    // Hide all main conditional sections first
    hideSection(signatureSection);
    hideSection(contractPullSection);
    hideSection(otherSection);
    
    // Show the appropriate section
    switch (helpType) {
        case 'signature':
            showSection(signatureSection);
            break;
        case 'contractPull':
            showSection(contractPullSection);
            break;
        case 'other':
            showSection(otherSection);
            break;
    }
    
    updateProgress();
    updateSummary();
    scheduleAutoSave();
}

/**
 * Level 2: Handle signature type selection (E-Signature, Wet Ink)
 */
function handleSignatureTypeChange() {
    const signatureType = getRadioValue('signatureType');
    
    if (signatureType === 'wetInk') {
        showSection(wetInkSection);
    } else {
        hideSection(wetInkSection);
        // Also hide nested sections when wet ink is deselected
        hideSection(notarizationSection);
        hideSection(stateField);
        hideSection(countryField);
    }
    
    updateProgress();
    updateSummary();
    scheduleAutoSave();
}

/**
 * Level 3: Handle notarize checkbox toggle
 */
function handleNotarizeChange() {
    const notarizeCheckbox = document.getElementById('wetInkNotarize');
    
    if (notarizeCheckbox && notarizeCheckbox.checked) {
        showSection(notarizationSection);
        // Set default value for Apostille to "No"
        const apostilleNo = document.querySelector('input[name="apostille"][value="no"]');
        if (apostilleNo && !getRadioValue('apostille')) {
            apostilleNo.checked = true;
        }
    } else {
        hideSection(notarizationSection);
        // Also hide nested location fields
        hideSection(stateField);
        hideSection(countryField);
    }
    
    updateProgress();
    scheduleAutoSave();
}

/**
 * Level 4: Handle notarization location selection (United States, Outside of US)
 */
function handleNotarizationLocationChange() {
    const location = getRadioValue('notarizationLocation');
    
    // Hide both first
    hideSection(stateField);
    hideSection(countryField);
    
    // Show appropriate field
    if (location === 'unitedStates') {
        showSection(stateField);
    } else if (location === 'outsideUS') {
        showSection(countryField);
    }
    
    updateProgress();
    scheduleAutoSave();
}

/**
 * Level 5: Handle wet ink originals selection and mail original versions checkbox
 * Show mailing address when either "Mail originals" radio OR "Mail original versions" checkbox is selected
 */
function handleWetInkOriginalsChange() {
    updateMailingAddressVisibility();
    updateProgress();
    scheduleAutoSave();
}

/**
 * Check if mailing address should be shown based on either:
 * 1. "Mail original versions" checkbox is checked, OR
 * 2. "Mail originals" radio is selected under "What should we do with the Wet Ink originals?"
 */
function updateMailingAddressVisibility() {
    const mailOriginalsCheckbox = document.getElementById('wetInkMailOriginals');
    const wetInkOriginalsSelection = getRadioValue('wetInkOriginals');
    
    const needsMailing = (mailOriginalsCheckbox && mailOriginalsCheckbox.checked) || 
                         (wetInkOriginalsSelection === 'mailOriginals');
    
    if (needsMailing) {
        showSection(mailingAddressSection);
    } else {
        hideSection(mailingAddressSection);
    }
}

/**
 * Handle apostille selection change
 * Show country field when Yes is selected
 */
function handleApostilleChange() {
    const apostille = getRadioValue('apostille');
    
    if (apostille === 'yes') {
        showSection(apostilleCountryField);
    } else {
        hideSection(apostilleCountryField);
    }
    
    updateProgress();
    scheduleAutoSave();
}

// ============================================
// Form Validation
// ============================================

/**
 * Validate only visible required fields
 * @returns {boolean} Whether the form is valid
 */
function validateForm() {
    let isValid = true;
    const errors = [];
    
    // Clear previous error states
    document.querySelectorAll('.form-group.has-error').forEach(group => {
        group.classList.remove('has-error');
    });
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.remove();
    });
    
    // Validate help type selection
    const helpType = getRadioValue('helpType');
    if (!helpType) {
        isValid = false;
        errors.push('Please select what kind of help you need.');
        highlightError(document.querySelector('input[name="helpType"]')?.closest('.form-group'));
    }
    
    // Validate based on selected help type
    if (helpType === 'signature') {
        // Validate file upload
        const fileInput = document.getElementById('fileToSign');
        if (!fileInput || fileInput.files.length === 0) {
            isValid = false;
            errors.push('Please upload a file to sign.');
            highlightError(fileInput?.closest('.form-group'));
        }
        
        // Validate signature type
        const signatureType = getRadioValue('signatureType');
        if (!signatureType) {
            isValid = false;
            errors.push('Please select what kind of signature you need.');
            highlightError(document.querySelector('input[name="signatureType"]')?.closest('.form-group'));
        }
        
        // If Wet Ink is selected, validate wet ink options
        if (signatureType === 'wetInk') {
            const wetInkOptions = getCheckboxValues('wetInkOptions');
            if (wetInkOptions.length === 0) {
                isValid = false;
                errors.push('Please select at least one Wet Ink option.');
                highlightError(document.querySelector('input[name="wetInkOptions"]')?.closest('.form-group'));
            }
            
            // If Notarize is checked, validate notarization fields
            const notarizeCheckbox = document.getElementById('wetInkNotarize');
            if (notarizeCheckbox && notarizeCheckbox.checked) {
                // Validate notarization location
                const location = getRadioValue('notarizationLocation');
                if (!location) {
                    isValid = false;
                    errors.push('Please select where the notarization will take place.');
                    highlightError(document.querySelector('input[name="notarizationLocation"]')?.closest('.form-group'));
                }
                
                // Validate state or country based on location
                if (location === 'unitedStates') {
                    const state = document.getElementById('notarizationState');
                    if (!state || !state.value) {
                        isValid = false;
                        errors.push('Please select a state.');
                        highlightError(state?.closest('.form-group'));
                    }
                } else if (location === 'outsideUS') {
                    const country = document.getElementById('notarizationCountry');
                    if (!country || !country.value.trim()) {
                        isValid = false;
                        errors.push('Please enter a country.');
                        highlightError(country?.closest('.form-group'));
                    }
                }
                
                // Validate apostille country if apostille is Yes
                const apostille = getRadioValue('apostille');
                if (apostille === 'yes') {
                    const apostilleCountry = document.getElementById('apostilleCountry');
                    if (!apostilleCountry || !apostilleCountry.value.trim()) {
                        isValid = false;
                        errors.push('Please enter the country for the Apostille.');
                        highlightError(apostilleCountry?.closest('.form-group'));
                    }
                }
                
                // Validate wet ink copies
                const copies = document.getElementById('wetInkCopies');
                if (!copies || !copies.value || parseInt(copies.value) < 1) {
                    isValid = false;
                    errors.push('Please enter the number of Wet Ink copies needed.');
                    highlightError(copies?.closest('.form-group'));
                }
                
                // Validate scanned copy (only when notarize is checked)
                const scannedCopy = getRadioValue('scannedCopy');
                if (!scannedCopy) {
                    isValid = false;
                    errors.push('Please select whether you need a scanned copy.');
                    highlightError(document.querySelector('input[name="scannedCopy"]')?.closest('.form-group'));
                }
                
                // Validate wet ink originals handling (only when notarize is checked)
                const wetInkOriginals = getRadioValue('wetInkOriginals');
                if (!wetInkOriginals) {
                    isValid = false;
                    errors.push('Please select what to do with the Wet Ink originals.');
                    highlightError(document.querySelector('input[name="wetInkOriginals"]')?.closest('.form-group'));
                }
            }
        }
    } else if (helpType === 'contractPull') {
        // Validate sales contract
        const salesContract = getRadioValue('salesContract');
        if (!salesContract) {
            isValid = false;
            errors.push('Please select whether this is a Sales Contract.');
            highlightError(document.querySelector('input[name="salesContract"]')?.closest('.form-group'));
        }
        
        // Validate originating entity
        const originatingEntity = getRadioValue('originatingEntity');
        if (!originatingEntity) {
            isValid = false;
            errors.push('Please select the Originating Entity.');
            highlightError(document.querySelector('input[name="originatingEntity"]')?.closest('.form-group'));
        }
        
        // Validate agreement name
        const agreementName = document.getElementById('agreementName');
        if (!agreementName || !agreementName.value.trim()) {
            isValid = false;
            errors.push('Please enter the Agreement Name.');
            highlightError(agreementName?.closest('.form-group'));
        }
        
        // Validate description
        const description = document.getElementById('contractPullDescription');
        if (!description || !description.value.trim()) {
            isValid = false;
            errors.push('Please describe what you need.');
            highlightError(description?.closest('.form-group'));
        }
    } else if (helpType === 'other') {
        // Validate other description
        const description = document.getElementById('otherDescription');
        if (!description || !description.value.trim()) {
            isValid = false;
            errors.push('Please describe your request.');
            highlightError(description?.closest('.form-group'));
        }
    }
    
    // Display errors if any
    if (!isValid && errors.length > 0) {
        // Scroll to first error
        const firstError = document.querySelector('.form-group.has-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    return isValid;
}

/**
 * Highlight a form group as having an error
 * @param {HTMLElement} formGroup - The form group to highlight
 */
function highlightError(formGroup) {
    if (formGroup) {
        formGroup.classList.add('has-error');
    }
}

// ============================================
// C4 FIX: Content Validation & Sanitization
// ============================================

/**
 * Sanitize a string by trimming and removing potentially dangerous patterns
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    
    // Trim whitespace
    let sanitized = str.trim();
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Limit consecutive whitespace to single space
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    return sanitized;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    if (!email) return true; // Empty is valid (not required)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate postal code format (alphanumeric with optional spaces/dashes)
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} True if valid
 */
function isValidPostalCode(postalCode) {
    if (!postalCode) return true; // Empty is valid (checked separately for required)
    const postalCodeRegex = /^[a-zA-Z0-9\s\-]{1,20}$/;
    return postalCodeRegex.test(postalCode);
}

/**
 * Validate and sanitize form content before submission
 * @param {Object} formData - Collected form data
 * @returns {Object} Object with isValid boolean and errors array
 */
function validateFormContent(formData) {
    const errors = [];
    
    // Validate title length (generated from form data)
    if (formData.title && formData.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
        errors.push(`Title must be ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} characters or less`);
    }
    
    // Validate based on help type
    if (formData.helpType === 'signature' && formData.signatureDetails) {
        const details = formData.signatureDetails;
        
        // Validate notes length
        if (details.additionalNotes && details.additionalNotes.length > VALIDATION_LIMITS.NOTES_MAX_LENGTH) {
            errors.push(`Additional notes must be ${VALIDATION_LIMITS.NOTES_MAX_LENGTH} characters or less`);
        }
        
        // Validate mailing info if present
        if (details.mailingInfo) {
            const mailing = details.mailingInfo;
            
            if (mailing.recipient && mailing.recipient.length > VALIDATION_LIMITS.RECIPIENT_MAX_LENGTH) {
                errors.push(`Recipient name must be ${VALIDATION_LIMITS.RECIPIENT_MAX_LENGTH} characters or less`);
            }
            
            if (mailing.address && mailing.address.length > VALIDATION_LIMITS.ADDRESS_MAX_LENGTH) {
                errors.push(`Street address must be ${VALIDATION_LIMITS.ADDRESS_MAX_LENGTH} characters or less`);
            }
            
            if (mailing.city && mailing.city.length > VALIDATION_LIMITS.CITY_MAX_LENGTH) {
                errors.push(`City must be ${VALIDATION_LIMITS.CITY_MAX_LENGTH} characters or less`);
            }
            
            if (mailing.postalCode && !isValidPostalCode(mailing.postalCode)) {
                errors.push('Postal code contains invalid characters');
            }
            
            if (mailing.country && mailing.country.length > VALIDATION_LIMITS.COUNTRY_MAX_LENGTH) {
                errors.push(`Country must be ${VALIDATION_LIMITS.COUNTRY_MAX_LENGTH} characters or less`);
            }
        }
        
        // Validate notarization fields
        if (details.notarization) {
            if (details.notarization.country && details.notarization.country.length > VALIDATION_LIMITS.COUNTRY_MAX_LENGTH) {
                errors.push(`Notarization country must be ${VALIDATION_LIMITS.COUNTRY_MAX_LENGTH} characters or less`);
            }
            
            if (details.notarization.apostilleCountry && details.notarization.apostilleCountry.length > VALIDATION_LIMITS.COUNTRY_MAX_LENGTH) {
                errors.push(`Apostille country must be ${VALIDATION_LIMITS.COUNTRY_MAX_LENGTH} characters or less`);
            }
        }
    }
    
    if (formData.helpType === 'contractPull' && formData.contractPullDetails) {
        const details = formData.contractPullDetails;
        
        if (details.agreementName && details.agreementName.length > VALIDATION_LIMITS.AGREEMENT_NAME_MAX_LENGTH) {
            errors.push(`Agreement name must be ${VALIDATION_LIMITS.AGREEMENT_NAME_MAX_LENGTH} characters or less`);
        }
        
        if (details.companyNames && details.companyNames.length > VALIDATION_LIMITS.COMPANY_NAME_MAX_LENGTH) {
            errors.push(`Company names must be ${VALIDATION_LIMITS.COMPANY_NAME_MAX_LENGTH} characters or less`);
        }
        
        if (details.description && details.description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
            errors.push(`Description must be ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less`);
        }
    }
    
    if (formData.helpType === 'other' && formData.otherDetails) {
        if (formData.otherDetails.description && formData.otherDetails.description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
            errors.push(`Description must be ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less`);
        }
    }
    
    // Validate submitting for other person
    if (formData.submittingForOtherDetails && formData.submittingForOtherDetails.email) {
        if (!isValidEmail(formData.submittingForOtherDetails.email)) {
            errors.push('Invalid email format for "submitting for" person');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Apply sanitization to collected form data
 * @param {Object} formData - Raw form data
 * @returns {Object} Sanitized form data
 */
function sanitizeFormData(formData) {
    // Deep clone to avoid mutating original
    const sanitized = JSON.parse(JSON.stringify(formData));
    
    // Sanitize string fields
    if (sanitized.title) sanitized.title = sanitizeString(sanitized.title);
    
    if (sanitized.signatureDetails) {
        if (sanitized.signatureDetails.additionalNotes) {
            sanitized.signatureDetails.additionalNotes = sanitizeString(sanitized.signatureDetails.additionalNotes);
        }
        
        if (sanitized.signatureDetails.mailingInfo) {
            const mailing = sanitized.signatureDetails.mailingInfo;
            Object.keys(mailing).forEach(key => {
                if (typeof mailing[key] === 'string') {
                    mailing[key] = sanitizeString(mailing[key]);
                }
            });
        }
        
        if (sanitized.signatureDetails.notarization) {
            const notarization = sanitized.signatureDetails.notarization;
            if (notarization.country) notarization.country = sanitizeString(notarization.country);
            if (notarization.apostilleCountry) notarization.apostilleCountry = sanitizeString(notarization.apostilleCountry);
        }
    }
    
    if (sanitized.contractPullDetails) {
        if (sanitized.contractPullDetails.agreementName) {
            sanitized.contractPullDetails.agreementName = sanitizeString(sanitized.contractPullDetails.agreementName);
        }
        if (sanitized.contractPullDetails.companyNames) {
            sanitized.contractPullDetails.companyNames = sanitizeString(sanitized.contractPullDetails.companyNames);
        }
        if (sanitized.contractPullDetails.description) {
            sanitized.contractPullDetails.description = sanitizeString(sanitized.contractPullDetails.description);
        }
    }
    
    if (sanitized.otherDetails && sanitized.otherDetails.description) {
        sanitized.otherDetails.description = sanitizeString(sanitized.otherDetails.description);
    }
    
    return sanitized;
}

// ============================================
// Review Modal
// ============================================

function showReviewModal() {
    // First validate the form
    if (!validateForm()) {
        return;
    }
    
    const modal = document.getElementById('reviewModal');
    const reviewContent = document.getElementById('reviewContent');
    
    if (!modal || !reviewContent) return;
    
    // Build review content
    const formData = collectFormData();
    let html = '';
    
    html += `<h4>Request Type</h4>`;
    html += `<p><strong>Type:</strong> ${toTitleCase(formData.type)}</p>`;
    html += `<p><strong>Help Needed:</strong> ${toTitleCase(formData.helpType)}</p>`;
    
    if (formData.submittingForOther) {
        const person = submittingForOtherPicker?.getPerson();
        html += `<p><strong>Submitting For Someone Else:</strong> ${person ? person.name : formData.submittingForOther}</p>`;
    }
    
    if (formData.completionDate) {
        const date = new Date(formData.completionDate);
        html += `<p><strong>Completion Date:</strong> ${date.toLocaleDateString()}</p>`;
    }
    
    if (formData.helpType === 'signature' && formData.signatureDetails) {
        html += `<h4>Signature Details</h4>`;
        html += `<p><strong>Signature Type:</strong> ${formData.signatureDetails.signatureType === 'wetInk' ? 'Wet Ink' : 'E-Signature'}</p>`;
        html += `<p><strong>Files:</strong> ${formData.signatureDetails.files.length} file(s) uploaded</p>`;
        
        if (formData.signatureDetails.needsTranslation) {
            html += `<p><strong>Needs Translation:</strong> Yes</p>`;
        }
        
        if (formData.signatureDetails.signatureType === 'wetInk') {
            const wetInkOptionsFormatted = formData.signatureDetails.wetInkOptions.map(opt => toTitleCase(opt)).join(', ');
            html += `<p><strong>Wet Ink Options:</strong> ${wetInkOptionsFormatted}</p>`;
            
            // Show apostille country if apostille is required
            if (formData.signatureDetails.notarization && formData.signatureDetails.notarization.apostille === 'yes') {
                html += `<p><strong>Apostille Required:</strong> Yes</p>`;
                if (formData.signatureDetails.notarization.apostilleCountry) {
                    html += `<p><strong>Apostille Country:</strong> ${formData.signatureDetails.notarization.apostilleCountry}</p>`;
                }
            }
        }
    } else if (formData.helpType === 'contractPull' && formData.contractPullDetails) {
        html += `<h4>Contract Pull Details</h4>`;
        html += `<p><strong>Sales Contract:</strong> ${formData.contractPullDetails.salesContract === 'yes' ? 'Yes' : 'No'}</p>`;
        html += `<p><strong>Entity:</strong> ${toTitleCase(formData.contractPullDetails.originatingEntity)}</p>`;
        html += `<p><strong>Agreement:</strong> ${formData.contractPullDetails.agreementName}</p>`;
        html += `<p><strong>Description:</strong> ${formData.contractPullDetails.description}</p>`;
    } else if (formData.helpType === 'other' && formData.otherDetails) {
        html += `<h4>Request Details</h4>`;
        html += `<p>${formData.otherDetails.description}</p>`;
    }
    
    reviewContent.innerHTML = html;
    modal.style.display = 'flex';
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ============================================
// Form Submission
// ============================================

/**
 * Generate a descriptive title for signature requests
 * @param {Object} signatureDetails - Signature form details
 * @returns {string} Descriptive title
 */
function generateSignatureTitle(signatureDetails) {
    const parts = [];
    
    // Add file names if available
    if (signatureDetails.files && signatureDetails.files.length > 0) {
        const fileNames = signatureDetails.files.map(f => {
            // Remove extension and truncate if too long
            const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '');
            return nameWithoutExt.length > 30 ? nameWithoutExt.substring(0, 30) + '...' : nameWithoutExt;
        });
        if (fileNames.length === 1) {
            parts.push(fileNames[0]);
        } else if (fileNames.length > 1) {
            parts.push(`${fileNames[0]} +${fileNames.length - 1} more`);
        }
    }
    
    // Add signature type
    const sigType = signatureDetails.signatureType === 'wetInk' ? 'Wet Ink' : 'E-Signature';
    parts.push(sigType);
    
    // Add key features
    const features = [];
    if (signatureDetails.needsTranslation) {
        features.push('Translation');
    }
    if (signatureDetails.wetInkOptions) {
        if (signatureDetails.wetInkOptions.includes('notarize')) {
            features.push('Notarization');
        }
        if (signatureDetails.wetInkOptions.includes('stampSeal')) {
            features.push('Stamp/Seal');
        }
    }
    if (features.length > 0) {
        parts.push(`with ${features.join(', ')}`);
    }
    
    // Fallback if no file names
    if (parts.length === 1) {
        return `Signature Request - ${parts[0]}`;
    }
    
    return parts.join(' - ');
}

/**
 * Generate a descriptive title for contract pull requests
 * @param {Object} contractPullDetails - Contract pull form details
 * @returns {string} Descriptive title
 */
function generateContractPullTitle(contractPullDetails) {
    const parts = ['Contract Pull'];
    
    // Add agreement name
    if (contractPullDetails.agreementName && contractPullDetails.agreementName.trim()) {
        const agreementName = contractPullDetails.agreementName.trim();
        // Truncate if too long
        const displayName = agreementName.length > 40 ? agreementName.substring(0, 40) + '...' : agreementName;
        parts.push(displayName);
    }
    
    // Add company names if available
    if (contractPullDetails.companyNames && contractPullDetails.companyNames.trim()) {
        const companyNames = contractPullDetails.companyNames.trim();
        // Truncate if too long
        const displayCompanies = companyNames.length > 30 ? companyNames.substring(0, 30) + '...' : companyNames;
        parts.push(`(${displayCompanies})`);
    }
    
    // Add originating entity
    if (contractPullDetails.originatingEntity) {
        const entity = toTitleCase(contractPullDetails.originatingEntity);
        parts.push(`- ${entity}`);
    }
    
    return parts.join(' ');
}

/**
 * Generate a descriptive title for other requests
 * @param {Object} otherDetails - Other request form details
 * @returns {string} Descriptive title
 */
function generateOtherRequestTitle(otherDetails) {
    if (otherDetails.description && otherDetails.description.trim()) {
        const description = otherDetails.description.trim();
        // Extract first meaningful sentence or first 60 characters
        const firstSentence = description.split(/[.!?]/)[0].trim();
        const snippet = firstSentence.length > 0 && firstSentence.length <= 60 
            ? firstSentence 
            : description.substring(0, 60).trim();
        
        // Remove trailing punctuation if it's incomplete
        const cleanSnippet = snippet.replace(/[.,;:]+$/, '');
        return cleanSnippet.length > 0 ? cleanSnippet : 'LOPS General Request';
    }
    
    return 'LOPS General Request';
}

/**
 * Collect form data based on the selected help type
 * @returns {Object} The collected form data
 */
function collectFormData() {
    const helpType = getRadioValue('helpType');
    const submittingForOtherSelection = typeof submittingForOtherPicker?.getPerson === 'function'
        ? submittingForOtherPicker.getPerson()
        : null;
    
    // Base data
    const formData = {
        type: 'LOPS General Intake',
        helpType: helpType,
        submittingForOther: submittingForOtherSelection?.id || '',
        submittingForOtherDetails: submittingForOtherSelection ? {
            id: submittingForOtherSelection.id,
            name: submittingForOtherSelection.name,
            email: submittingForOtherSelection.email,
            department: submittingForOtherSelection.department
        } : null,
        completionDate: document.getElementById('completionDate')?.value || '',
        submittedAt: new Date().toISOString()
    };
    
    // Collect data based on help type
    switch (helpType) {
        case 'signature':
            formData.signatureDetails = collectSignatureData();
            formData.title = generateSignatureTitle(formData.signatureDetails);
            break;
        case 'contractPull':
            formData.contractPullDetails = collectContractPullData();
            formData.title = generateContractPullTitle(formData.contractPullDetails);
            break;
        case 'other':
            formData.otherDetails = collectOtherData();
            formData.title = generateOtherRequestTitle(formData.otherDetails);
            break;
    }
    
    if (prefillContext.title && prefillContext.title.trim()) {
        formData.title = prefillContext.title.trim();
    }
    
    formData.department = prefillContext.department || 'Legal Operations';
    
    return formData;
}

/**
 * Collect signature-related form data
 * @returns {Object} Signature details
 */
function collectSignatureData() {
    const fileInput = document.getElementById('fileToSign');
    const files = [];
    if (fileInput && fileInput.files.length > 0) {
        for (let file of fileInput.files) {
            files.push({
                name: file.name,
                size: file.size,
                type: file.type
            });
        }
    }
    
    const data = {
        files: files,
        signatureType: getRadioValue('signatureType'),
        needsTranslation: document.getElementById('needsTranslation')?.checked || false,
        additionalNotes: document.getElementById('signatureNotes')?.value || ''
    };
    
    // If Wet Ink, collect additional details
    if (data.signatureType === 'wetInk') {
        data.wetInkOptions = getCheckboxValues('wetInkOptions');
        data.scannedCopy = getRadioValue('scannedCopy');
        data.wetInkOriginals = getRadioValue('wetInkOriginals');
        
        // If Notarize is selected
        if (data.wetInkOptions.includes('notarize')) {
            data.notarization = {
                notarialActs: getCheckboxValues('notarialAct'),
                apostille: getRadioValue('apostille'),
                apostilleCountry: document.getElementById('apostilleCountry')?.value || '',
                location: getRadioValue('notarizationLocation'),
                state: document.getElementById('notarizationState')?.value || '',
                country: document.getElementById('notarizationCountry')?.value || '',
                copies: document.getElementById('wetInkCopies')?.value || ''
            };
        }
    }
    
    const mailingInfo = {
        recipient: document.getElementById('mailingRecipient')?.value.trim() || '',
        company: document.getElementById('mailingCompany')?.value.trim() || '',
        address: document.getElementById('mailingAddress')?.value.trim() || '',
        city: document.getElementById('mailingCity')?.value.trim() || '',
        stateProvince: document.getElementById('mailingStateProvince')?.value.trim() || '',
        postalCode: document.getElementById('mailingPostalCode')?.value.trim() || '',
        country: document.getElementById('mailingCountry')?.value.trim() || ''
    };
    
    if (Object.values(mailingInfo).some(value => value)) {
        data.mailingInfo = mailingInfo;
    }
    
    return data;
}

/**
 * Collect contract pull form data
 * @returns {Object} Contract pull details
 */
function collectContractPullData() {
    return {
        salesContract: getRadioValue('salesContract'),
        originatingEntity: getRadioValue('originatingEntity'),
        companyNames: document.getElementById('companyNames')?.value || '',
        agreementName: document.getElementById('agreementName')?.value || '',
        description: document.getElementById('contractPullDescription')?.value || ''
    };
}

/**
 * Collect other request form data
 * @returns {Object} Other request details
 */
function collectOtherData() {
    return {
        description: document.getElementById('otherDescription')?.value || ''
    };
}

/**
 * Handle form submission
 * @param {Event} e - The submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Show review modal instead of directly submitting
    showReviewModal();
}

/**
 * Confirm and submit the request
 * C4 FIX: Added content validation and sanitization
 */
function confirmAndSubmit() {
    // Validate the form one more time
    if (!validateForm()) {
        closeReviewModal();
        return;
    }
    
    // Collect form data
    const rawFormData = collectFormData();
    
    // C4 FIX: Validate content (lengths, formats)
    const validationResult = validateFormContent(rawFormData);
    if (!validationResult.isValid) {
        closeReviewModal();
        alert('Please fix the following issues:\n\n' + validationResult.errors.join('\n'));
        return;
    }
    
    // C4 FIX: Sanitize form data
    const formData = sanitizeFormData(rawFormData);
    
    // Show loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);
    
    // Simulate submission delay
    setTimeout(() => {
        // Create the request using existing state management
        const requestData = {
            title: formData.title,
            type: formData.type,
            priority: 'Medium', // Default priority for LOPS requests
            department: formData.department || 'Legal Operations',
            description: JSON.stringify(formData, null, 2),
            files: formData.signatureDetails?.files || []
        };
        
        createRequest(requestData);
        
        // Clear the draft
        localStorage.removeItem(AUTOSAVE_KEY);
        
        // Redirect to My Requests page
        window.location.href = 'my-requests.html';
    }, 800);
}

// ============================================
// Initialization
// ============================================

let formResizeObserver;

function initSidebarObserver() {
    const formMain = document.querySelector('.form-main');
    if (formMain && !formResizeObserver) {
        formResizeObserver = new ResizeObserver(() => {
            updateDotPositions();
        });
        formResizeObserver.observe(formMain);
    }
    
    window.addEventListener('resize', () => {
        updateDotPositions();
    });
}

onReady(() => {
    // Set default user
    initializeDefaultUser();
    loadPrefillContext();
    
    // Get section references
    signatureSection = document.getElementById('signatureSection');
    contractPullSection = document.getElementById('contractPullSection');
    otherSection = document.getElementById('otherSection');
    wetInkSection = document.getElementById('wetInkSection');
    notarizationSection = document.getElementById('notarizationSection');
    stateField = document.getElementById('stateField');
    countryField = document.getElementById('countryField');
    apostilleCountryField = document.getElementById('apostilleCountryField');
    mailingAddressSection = document.getElementById('mailingAddressSection');
    
    // Initialize summary panel toggle elements
    summaryPanelToggle = document.getElementById('summaryPanelToggle');
    summaryPanelClose = document.getElementById('summaryPanelClose');
    formLayout = document.querySelector('.form-layout');
    summarySidebarDots = document.getElementById('summarySidebarDots');
        summarySidebarCollapsed = document.getElementById('summarySidebarCollapsed');
    prefillBanner = document.getElementById('prefillContextBanner');
    prefillBannerDetails = document.getElementById('prefillContextDetails');
    prefillBannerAction = document.getElementById('clearPrefillContextBtn');
    
    if (prefillBannerAction) {
        prefillBannerAction.addEventListener('click', clearPrefillContext);
    }
    
    // Load saved summary panel state
    loadSummaryPanelState();
    
    // Initialize sidebar dots
    updateSidebarDots();
    
    // Initialize sidebar position observer
    initSidebarObserver();
    
    // Summary panel toggle event listeners
    if (summaryPanelToggle) {
        summaryPanelToggle.addEventListener('click', () => {
            toggleSummaryPanel(false); // Show the panel
        });
    }
    
    if (summaryPanelClose) {
        summaryPanelClose.addEventListener('click', () => {
            toggleSummaryPanel(true); // Hide the panel
        });
    }
    
    // Keyboard shortcut: Bracket key to toggle summary panel
    document.addEventListener('keydown', (e) => {
        // Use ']' to toggle summary panel when not in an input field
        if (e.key === ']' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            const isCollapsed = formLayout?.classList.contains('summary-collapsed');
            toggleSummaryPanel(!isCollapsed);
        }
    });
    
    // Initialize people picker
    submittingForOtherPicker = createPeoplePicker('submittingForOther', {
        placeholder: 'Select a person...',
        allowClear: true,
        onSelect: () => {
            scheduleAutoSave();
        },
        onClear: () => {
            scheduleAutoSave();
        }
    });
    
    // Listen for changes on the people picker
    const submittingForOtherContainer = document.getElementById('submittingForOther');
    if (submittingForOtherContainer) {
        submittingForOtherContainer.addEventListener('peoplePickerChange', () => {
            scheduleAutoSave();
        });
    }
    
    // Note: Auto-load of draft data removed - forms now start blank
    // Users can still have their data auto-saved as they work
    
    // Set default completion date to 5 days from today
    const completionDateInput = document.getElementById('completionDate');
    if (completionDateInput && !completionDateInput.value) {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 5);
        const year = defaultDate.getFullYear();
        const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
        const day = String(defaultDate.getDate()).padStart(2, '0');
        completionDateInput.value = `${year}-${month}-${day}`;
    }
    
    // ============================================
    // Event Listeners
    // ============================================
    
    // Level 1: Help type selection
    const helpTypeRadios = document.querySelectorAll('input[name="helpType"]');
    helpTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleHelpTypeChange);
    });
    
    // Level 2: Signature type selection
    const signatureTypeRadios = document.querySelectorAll('input[name="signatureType"]');
    signatureTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleSignatureTypeChange);
    });
    
    // Level 3: Notarize checkbox
    const notarizeCheckbox = document.getElementById('wetInkNotarize');
    if (notarizeCheckbox) {
        notarizeCheckbox.addEventListener('change', handleNotarizeChange);
    }
    
    // Level 3: Mail original versions checkbox (also triggers mailing address)
    const mailOriginalsCheckbox = document.getElementById('wetInkMailOriginals');
    if (mailOriginalsCheckbox) {
        mailOriginalsCheckbox.addEventListener('change', handleWetInkOriginalsChange);
    }
    
    // Level 4: Notarization location
    const locationRadios = document.querySelectorAll('input[name="notarizationLocation"]');
    locationRadios.forEach(radio => {
        radio.addEventListener('change', handleNotarizationLocationChange);
    });
    
    // Apostille selection (show country field when Yes is selected)
    const apostilleRadios = document.querySelectorAll('input[name="apostille"]');
    apostilleRadios.forEach(radio => {
        radio.addEventListener('change', handleApostilleChange);
    });
    
    // Level 5: Wet Ink originals handling (show mailing address when Mail originals is selected)
    const wetInkOriginalsRadios = document.querySelectorAll('input[name="wetInkOriginals"]');
    wetInkOriginalsRadios.forEach(radio => {
        radio.addEventListener('change', handleWetInkOriginalsChange);
    });
    
    // File upload handler for signature section
    const fileToSign = document.getElementById('fileToSign');
    if (fileToSign) {
        fileToSign.addEventListener('change', function(e) {
            displayFileList(e.target, 'signatureFileList');
            updateProgress();
            updateSummary();
            scheduleAutoSave();
        });
    }
    
    // Track all form inputs for auto-save and validation
    const formInputs = document.querySelectorAll('#requestForm input, #requestForm select, #requestForm textarea');
    formInputs.forEach(input => {
        // Track changes for auto-save
        input.addEventListener('input', () => {
            input.setAttribute('data-touched', 'true');
            updateProgress();
            updateSummary();
            scheduleAutoSave();
        });
        
        // Track blur for validation
        input.addEventListener('blur', () => {
            input.setAttribute('data-touched', 'true');
            validateField(input);
        });
        
        // Track change for radio/checkbox/select
        input.addEventListener('change', () => {
            input.setAttribute('data-touched', 'true');
            validateField(input);
            updateProgress();
            updateSummary();
            scheduleAutoSave();
        });
    });
    
    // Form submission handler
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Review modal handlers
    const closeReview = document.getElementById('closeReview');
    if (closeReview) {
        closeReview.addEventListener('click', closeReviewModal);
    }
    
    const editRequest = document.getElementById('editRequest');
    if (editRequest) {
        editRequest.addEventListener('click', closeReviewModal);
    }
    
    const confirmSubmit = document.getElementById('confirmSubmit');
    if (confirmSubmit) {
        confirmSubmit.addEventListener('click', confirmAndSubmit);
    }
    
    // Clear draft button
    const clearDraftBtn = document.getElementById('clearDraft');
    if (clearDraftBtn) {
        clearDraftBtn.addEventListener('click', clearDraft);
    }
    
    // Close modal on outside click
    const reviewModal = document.getElementById('reviewModal');
    if (reviewModal) {
        reviewModal.addEventListener('click', (e) => {
            if (e.target === reviewModal) {
                closeReviewModal();
            }
        });
    }
    
    applyPrefillContext();
    
    // Initialize progress and summary
    updateProgress();
    updateSummary();
    
    // M9 FIX: Clean up autosave timer on page unload to prevent memory leaks
    window.addEventListener('beforeunload', () => {
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = null;
        }
    });
    
    // M9 FIX: Also clean up when page is hidden (mobile/tab switching)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && autoSaveTimer) {
            // Save immediately before hiding
            saveFormData();
            clearTimeout(autoSaveTimer);
            autoSaveTimer = null;
        }
    });
});
