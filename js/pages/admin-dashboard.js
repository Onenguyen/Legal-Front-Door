// Admin Dashboard Page Logic
import { initializeDefaultUser, getAllRequests, getUsers, updateRequestAssignment, addComment } from '../core/state.js';
import { ROLES, ROUTES, STATUSES } from '../core/constants.js';
import { displayRequestsTable } from '../components/request-card.js';
import { initializeFilters, getFilterValues, filterRequests } from '../components/filters.js';
import { onReady } from '../utils/dom.js';

let allRequests = [];
let multiSelects = null;
let activeFilterCard = null;
let isFilteringByCard = false;
let currentUser = null;
let selectedRequestId = null;
const assignModalElements = {
    modal: null,
    description: null,
    select: null,
    confirmBtn: null,
    cancelBtn: null,
    closeBtn: null
};

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
function loadRequests() {
    allRequests = getAllRequests();
    updateStats(allRequests);
    displayRequestsTable(allRequests);
}

// Update statistics - m2 FIX: Use constants instead of magic strings
function updateStats(requests) {
    const totalEl = document.getElementById('totalRequests');
    const pendingEl = document.getElementById('pendingRequests');
    const inProgressEl = document.getElementById('inProgressRequests');
    const completedEl = document.getElementById('completedRequests');
    
    if (totalEl) totalEl.textContent = requests.length;
    if (pendingEl) {
        pendingEl.textContent = requests.filter(r => 
            r.status === STATUSES.SUBMITTED || r.status === STATUSES.UNDER_REVIEW
        ).length;
    }
    if (inProgressEl) {
        inProgressEl.textContent = requests.filter(r => r.status === STATUSES.IN_PROGRESS).length;
    }
    if (completedEl) {
        completedEl.textContent = requests.filter(r => 
            r.status === STATUSES.RESOLVED || r.status === STATUSES.CLOSED
        ).length;
    }
}

// Apply filters
function applyFilters() {
    if (!multiSelects) return;
    
    // Only check and clear active card if filters weren't set by card click
    if (!isFilteringByCard && activeFilterCard) {
        const filterValues = getFilterValues(multiSelects);
        const statusValues = filterValues.statusFilter;
        const typeValues = filterValues.typeFilter;
        const priorityValues = filterValues.priorityFilter;
        const searchValue = filterValues.searchTerm;
        const dateFrom = filterValues.dateFrom;
        const dateTo = filterValues.dateTo;
        
        const filterType = activeFilterCard.getAttribute('data-filter-type');
        let shouldClear = false;
        
        // m2 FIX: Use constants instead of magic strings
        if (filterType === 'all') {
            shouldClear = statusValues.length > 0 || typeValues.length > 0 || priorityValues.length > 0 || searchValue || dateFrom || dateTo;
        } else if (filterType === 'pending') {
            const expectedStatuses = [STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW];
            const statusMatch = arraysEqual(statusValues.sort(), expectedStatuses.sort());
            shouldClear = !statusMatch || typeValues.length > 0 || priorityValues.length > 0 || searchValue || dateFrom || dateTo;
        } else if (filterType === 'in-progress') {
            const expectedStatuses = [STATUSES.IN_PROGRESS];
            const statusMatch = arraysEqual(statusValues.sort(), expectedStatuses.sort());
            shouldClear = !statusMatch || typeValues.length > 0 || priorityValues.length > 0 || searchValue || dateFrom || dateTo;
        } else if (filterType === 'completed') {
            const expectedStatuses = [STATUSES.RESOLVED, STATUSES.CLOSED];
            const statusMatch = arraysEqual(statusValues.sort(), expectedStatuses.sort());
            shouldClear = !statusMatch || typeValues.length > 0 || priorityValues.length > 0 || searchValue || dateFrom || dateTo;
        }
        
        if (shouldClear) {
            setActiveCard(null);
        }
    }
    
    const filterValues = getFilterValues(multiSelects);
    const filtered = filterRequests(allRequests, filterValues);
    displayRequestsTable(filtered);
}

// Set active stat card
function setActiveCard(cardElement) {
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    if (cardElement) {
        cardElement.classList.add('active');
        activeFilterCard = cardElement;
    } else {
        activeFilterCard = null;
    }
}

// Filter by stat card click
function filterByCard(cardElement) {
    const filterType = cardElement.getAttribute('data-filter-type');
    isFilteringByCard = true;
    setActiveCard(cardElement);
    
    // Clear other filters first
    const searchInput = document.getElementById('searchInput');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (searchInput) searchInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    if (multiSelects.typeMultiSelect) multiSelects.typeMultiSelect.clear();
    if (multiSelects.priorityMultiSelect) multiSelects.priorityMultiSelect.clear();
    
    // Set status filter based on card type - m2 FIX: Use constants
    if (multiSelects.statusMultiSelect) {
        switch(filterType) {
            case 'all':
                multiSelects.statusMultiSelect.clear();
                break;
            case 'pending':
                multiSelects.statusMultiSelect.setValues([STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW]);
                break;
            case 'in-progress':
                multiSelects.statusMultiSelect.setValues([STATUSES.IN_PROGRESS]);
                break;
            case 'completed':
                multiSelects.statusMultiSelect.setValues([STATUSES.RESOLVED, STATUSES.CLOSED]);
                break;
        }
    }
    
    isFilteringByCard = false;
    applyFilters();
}

