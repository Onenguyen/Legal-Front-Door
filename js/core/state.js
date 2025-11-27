// Centralized State Management with Caching
import { STORAGE_KEYS } from './constants.js';

// Cache for frequently accessed data
const cache = {
    currentUser: null,
    users: null,
    requests: null,
    comments: null,
    favorites: null,
    userRequestsMap: new Map(),
    userLookupMap: new Map()
};

// Safe JSON parse with error handling
function safeJsonParse(jsonString, fallback = null) {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Failed to parse JSON:', e);
        return fallback;
    }
}

// Current User Management
export function getCurrentUser() {
    if (cache.currentUser) {
        return cache.currentUser;
    }
    
    const user = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    cache.currentUser = safeJsonParse(user, null);
    return cache.currentUser;
}

export function setCurrentUser(user) {
    cache.currentUser = user;
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

export function clearCurrentUser() {
    cache.currentUser = null;
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Initialize default user if not set
export function initializeDefaultUser() {
    let currentUser = getCurrentUser();
    if (!currentUser) {
        const users = getUsers();
        if (users.length > 0) {
            currentUser = users[0];
            setCurrentUser(currentUser);
        }
    }
    return currentUser;
}

// User Management
export function getUsers() {
    if (cache.users) {
        return cache.users;
    }
    
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    cache.users = safeJsonParse(users, []);
    
    // Build lookup map for faster access
    cache.users.forEach(user => {
        cache.userLookupMap.set(user.id, user);
    });
    
    return cache.users;
}

export function getUser(userId) {
    // Check cache first
    if (cache.userLookupMap.has(userId)) {
        return cache.userLookupMap.get(userId);
    }
    
    // Fallback to full search
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        cache.userLookupMap.set(userId, user);
    }
    
    return user;
}

export function getUserName(userId) {
    const user = getUser(userId);
    return user ? user.name : 'Unknown User';
}

// Request Management
export function getAllRequests() {
    if (cache.requests) {
        return cache.requests;
    }
    
    const requests = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    cache.requests = safeJsonParse(requests, []);
    return cache.requests;
}

export function getRequest(requestId) {
    const requests = getAllRequests();
    return requests.find(r => r.id === requestId);
}

export function getUserRequests(userId) {
    // Check cache first
    if (cache.userRequestsMap.has(userId)) {
        return cache.userRequestsMap.get(userId);
    }
    
    const requests = getAllRequests();
    const userRequests = requests.filter(r => r.submittedBy === userId);
    
    // Cache the result
    cache.userRequestsMap.set(userId, userRequests);
    
    return userRequests;
}

export function saveRequest(request) {
    const requests = getAllRequests();
    const index = requests.findIndex(r => r.id === request.id);
    
    if (index !== -1) {
        requests[index] = request;
    } else {
        requests.push(request);
    }
    
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    
    // Invalidate cache
    cache.requests = null;
    cache.userRequestsMap.clear();
    
    return request;
}

export function createRequest(requestData) {
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

export function updateRequestStatus(requestId, newStatus) {
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

export function updateRequestAssignment(requestId, assignedToUserId) {
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

// Comment Management
export function getAllComments() {
    if (cache.comments) {
        return cache.comments;
    }
    
    const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    cache.comments = safeJsonParse(comments, []);
    return cache.comments;
}

export function getRequestComments(requestId) {
    const comments = getAllComments();
    return comments.filter(c => c.requestId === requestId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export function addComment(requestId, userId, text) {
    const comments = getAllComments();
    
    const newComment = {
        id: generateId(),
        requestId: requestId,
        userId: userId,
        text: text,
        timestamp: new Date().toISOString()
    };
    
    comments.push(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    
    // Invalidate cache
    cache.comments = null;
    
    return newComment;
}

// Favorites Management
export function getUserFavorites(userId) {
    const favorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    const allFavorites = safeJsonParse(favorites, []);
    return allFavorites.filter(f => f.userId === userId);
}

// Utility Functions
export function generateId() {
    return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

export function getNextRequestId() {
    const nextId = localStorage.getItem(STORAGE_KEYS.NEXT_REQUEST_ID);
    const id = nextId ? parseInt(nextId) : 1001;
    localStorage.setItem(STORAGE_KEYS.NEXT_REQUEST_ID, (id + 1).toString());
    return id.toString();
}

// Cache Invalidation
export function invalidateCache(type = 'all') {
    switch (type) {
        case 'users':
            cache.users = null;
            cache.userLookupMap.clear();
            break;
        case 'requests':
            cache.requests = null;
            cache.userRequestsMap.clear();
            break;
        case 'comments':
            cache.comments = null;
            break;
        case 'currentUser':
            cache.currentUser = null;
            break;
        case 'all':
        default:
            cache.currentUser = null;
            cache.users = null;
            cache.requests = null;
            cache.comments = null;
            cache.favorites = null;
            cache.userRequestsMap.clear();
            cache.userLookupMap.clear();
            break;
    }
}

// Export cache for debugging purposes (optional)
export function getCacheStats() {
    return {
        hasCurrentUser: !!cache.currentUser,
        usersCount: cache.users?.length || 0,
        requestsCount: cache.requests?.length || 0,
        commentsCount: cache.comments?.length || 0,
        userRequestsCached: cache.userRequestsMap.size,
        userLookupsCached: cache.userLookupMap.size
    };
}

