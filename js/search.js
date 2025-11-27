// Search and Filter Functionality

// Filter requests based on search term and filters
function filterRequests(requests, searchTerm = '', statusFilter = '', typeFilter = '', priorityFilter = '', dateFrom = null, dateTo = null) {
    let filtered = [...requests];
    
    // Apply search term
    if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(request => {
            return (
                request.title.toLowerCase().includes(term) ||
                request.description.toLowerCase().includes(term) ||
                request.id.includes(term) ||
                getUserName(request.submittedBy).toLowerCase().includes(term) ||
                (request.department && request.department.toLowerCase().includes(term))
            );
        });
    }
    
    // Apply status filter
    if (statusFilter && statusFilter.length > 0) {
        if (Array.isArray(statusFilter)) {
            filtered = filtered.filter(request => statusFilter.includes(request.status));
        } else if (statusFilter !== '') {
            filtered = filtered.filter(request => request.status === statusFilter);
        }
    }
    
    // Apply type filter
    if (typeFilter && typeFilter.length > 0) {
        if (Array.isArray(typeFilter)) {
            filtered = filtered.filter(request => typeFilter.includes(request.type));
        } else if (typeFilter !== '') {
            filtered = filtered.filter(request => request.type === typeFilter);
        }
    }
    
    // Apply priority filter
    if (priorityFilter && priorityFilter.length > 0) {
        if (Array.isArray(priorityFilter)) {
            filtered = filtered.filter(request => priorityFilter.includes(request.priority));
        } else if (priorityFilter !== '') {
            filtered = filtered.filter(request => request.priority === priorityFilter);
        }
    }

    // Apply Date Range Filter
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        // Reset time to start of day for accurate comparison
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(request => {
            const reqDate = new Date(request.submittedDate);
            return reqDate >= fromDate;
        });
    }

    if (dateTo) {
        const toDate = new Date(dateTo);
        // Set time to end of day
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(request => {
            const reqDate = new Date(request.submittedDate);
            return reqDate <= toDate;
        });
    }
    
    return filtered;
}