// Array equality helper
function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

// Initialize stat card filters
function initializeStatCardFilters() {
    const cards = [
        document.getElementById('totalRequestsCard'),
        document.getElementById('pendingRequestsCard'),
        document.getElementById('inProgressRequestsCard'),
        document.getElementById('completedRequestsCard')
    ];
    
    cards.forEach(card => {
        if (card) {
            card.addEventListener('click', function() {
                filterByCard(this);
            });
        }
    });
}

// Enable column resizing
function enableColumnResizing() {
    const table = document.querySelector('.requests-table');
    if (!table) return;
    
    const headers = table.querySelectorAll('th');

    headers.forEach(th => {
        // Create resizer element
        const resizer = document.createElement('div');
        resizer.classList.add('resizer');
        th.appendChild(resizer);

        // Track current position
        let x = 0;
        let w = 0;

        const mouseDownHandler = function(e) {
            x = e.clientX;
            
            const styles = window.getComputedStyle(th);
            w = parseInt(styles.width, 10);

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
            resizer.classList.add('resizing');
        };

        const mouseMoveHandler = function(e) {
            const dx = e.clientX - x;
            th.style.width = `${w + dx}px`;
        };

        const mouseUpHandler = function() {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            resizer.classList.remove('resizing');
        };

        resizer.addEventListener('mousedown', mouseDownHandler);
    });
}

// Assignment modal helpers
function initializeAssignModal() {
    assignModalElements.modal = document.getElementById('assignModal');
    assignModalElements.description = document.getElementById('assignModalDescription');
    assignModalElements.select = document.getElementById('assignUserSelect');
    assignModalElements.confirmBtn = document.getElementById('confirmAssignBtn');
    assignModalElements.cancelBtn = document.getElementById('cancelAssignBtn');
    assignModalElements.closeBtn = document.getElementById('assignModalClose');
    
    if (!assignModalElements.modal || !assignModalElements.select) {
        return;
    }
    
    if (assignModalElements.confirmBtn) {
        assignModalElements.confirmBtn.addEventListener('click', handleAssignConfirm);
    }
    
    if (assignModalElements.cancelBtn) {
        assignModalElements.cancelBtn.addEventListener('click', closeAssignModal);
    }
    
    if (assignModalElements.closeBtn) {
        assignModalElements.closeBtn.addEventListener('click', closeAssignModal);
    }
    
    assignModalElements.modal.addEventListener('click', (event) => {
        if (event.target === assignModalElements.modal) {
            closeAssignModal();
        }
    });
}

function populateAssignOptions(selectedUserId = '') {
    const select = assignModalElements.select;
    if (!select) return;
    
    const adminUsers = getUsers().filter(user => user.role === ROLES.ADMIN);
    select.innerHTML = '<option value="">Unassigned</option>';
    
    adminUsers.forEach(admin => {
        const option = document.createElement('option');
        option.value = admin.id;
        option.textContent = admin.name;
        select.appendChild(option);
    });
    
    if (selectedUserId) {
        select.value = selectedUserId;
    }
}

function openAssignModal(requestId) {
    if (!assignModalElements.modal || !assignModalElements.select) return;
    
    const request = allRequests.find(r => r.id === requestId);
    if (!request) return;
    
    selectedRequestId = requestId;
    populateAssignOptions(request.assignedTo || '');
    
    if (assignModalElements.description) {
        assignModalElements.description.textContent = `Assign "${request.title}" (REQ-${request.id}) to an admin.`;
    }
    
    assignModalElements.modal.style.display = 'flex';
}

function closeAssignModal() {
    if (assignModalElements.modal) {
        assignModalElements.modal.style.display = 'none';
    }
    if (assignModalElements.select) {
        assignModalElements.select.value = '';
    }
    selectedRequestId = null;
}

function handleAssignConfirm() {
    if (!selectedRequestId || !assignModalElements.select) return;
    
    const assignedTo = assignModalElements.select.value;
    const updatedRequest = updateRequestAssignment(selectedRequestId, assignedTo);
    
    if (!updatedRequest) {
        closeAssignModal();
        return;
    }
    
    const requestIndex = allRequests.findIndex(r => r.id === selectedRequestId);
    if (requestIndex !== -1) {
        allRequests[requestIndex] = updatedRequest;
    }
    
    if (currentUser) {
        const assignee = assignedTo ? getUsers().find(user => user.id === assignedTo) : null;
        const assigneeName = assignee ? assignee.name : 'Unassigned';
        addComment(selectedRequestId, currentUser.id, `Request assigned to: ${assigneeName}`);
    }
    
    closeAssignModal();
    
    if (multiSelects) {
        applyFilters();
    } else {
        displayRequestsTable(allRequests);
    }
}

// Initialize page
onReady(() => {
    if (!checkAdminAccess()) return;
    
    loadRequests();
    multiSelects = initializeFilters(applyFilters);
    initializeStatCardFilters();
    enableColumnResizing();
    initializeAssignModal();
});

window.openAssignModal = openAssignModal;

