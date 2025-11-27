// My Requests Page Logic
import { initializeDefaultUser, getUserRequests } from '../core/state.js';
import { displayRequests } from '../components/request-card.js';
import { initializeFilters, getFilterValues, filterRequests } from '../components/filters.js';
import { onReady } from '../utils/dom.js';

let allRequests = [];
let multiSelects = null;

// Load user requests
function loadRequests() {
    const currentUser = initializeDefaultUser();
    if (currentUser) {
        allRequests = getUserRequests(currentUser.id);
        displayRequests('requestsContainer', allRequests);
    }
}

// Apply filters and update display
function applyFilters() {
    if (!multiSelects) return;
    
    const filterValues = getFilterValues(multiSelects);
    const filtered = filterRequests(allRequests, filterValues);
    displayRequests('requestsContainer', filtered);
}

// Initialize page
onReady(() => {
    loadRequests();
    multiSelects = initializeFilters(applyFilters);
});

