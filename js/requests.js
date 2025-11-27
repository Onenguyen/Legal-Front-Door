// Request Management Functions

// Get all requests
function getAllRequests() {
    const requests = localStorage.getItem('legalFrontDoor_requests');
    return safeJsonParse(requests, []);
}

// Get request by ID
function getRequest(requestId) {
    const requests = getAllRequests();
    return requests.find(r => r.id === requestId);
}

// Get requests for a specific user
function getUserRequests(userId) {
    const requests = getAllRequests();
    return requests.filter(r => r.submittedBy === userId);
}

// Save request (update or create)
function saveRequest(request) {
    const requests = getAllRequests();
    const index = requests.findIndex(r => r.id === request.id);
    
    if (index !== -1) {
        requests[index] = request;
    } else {
        requests.push(request);
    }
    
    localStorage.setItem('legalFrontDoor_requests', JSON.stringify(requests));
    return request;
}

// Create new request
function createRequest(requestData) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('You must be logged in to create a request');
        return null;
    }
    
    const newRequest = {
        id: getNextRequestId(),
        title: requestData.title,
        type: requestData.type,
        priority: requestData.priority,
        status: 'Submitted',
        description: requestData.description,
        department: requestData.department,
        submittedBy: currentUser.id,
        assignedTo: null,
        submittedDate: new Date().toISOString(),
        files: requestData.files || [],
        timeline: [
            {
                date: new Date().toISOString(),
                event: 'Request Submitted',
                status: 'Submitted'
            }
        ]
    };
    
    return saveRequest(newRequest);
}

// Update request status
function updateRequestStatus(requestId, newStatus) {
    const request = getRequest(requestId);
    if (!request) return null;
    
    request.status = newStatus;
    
    // Add timeline event
    if (!request.timeline) {
        request.timeline = [];
    }
    request.timeline.push({
        date: new Date().toISOString(),
        event: `Status changed to ${newStatus}`,
        status: newStatus
    });
    
    return saveRequest(request);
}

// Update request assignment
function updateRequestAssignment(requestId, assignedToUserId) {
    const request = getRequest(requestId);
    if (!request) return null;
    
    request.assignedTo = assignedToUserId || null;
    
    // Add timeline event
    if (!request.timeline) {
        request.timeline = [];
    }
    
    const assigneeName = assignedToUserId ? getUserName(assignedToUserId) : 'Unassigned';
    request.timeline.push({
        date: new Date().toISOString(),
        event: `Request assigned to: ${assigneeName}`,
        status: request.status
    });
    
    return saveRequest(request);
}

// Get all comments
function getAllComments() {
    const comments = localStorage.getItem('legalFrontDoor_comments');
    return safeJsonParse(comments, []);
}

// Get comments for a specific request
function getRequestComments(requestId) {
    const comments = getAllComments();
    return comments.filter(c => c.requestId === requestId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Add comment to request
function addComment(requestId, userId, text) {
    const comments = getAllComments();
    
    const newComment = {
        id: generateId(),
        requestId: requestId,
        userId: userId,
        text: text,
        timestamp: new Date().toISOString()
    };
    
    comments.push(newComment);
    localStorage.setItem('legalFrontDoor_comments', JSON.stringify(comments));
    
    return newComment;
}


