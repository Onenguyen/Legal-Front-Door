// Admin Dashboard Page Logic (Redesigned)
import { initializeDefaultUser, getAllRequests, getUsers, updateRequestAssignment, updateRequestStatus, getUserName, invalidateCache } from '../core/state.js';
import { ROLES, ROUTES, STATUSES } from '../core/constants.js';
import { onReady, escapeHtml } from '../utils/dom.js';
import { formatDate } from '../utils/date.js';

let allRequests = [];
let currentUser = null;

// Pending change tracking for confirmation dialog
let pendingChange = null;

// Check admin access
function checkAdminAccess() {
    currentUser = initializeDefaultUser();
    if (!currentUser || currentUser.role !== ROLES.ADMIN) {
        window.location.href = ROUTES.HOME;
        return false;
    }
    return true;
}

// Load all requests
function loadRequests(forceRefresh = false) {
    if (forceRefresh) {
        // Invalidate cache to ensure we get fresh data from localStorage
        invalidateCache('requests');
    }
    
    allRequests = getAllRequests();
    // Sort by Date Descending
    allRequests.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
    
    applyFilters();
}

// Filter Logic
function getFilterValues() {
    const searchInput = document.getElementById('searchInput');
    const statusSelect = document.getElementById('statusFilter');
    const typeSelect = document.getElementById('typeFilter');
    const prioritySelect = document.getElementById('priorityFilter');
    
    return {
        search: searchInput ? searchInput.value.toLowerCase().trim() : '',
        status: statusSelect ? statusSelect.value : '',
        type: typeSelect ? typeSelect.value : '',
        priority: prioritySelect ? prioritySelect.value : ''
    };
}

function applyFilters() {
    const filters = getFilterValues();
    
    let filtered = allRequests.filter(req => {
        // Text Search
        if (filters.search) {
            const searchStr = `${req.id} ${req.title} ${req.description || ''} ${getUserName(req.submittedBy)}`.toLowerCase();
            if (!searchStr.includes(filters.search)) return false;
        }
        
        // Dropdown Filters
        if (filters.status && req.status !== filters.status) return false;
        if (filters.type && req.type !== filters.type) return false;
        if (filters.priority && req.priority !== filters.priority) return false;
        
        return true;
    });
    
    renderAdminTable(filtered);
}

// Render Table with Inline Editing
function renderAdminTable(requests) {
    const tbody = document.getElementById('requestsTableBody');
    const noRequests = document.getElementById('noRequests');
    const tableContainer = document.querySelector('.table-container');
    
    if (!tbody) return;
    
    if (requests.length === 0) {
        tbody.innerHTML = '';
        if (noRequests) noRequests.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }
    
    if (noRequests) noRequests.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
    
    // Pre-fetch admins for assignment dropdown
    const admins = getUsers().filter(u => u.role === ROLES.ADMIN);
    
    // Status options for custom dropdown
    const statusList = [
        STATUSES.SUBMITTED, 
        STATUSES.UNDER_REVIEW, 
        STATUSES.IN_PROGRESS, 
        STATUSES.RESOLVED, 
        STATUSES.CLOSED
    ];
    
    tbody.innerHTML = requests.map(req => {
        const detailUrl = `${ROUTES.REQUEST_DETAIL}?id=${encodeURIComponent(req.id)}`;
        
        // Custom Status Dropdown
        const statusOptionsHtml = statusList.map(s => 
            `<div class="custom-dropdown-option ${req.status === s ? 'selected' : ''}" data-value="${escapeHtml(s)}">${escapeHtml(s)}</div>`
        ).join('');
        
        // Assigned To Custom Dropdown
        const assignedId = req.assignedTo || '';
        const assignedName = assignedId ? getUserName(assignedId) : 'Unassigned';
        const assignedOptionsHtml = `<div class="custom-dropdown-option ${!assignedId ? 'selected' : ''}" data-value="">Unassigned</div>` +
            admins.map(a => `<div class="custom-dropdown-option ${assignedId === a.id ? 'selected' : ''}" data-value="${a.id}">${escapeHtml(a.name)}</div>`).join('');
            
        // Parse formData from description JSON to get Need By date
        let needByDate = '—';
        try {
            const formData = req.description ? JSON.parse(req.description) : null;
            if (formData?.completionDate) {
                needByDate = formatDate(formData.completionDate);
            }
        } catch (e) {
            // Description is not JSON, leave as dash
        }
        
        return `
            <tr data-id="${req.id}">
                <td><a href="${detailUrl}" style="text-decoration:none; color:inherit; font-weight:700;">REQ-${escapeHtml(req.id)}</a></td>
                <td>${formatDate(req.submittedDate)}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar" style="background-color: var(--primary-color); color: #000;">${getUserName(req.submittedBy).charAt(0).toUpperCase()}</div>
                        <span>${escapeHtml(getUserName(req.submittedBy))}</span>
                    </div>
                </td>
                <td><a href="${detailUrl}" style="text-decoration:none; color:inherit;">${escapeHtml(req.title)}</a></td>
                <td>${escapeHtml(req.type)}</td>
                <td>${escapeHtml(req.priority)}</td>
                <td>
                    <div class="custom-dropdown" data-request-id="${req.id}" data-dropdown-type="status">
                        <button type="button" class="custom-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
                            <span class="custom-dropdown-value">${escapeHtml(req.status)}</span>
                            <span class="custom-dropdown-arrow">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </span>
                        </button>
                        <div class="custom-dropdown-menu" role="listbox">
                            ${statusOptionsHtml}
                        </div>
                    </div>
                </td>
                <td>
                    <div class="custom-dropdown" data-request-id="${req.id}" data-dropdown-type="assigned">
                        <button type="button" class="custom-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
                            <span class="custom-dropdown-value">${escapeHtml(assignedName)}</span>
                            <span class="custom-dropdown-arrow">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </span>
                        </button>
                        <div class="custom-dropdown-menu" role="listbox">
                            ${assignedOptionsHtml}
                        </div>
                    </div>
                </td>
                <td>${needByDate}</td>
            </tr>
        `;
    }).join('');
    
    // Initialize custom dropdowns after rendering
    initializeCustomDropdowns();
}

