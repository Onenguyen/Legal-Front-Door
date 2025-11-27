// Reusable Filter Controls Component
import { STATUS_OPTIONS, REQUEST_TYPE_OPTIONS, PRIORITY_OPTIONS } from '../core/constants.js';
import { escapeHtml } from '../utils/dom.js';

// Render filters section HTML
export function renderFiltersSection(options = {}) {
    const {
        showSearch = true,
        showStatus = true,
        showType = true,
        showPriority = true,
        showDateRange = true,
        searchPlaceholder = 'Search by title, ID, or description...'
    } = options;
    
    return `
        <div class="filters-section">
            ${showSearch ? `
                <div class="search-box">
                    <input type="text" id="searchInput" class="form-control" placeholder="${escapeHtml(searchPlaceholder)}">
                </div>
            ` : ''}
            <div class="filter-controls">
                ${showStatus ? `
                    <select id="statusFilter" class="form-control" multiple>
                        <option value="">All Statuses</option>
                        ${STATUS_OPTIONS.map(status => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join('')}
                    </select>
                ` : ''}
                ${showType ? `
                    <select id="typeFilter" class="form-control" multiple>
                        <option value="">All Types</option>
                        ${REQUEST_TYPE_OPTIONS.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}
                    </select>
                ` : ''}
                ${showPriority ? `
                    <select id="priorityFilter" class="form-control" multiple>
                        <option value="">All Priorities</option>
                        ${PRIORITY_OPTIONS.map(priority => `<option value="${escapeHtml(priority)}">${escapeHtml(priority)}</option>`).join('')}
                    </select>
                ` : ''}
                ${showDateRange ? `
                    <div class="date-filters">
                        <div class="date-input-group">
                            <label>From Date</label>
                            <input type="date" id="dateFrom" class="form-control">
                        </div>
                        <div class="date-input-group">
                            <label>To Date</label>
                            <input type="date" id="dateTo" class="form-control">
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Initialize filter controls with multi-select
export function initializeFilters(onChangeCallback) {
    // Import MultiSelect dynamically (already defined globally)
    const statusMultiSelect = new MultiSelect('statusFilter', {
        placeholder: 'All Statuses',
        onChange: onChangeCallback
    });
    
    const typeMultiSelect = new MultiSelect('typeFilter', {
        placeholder: 'All Types',
        onChange: onChangeCallback
    });
    
    const priorityMultiSelect = new MultiSelect('priorityFilter', {
        placeholder: 'All Priorities',
        onChange: onChangeCallback
    });
    
    // Attach event listeners to other filters
    const searchInput = document.getElementById('searchInput');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (searchInput) {
        searchInput.addEventListener('input', onChangeCallback);
    }
    
    if (dateFrom) {
        dateFrom.addEventListener('change', onChangeCallback);
    }
    
    if (dateTo) {
        dateTo.addEventListener('change', onChangeCallback);
    }
    
    return {
        statusMultiSelect,
        typeMultiSelect,
        priorityMultiSelect
    };
}

// Get current filter values
export function getFilterValues(multiSelects) {
    const searchInput = document.getElementById('searchInput');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    return {
        searchTerm: searchInput ? searchInput.value : '',
        statusFilter: multiSelects.statusMultiSelect ? multiSelects.statusMultiSelect.getValues() : [],
        typeFilter: multiSelects.typeMultiSelect ? multiSelects.typeMultiSelect.getValues() : [],
        priorityFilter: multiSelects.priorityMultiSelect ? multiSelects.priorityMultiSelect.getValues() : [],
        dateFrom: dateFrom ? dateFrom.value : null,
        dateTo: dateTo ? dateTo.value : null
    };
}

// Clear all filters
export function clearFilters(multiSelects) {
    const searchInput = document.getElementById('searchInput');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (searchInput) searchInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    if (multiSelects.statusMultiSelect) multiSelects.statusMultiSelect.clear();
    if (multiSelects.typeMultiSelect) multiSelects.typeMultiSelect.clear();
    if (multiSelects.priorityMultiSelect) multiSelects.priorityMultiSelect.clear();
}

// Filter requests based on filter values
export function filterRequests(requests, filterValues) {
    const { searchTerm, statusFilter, typeFilter, priorityFilter, dateFrom, dateTo } = filterValues;
    
    let filtered = [...requests];
    
    // Apply search term
    if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(request => {
            // Import getUserName from state if needed (or pass as dependency)
            return (
                request.title.toLowerCase().includes(term) ||
                request.description.toLowerCase().includes(term) ||
                request.id.includes(term) ||
                (request.department && request.department.toLowerCase().includes(term))
            );
        });
    }
    
    // Apply status filter
    if (statusFilter && statusFilter.length > 0) {
        filtered = filtered.filter(request => statusFilter.includes(request.status));
    }
    
    // Apply type filter
    if (typeFilter && typeFilter.length > 0) {
        filtered = filtered.filter(request => typeFilter.includes(request.type));
    }
    
    // Apply priority filter
    if (priorityFilter && priorityFilter.length > 0) {
        filtered = filtered.filter(request => priorityFilter.includes(request.priority));
    }
    
    // Apply date range filter
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(request => {
            const reqDate = new Date(request.submittedDate);
            return reqDate >= fromDate;
        });
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(request => {
            const reqDate = new Date(request.submittedDate);
            return reqDate <= toDate;
        });
    }
    
    return filtered;
}

