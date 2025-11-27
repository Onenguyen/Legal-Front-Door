// Admin Dashboard Page Logic
import { initializeDefaultUser, getAllRequests } from '../core/state.js';
import { ROLES, ROUTES } from '../core/constants.js';
import { displayRequestsTable } from '../components/request-card.js';
import { initializeFilters, getFilterValues, filterRequests, clearFilters } from '../components/filters.js';
import { onReady } from '../utils/dom.js';

let allRequests = [];
let multiSelects = null;
let activeFilterCard = null;
let isFilteringByCard = false;

// Check admin access
function checkAdminAccess() {
    const currentUser = initializeDefaultUser();
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

// Update statistics
function updateStats(requests) {
    const totalEl = document.getElementById('totalRequests');
    const pendingEl = document.getElementById('pendingRequests');
    const inProgressEl = document.getElementById('inProgressRequests');
    const completedEl = document.getElementById('completedRequests');
    
    if (totalEl) totalEl.textContent = requests.length;
    if (pendingEl) {
        pendingEl.textContent = requests.filter(r => 
            r.status === 'Submitted' || r.status === 'Under Review'
        ).length;
    }
    if (inProgressEl) {
        inProgressEl.textContent = requests.filter(r => r.status === 'In Progress').length;
    }
    if (completedEl) {
        completedEl.textContent = requests.filter(r => 
            r.status === 'Resolved' || r.status === 'Closed'
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
        
        if (filterType === 'all') {
            shouldClear = statusValues.length > 0 || typeValues.length > 0 || priorityValues.length > 0 || searchValue || dateFrom || dateTo;
        } else if (filterType === 'pending') {
            const expectedStatuses = ['Submitted', 'Under Review'];
            const statusMatch = arraysEqual(statusValues.sort(), expectedStatuses.sort());
            shouldClear = !statusMatch || typeValues.length > 0 || priorityValues.length > 0 || searchValue || dateFrom || dateTo;
        } else if (filterType === 'in-progress') {
            const expectedStatuses = ['In Progress'];
            const statusMatch = arraysEqual(statusValues.sort(), expectedStatuses.sort());
            shouldClear = !statusMatch || typeValues.length > 0 || priorityValues.length > 0 || searchValue || dateFrom || dateTo;
        } else if (filterType === 'completed') {
            const expectedStatuses = ['Resolved', 'Closed'];
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
    
    // Set status filter based on card type
    if (multiSelects.statusMultiSelect) {
        switch(filterType) {
            case 'all':
                multiSelects.statusMultiSelect.clear();
                break;
            case 'pending':
                multiSelects.statusMultiSelect.setValues(['Submitted', 'Under Review']);
                break;
            case 'in-progress':
                multiSelects.statusMultiSelect.setValues(['In Progress']);
                break;
            case 'completed':
                multiSelects.statusMultiSelect.setValues(['Resolved', 'Closed']);
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

// Global function for view request
window.viewRequest = function(id) {
    window.location.href = `${ROUTES.REQUEST_DETAIL}?id=${id}`;
};

// Initialize page
onReady(() => {
    if (!checkAdminAccess()) return;
    
    loadRequests();
    multiSelects = initializeFilters(applyFilters);
    initializeStatCardFilters();
    enableColumnResizing();
});

