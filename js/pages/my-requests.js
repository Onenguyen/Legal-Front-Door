// My Requests Page Logic
import { initializeDefaultUser, getUserRequests, invalidateCache, getUserName } from '../core/state.js';
import { renderRequestCard } from '../components/request-card.js';
import { onReady, escapeHtml } from '../utils/dom.js';
import { formatDate } from '../utils/date.js';
import { STATUSES, ROUTES } from '../core/constants.js';

let allRequests = [];
let currentUser = null;
let currentView = localStorage.getItem('myRequestsViewPreference') || 'kanban'; // 'kanban' or 'table'

// Render requests into Kanban columns
function renderKanbanBoard(requests) {
    // Clear columns
    const cols = {
        submitted: document.getElementById('col-submitted'),
        review: document.getElementById('col-review'),
        progress: document.getElementById('col-progress'),
        done: document.getElementById('col-done')
    };
    
    const counts = {
        submitted: document.getElementById('count-submitted'),
        review: document.getElementById('count-review'),
        progress: document.getElementById('count-progress'),
        done: document.getElementById('count-done')
    };
    
    // Reset content
    Object.values(cols).forEach(col => {
        if (col) col.innerHTML = '';
    });
    
    const counters = {
        submitted: 0,
        review: 0,
        progress: 0,
        done: 0
    };

    const noRequestsEl = document.getElementById('noRequests');
    const kanbanBoard = document.getElementById('kanbanBoard');
    const tableView = document.getElementById('tableView');

    if (requests.length === 0) {
        if (kanbanBoard) kanbanBoard.style.display = 'none';
        if (tableView) tableView.style.display = 'none';
        if (noRequestsEl) noRequestsEl.style.display = 'block';
        // Reset counts to 0
        Object.values(counts).forEach(el => { if(el) el.textContent = '0'; });
        return;
    }

    // Show the appropriate view based on currentView
    if (currentView === 'kanban') {
        if (kanbanBoard) kanbanBoard.style.display = 'flex';
        if (tableView) tableView.style.display = 'none';
    } else {
        if (kanbanBoard) kanbanBoard.style.display = 'none';
        if (tableView) tableView.style.display = 'block';
    }
    if (noRequestsEl) noRequestsEl.style.display = 'none';

    requests.forEach(req => {
        const cardHtml = renderRequestCard(req);
        let targetCol = null;
        
        switch (req.status) {
            case STATUSES.SUBMITTED:
                targetCol = cols.submitted;
                counters.submitted++;
                break;
            case STATUSES.UNDER_REVIEW:
                targetCol = cols.review;
                counters.review++;
                break;
            case STATUSES.IN_PROGRESS:
                targetCol = cols.progress;
                counters.progress++;
                break;
            case STATUSES.RESOLVED:
            case STATUSES.CLOSED:
                targetCol = cols.done;
                counters.done++;
                break;
            default:
                // Default to submitted if unknown
                targetCol = cols.submitted;
                counters.submitted++;
        }
        
        if (targetCol) {
            targetCol.insertAdjacentHTML('beforeend', cardHtml);
        }
    });
    
    // Update counts
    if (counts.submitted) counts.submitted.textContent = counters.submitted;
    if (counts.review) counts.review.textContent = counters.review;
    if (counts.progress) counts.progress.textContent = counters.progress;
    if (counts.done) counts.done.textContent = counters.done;
}