// Position dropdown menu using fixed positioning
function positionDropdownMenu(trigger, menu) {
    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = menu.scrollHeight || 200;
    const viewportHeight = window.innerHeight;
    
    // Calculate if dropdown should open above or below
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    
    menu.style.left = `${triggerRect.left}px`;
    menu.style.width = `${triggerRect.width}px`;
    
    if (openAbove) {
        menu.style.top = 'auto';
        menu.style.bottom = `${viewportHeight - triggerRect.top + 4}px`;
    } else {
        menu.style.top = `${triggerRect.bottom + 4}px`;
        menu.style.bottom = 'auto';
    }
}

// Initialize custom dropdown functionality
function initializeCustomDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.custom-dropdown-trigger');
        const menu = dropdown.querySelector('.custom-dropdown-menu');
        const options = dropdown.querySelectorAll('.custom-dropdown-option');
        const valueDisplay = dropdown.querySelector('.custom-dropdown-value');
        const requestId = dropdown.dataset.requestId;
        const dropdownType = dropdown.dataset.dropdownType;
        
        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close other open dropdowns
            document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('open');
                    d.querySelector('.custom-dropdown-trigger').setAttribute('aria-expanded', 'false');
                }
            });
            
            const isOpen = dropdown.classList.toggle('open');
            trigger.setAttribute('aria-expanded', isOpen.toString());
            
            // Position the menu when opening
            if (isOpen) {
                positionDropdownMenu(trigger, menu);
            }
        });
        
        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const newValue = option.dataset.value;
                const currentValue = dropdown.querySelector('.custom-dropdown-option.selected')?.dataset.value || '';
                
                // Don't do anything if value hasn't changed
                if (newValue === currentValue) {
                    dropdown.classList.remove('open');
                    trigger.setAttribute('aria-expanded', 'false');
                    return;
                }
                
                // Close dropdown
                dropdown.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
                
                // Show confirmation dialog instead of immediately applying
                const displayValue = dropdownType === 'assigned' ? option.textContent : newValue;
                const currentDisplayValue = valueDisplay.textContent;
                
                showConfirmationModal({
                    type: dropdownType,
                    requestId: requestId,
                    oldValue: currentValue,
                    newValue: newValue,
                    oldDisplayValue: currentDisplayValue,
                    newDisplayValue: displayValue,
                    dropdown: dropdown,
                    valueDisplay: valueDisplay,
                    options: options,
                    selectedOption: option
                });
            });
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                d.classList.remove('open');
                d.querySelector('.custom-dropdown-trigger').setAttribute('aria-expanded', 'false');
            });
        }
    });
    
    // Reposition open dropdowns on scroll/resize
    window.addEventListener('scroll', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
            const trigger = dropdown.querySelector('.custom-dropdown-trigger');
            const menu = dropdown.querySelector('.custom-dropdown-menu');
            positionDropdownMenu(trigger, menu);
        });
    }, true);
    
    window.addEventListener('resize', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
            const trigger = dropdown.querySelector('.custom-dropdown-trigger');
            const menu = dropdown.querySelector('.custom-dropdown-menu');
            positionDropdownMenu(trigger, menu);
        });
    });
}

// Inline Action Handlers
window.handleStatusChange = function(requestId, newStatus) {
    const updated = updateRequestStatus(requestId, newStatus);
    if (!updated) return;

    // Reload local data copy
    const index = allRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
        allRequests[index].status = newStatus;
    }
};