// Render requests into table view
function renderTableView(requests) {
    const tbody = document.getElementById('requestsTableBody');
    const noRequestsEl = document.getElementById('noRequests');
    const kanbanBoard = document.getElementById('kanbanBoard');
    const tableView = document.getElementById('tableView');
    
    if (!tbody) return;
    
    if (requests.length === 0) {
        tbody.innerHTML = '';
        if (kanbanBoard) kanbanBoard.style.display = 'none';
        if (tableView) tableView.style.display = 'none';
        if (noRequestsEl) noRequestsEl.style.display = 'block';
        return;
    }
    
    // Show table view, hide kanban
    if (kanbanBoard) kanbanBoard.style.display = 'none';
    if (tableView) tableView.style.display = 'block';
    if (noRequestsEl) noRequestsEl.style.display = 'none';
    
    // Sort by date descending
    const sortedRequests = [...requests].sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
    
    tbody.innerHTML = sortedRequests.map(req => {
        const detailUrl = `${ROUTES.REQUEST_DETAIL}?id=${encodeURIComponent(req.id)}`;
        
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
        
        // Get submitter name
        const submittedByName = req.submittedBy ? getUserName(req.submittedBy) : '—';
        
        // Get assignee name
        const assignedToName = req.assignedTo ? getUserName(req.assignedTo) : '—';
        
        return `
            <tr data-id="${req.id}">
                <td><a href="${detailUrl}" class="table-link-id">REQ-${escapeHtml(req.id)}</a></td>
                <td>${formatDate(req.submittedDate)}</td>
                <td>${escapeHtml(submittedByName)}</td>
                <td><a href="${detailUrl}" class="table-link-title">${escapeHtml(req.title)}</a></td>
                <td>${escapeHtml(req.type)}</td>
                <td>${escapeHtml(req.priority)}</td>
                <td>${escapeHtml(req.status)}</td>
                <td>${escapeHtml(assignedToName)}</td>
                <td>${needByDate}</td>
            </tr>
        `;
    }).join('');
}

// Get status class for badge
function getStatusClass(status) {
    switch (status) {
        case STATUSES.SUBMITTED:
            return 'status-submitted';
        case STATUSES.UNDER_REVIEW:
            return 'status-review';
        case STATUSES.IN_PROGRESS:
            return 'status-progress';
        case STATUSES.RESOLVED:
        case STATUSES.CLOSED:
            return 'status-done';
        default:
            return 'status-submitted';
    }
}

// Load user requests (force refresh from localStorage)
function loadRequests(forceRefresh = false) {
    if (forceRefresh) {
        // Invalidate cache to ensure we get fresh data from localStorage
        invalidateCache('requests');
    }
    
    currentUser = initializeDefaultUser();
    if (currentUser) {
        allRequests = getUserRequests(currentUser.id);
        applyFilters();
    }
}

// Get filter values from native selects
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

// Apply filters to requests
function applyFilters() {
    const filters = getFilterValues();
    
    let filtered = allRequests.filter(req => {
        // Text Search
        if (filters.search) {
            const searchStr = `${req.id} ${req.title} ${req.description || ''}`.toLowerCase();
            if (!searchStr.includes(filters.search)) return false;
        }
        
        // Dropdown Filters
        if (filters.status && req.status !== filters.status) return false;
        if (filters.type && req.type !== filters.type) return false;
        if (filters.priority && req.priority !== filters.priority) return false;
        
        return true;
    });
    
    // Render appropriate view
    if (currentView === 'kanban') {
        renderKanbanBoard(filtered);
    } else {
        renderTableView(filtered);
    }
}

// Switch between kanban and table views
function switchView(view) {
    currentView = view;
    
    // Save preference to localStorage
    localStorage.setItem('myRequestsViewPreference', view);
    
    // Update toggle buttons
    const toggleBtns = document.querySelectorAll('.view-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Re-render with current filters
    applyFilters();
}

// Initialize view toggle
function initializeViewToggle() {
    const toggleBtns = document.querySelectorAll('.view-toggle-btn');
    
    // Set correct active state based on saved preference
    toggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === currentView);
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
        });
    });
}

// Handle page visibility changes (bfcache, tab switching)
function handlePageShow(event) {
    // persisted = true means the page was restored from bfcache
    // Always refresh to catch any changes made on other pages
    if (event.persisted || document.visibilityState === 'visible') {
        loadRequests(true);
    }
}

// Initialize event listeners for filters
function initializeEventListeners() {
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

// Initialize page
onReady(() => {
    loadRequests();
    initializeEventListeners();
    initializeViewToggle();
    
    // Re-fetch data when page is shown (handles back button, bfcache, tab switching)
    window.addEventListener('pageshow', handlePageShow);
    
    // Also handle visibility change for tab switching
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            loadRequests(true);
        }
    });
});