window.handleAssignmentChange = function(requestId, userId) {
    const updated = updateRequestAssignment(requestId, userId);
    if (!updated) return;

    const index = allRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
        allRequests[index].assignedTo = userId;
    }
};

// Confirmation Modal Functions
function showConfirmationModal(changeData) {
    pendingChange = changeData;
    
    const modal = document.getElementById('confirmationModal');
    const title = document.getElementById('confirmationTitle');
    const message = document.getElementById('confirmationMessage');
    const preview = document.getElementById('changePreview');
    const error = document.getElementById('confirmationError');
    const errorText = document.getElementById('confirmationErrorText');
    const confirmBtn = document.getElementById('confirmationConfirm');
    
    // Set title based on change type
    if (changeData.type === 'status') {
        title.textContent = 'Confirm Status Change';
        message.textContent = 'Are you sure you want to update the status for this request?';
    } else {
        title.textContent = 'Confirm Assignment Change';
        message.textContent = 'Are you sure you want to update the assignment for this request?';
    }
    
    // Build change preview HTML
    const fieldLabel = changeData.type === 'status' ? 'Status' : 'Assigned To';
    preview.innerHTML = `
        <div class="confirmation-change-item">
            <span class="change-label">${fieldLabel}</span>
            <span class="change-from">${escapeHtml(changeData.oldDisplayValue)}</span>
            <span class="change-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
            <span class="change-to">${escapeHtml(changeData.newDisplayValue)}</span>
        </div>
    `;
    
    // Validate rules
    const validationError = validateChange(changeData);
    
    if (validationError) {
        error.style.display = 'flex';
        errorText.textContent = validationError;
        confirmBtn.disabled = true;
    } else {
        error.style.display = 'none';
        errorText.textContent = '';
        confirmBtn.disabled = false;
    }
    
    // Show modal
    modal.classList.add('show');
}

function hideConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('show');
    pendingChange = null;
}

function validateChange(changeData) {
    // Rule: Can't move to "In Progress" if "Assigned To" is unassigned
    if (changeData.type === 'status' && changeData.newValue === STATUSES.IN_PROGRESS) {
        // Find the request to check current assignment
        const request = allRequests.find(r => r.id === changeData.requestId);
        if (request && !request.assignedTo) {
            return 'Cannot move to "In Progress" without an assignee. Please assign someone first.';
        }
    }
    
    // Rule: Can't unassign if status is "In Progress"
    if (changeData.type === 'assigned' && !changeData.newValue) {
        const request = allRequests.find(r => r.id === changeData.requestId);
        if (request && request.status === STATUSES.IN_PROGRESS) {
            return 'Cannot unassign a request that is "In Progress". Change the status first.';
        }
    }
    
    return null; // No validation errors
}

function confirmChange() {
    if (!pendingChange) return;
    
    const { type, requestId, newValue, valueDisplay, options, selectedOption } = pendingChange;
    
    // Update display
    valueDisplay.textContent = pendingChange.newDisplayValue;
    
    // Update selected state in dropdown
    options.forEach(o => o.classList.remove('selected'));
    selectedOption.classList.add('selected');
    
    // Apply the change
    if (type === 'assigned') {
        window.handleAssignmentChange(requestId, newValue);
    } else {
        window.handleStatusChange(requestId, newValue);
    }
    
    hideConfirmationModal();
}

function initializeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    const closeBtn = document.getElementById('confirmationClose');
    const cancelBtn = document.getElementById('confirmationCancel');
    const confirmBtn = document.getElementById('confirmationConfirm');
    
    // Close modal handlers
    closeBtn?.addEventListener('click', hideConfirmationModal);
    cancelBtn?.addEventListener('click', hideConfirmationModal);
    
    // Confirm handler
    confirmBtn?.addEventListener('click', confirmChange);
    
    // Close on backdrop click
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideConfirmationModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) {
            hideConfirmationModal();
        }
    });
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Filter inputs
    const inputs = ['searchInput', 'statusFilter', 'typeFilter', 'priorityFilter'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(id === 'searchInput' ? 'input' : 'change', () => {
                applyFilters();
            });
        }
    });
}

// Handle page visibility changes (bfcache, tab switching)
function handlePageShow(event) {
    if (event.persisted || document.visibilityState === 'visible') {
        loadRequests(true);
    }
}

// Initialize page
onReady(() => {
    if (!checkAdminAccess()) return;
    
    // Force refresh on initial load to clear any stale cache
    loadRequests(true);
    initializeEventListeners();
    initializeConfirmationModal();
    
    // Re-fetch data when page is shown (handles back button, bfcache, tab switching)
    window.addEventListener('pageshow', handlePageShow);
    
    // Also handle visibility change for tab switching
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            loadRequests(true);
        }
    });
});
