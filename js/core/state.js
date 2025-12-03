// Centralized State Management with Caching
import { STORAGE_KEYS } from './constants.js';

// M5 FIX: Storage limits to prevent unbounded growth
const STORAGE_LIMITS = {
    MAX_REQUESTS: 1000,
    MAX_COMMENTS_PER_REQUEST: 100,
    MAX_TOTAL_COMMENTS: 5000
};

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

// M6 FIX: Listen for storage changes from other tabs
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('legalFrontDoor_')) {
            // Invalidate relevant cache when another tab modifies data
            if (e.key === STORAGE_KEYS.REQUESTS) {
                cache.requests = null;
                cache.userRequestsMap.clear();
            } else if (e.key === STORAGE_KEYS.USERS) {
                cache.users = null;
                cache.userLookupMap.clear();
            } else if (e.key === STORAGE_KEYS.COMMENTS) {
                cache.comments = null;
            } else if (e.key === STORAGE_KEYS.CURRENT_USER) {
                cache.currentUser = null;
            }
        }
    });
}

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

// ============================================
// Data Validation Functions (C5 Fix)
// ============================================

/**
 * Validate user object structure
 * @param {Object} user - User object to validate
 * @returns {boolean} True if valid
 */
function isValidUser(user) {
    if (!user || typeof user !== 'object') return false;
    if (typeof user.id !== 'string' || user.id.trim() === '') return false;
    if (typeof user.name !== 'string' || user.name.trim() === '') return false;
    if (typeof user.email !== 'string') return false;
    if (!['admin', 'employee'].includes(user.role)) return false;
    return true;
}

/**
 * Validate request object structure
 * @param {Object} request - Request object to validate
 * @returns {boolean} True if valid
 */
function isValidRequest(request) {
    if (!request || typeof request !== 'object') return false;
    // Accept both string and number IDs (coerce to string for comparison)
    if (request.id === null || request.id === undefined) return false;
    const idStr = String(request.id).trim();
    if (idStr === '' || idStr === 'null' || idStr === 'undefined') return false;
    // Be lenient with other fields - just check they exist (can be any type, will be coerced)
    // This prevents valid requests from being filtered out due to type mismatches
    return true;
}

/**
 * Validate comment object structure
 * @param {Object} comment - Comment object to validate
 * @returns {boolean} True if valid
 */
function isValidComment(comment) {
    if (!comment || typeof comment !== 'object') return false;
    if (typeof comment.id !== 'string' || comment.id.trim() === '') return false;
    if (typeof comment.requestId !== 'string') return false;
    if (typeof comment.userId !== 'string') return false;
    if (typeof comment.text !== 'string') return false;
    return true;
}

/**
 * Validate favorite object structure
 * @param {Object} favorite - Favorite object to validate
 * @returns {boolean} True if valid
 */
function isValidFavorite(favorite) {
    if (!favorite || typeof favorite !== 'object') return false;
    if (typeof favorite.id !== 'string' || favorite.id.trim() === '') return false;
    if (typeof favorite.userId !== 'string') return false;
    if (typeof favorite.name !== 'string') return false;
    return true;
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
            // Default to Dwight (employee) if available
            currentUser = users.find(u => u.name === 'Dwight') || users[0];
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
    const parsed = safeJsonParse(users, []);
    
    // Validate and filter invalid entries (C5 fix)
    cache.users = Array.isArray(parsed) 
        ? parsed.filter(user => isValidUser(user))
        : [];
    
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
    const parsed = safeJsonParse(requests, []);
    
    // Validate and filter invalid entries (C5 fix)
    // Also normalize fields for consistency
    cache.requests = Array.isArray(parsed)
        ? parsed.filter(request => isValidRequest(request)).map(request => ({
            ...request,
            id: String(request.id), // Ensure ID is always a string
            title: request.title || 'Untitled',
            status: request.status || 'Submitted',
            type: request.type || 'Other',
            priority: request.priority || 'Medium',
            submittedBy: request.submittedBy || '',
            submittedDate: request.submittedDate || new Date().toISOString()
        }))
        : [];
    
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
        // M5 FIX: Enforce storage limit - remove oldest if at capacity
        if (requests.length >= STORAGE_LIMITS.MAX_REQUESTS) {
            // Sort by date and remove oldest
            requests.sort((a, b) => new Date(a.submittedDate) - new Date(b.submittedDate));
            const removed = requests.shift();
            console.warn(`Storage limit reached. Removed oldest request: ${removed.id}`);
        }
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
                status: 'Submitted',
                userId: currentUser.id
            }
        ]
    };
    
    return saveRequest(newRequest);
}

export function updateRequestStatus(requestId, newStatus) {
    const request = getRequest(requestId);
    if (!request) return null;
    
    const currentUser = getCurrentUser();
    request.status = newStatus;
    
    // Add timeline event
    if (!request.timeline) {
        request.timeline = [];
    }
    request.timeline.push({
        date: new Date().toISOString(),
        event: `Status changed to ${newStatus}`,
        status: newStatus,
        userId: currentUser ? currentUser.id : null
    });
    
    return saveRequest(request);
}

export function updateRequestAssignment(requestId, assignedToUserId) {
    const request = getRequest(requestId);
    if (!request) return null;
    
    const currentUser = getCurrentUser();
    request.assignedTo = assignedToUserId || null;
    
    // Add timeline event
    if (!request.timeline) {
        request.timeline = [];
    }
    
    const assigneeName = assignedToUserId ? getUserName(assignedToUserId) : 'Unassigned';
    request.timeline.push({
        date: new Date().toISOString(),
        event: `Request assigned to: ${assigneeName}`,
        status: request.status,
        userId: currentUser ? currentUser.id : null
    });
    
    return saveRequest(request);
}

export function deleteRequest(requestId) {
    const requests = getAllRequests();
    const index = requests.findIndex(r => r.id === requestId);
    
    if (index === -1) {
        return false;
    }
    
    // Remove the request
    requests.splice(index, 1);
    
    // Save updated requests
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    
    // Invalidate cache
    cache.requests = null;
    cache.userRequestsMap.clear();
    
    // Also delete associated comments
    const comments = getAllComments();
    const updatedComments = comments.filter(c => c.requestId !== requestId);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updatedComments));
    
    // Invalidate comments cache
    cache.comments = null;
    
    return true;
}

// Comment Management
export function getAllComments() {
    if (cache.comments) {
        return cache.comments;
    }
    
    const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const parsed = safeJsonParse(comments, []);
    
    // Validate and filter invalid entries (C5 fix)
    cache.comments = Array.isArray(parsed)
        ? parsed.filter(comment => isValidComment(comment))
        : [];
    
    return cache.comments;
}

export function getRequestComments(requestId) {
    const comments = getAllComments();
    return comments.filter(c => c.requestId === requestId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export function addComment(requestId, userId, text) {
    const comments = getAllComments();
    
    // M5 FIX: Check per-request comment limit
    const requestComments = comments.filter(c => c.requestId === requestId);
    if (requestComments.length >= STORAGE_LIMITS.MAX_COMMENTS_PER_REQUEST) {
        console.warn(`Comment limit (${STORAGE_LIMITS.MAX_COMMENTS_PER_REQUEST}) reached for request ${requestId}`);
        return null;
    }
    
    // M5 FIX: Check total comments limit
    if (comments.length >= STORAGE_LIMITS.MAX_TOTAL_COMMENTS) {
        // Remove oldest comments (not from this request)
        const otherComments = comments.filter(c => c.requestId !== requestId);
        otherComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const toRemove = otherComments.slice(0, 10); // Remove 10 oldest
        toRemove.forEach(c => {
            const idx = comments.findIndex(comment => comment.id === c.id);
            if (idx !== -1) comments.splice(idx, 1);
        });
        console.warn('Total comment limit reached. Removed 10 oldest comments.');
    }
    
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
    const parsed = safeJsonParse(favorites, []);
    
    // Validate and filter invalid entries (C5 fix)
    const validFavorites = Array.isArray(parsed)
        ? parsed.filter(favorite => isValidFavorite(favorite))
        : [];
    
    return validFavorites.filter(f => f.userId === userId);
}

// Utility Functions
export function generateId() {
    return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

/**
 * Generate next request ID with race condition protection.
 * Uses a simple lock mechanism to prevent duplicate IDs when
 * multiple submissions happen in rapid succession.
 * @returns {string} Unique request ID
 */
export function getNextRequestId() {
    const lockKey = 'legalFrontDoor_idLock';
    const maxRetries = 10;
    const lockTimeout = 1000; // 1 second lock timeout
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const currentLock = localStorage.getItem(lockKey);
        const now = Date.now();
        
        // Check if lock exists and is not stale
        if (currentLock) {
            const lockTime = parseInt(currentLock, 10);
            if (!isNaN(lockTime) && (now - lockTime) < lockTimeout) {
                // Lock is held, wait briefly and retry
                continue;
            }
        }
        
        // Acquire lock
        localStorage.setItem(lockKey, now.toString());
        
        try {
            // Double-check we still hold the lock
            if (localStorage.getItem(lockKey) !== now.toString()) {
                continue; // Lost the race, retry
            }
            
            const nextId = localStorage.getItem(STORAGE_KEYS.NEXT_REQUEST_ID);
            const id = nextId ? parseInt(nextId, 10) : 1001;
            
            // Validate ID is a reasonable number
            if (isNaN(id) || id < 1001) {
                localStorage.setItem(STORAGE_KEYS.NEXT_REQUEST_ID, '1002');
                return '1001';
            }
            
            localStorage.setItem(STORAGE_KEYS.NEXT_REQUEST_ID, (id + 1).toString());
            return id.toString();
        } finally {
            // Release lock
            localStorage.removeItem(lockKey);
        }
    }
    
    // Fallback to timestamp-based ID if lock acquisition fails repeatedly
    console.warn('Failed to acquire ID lock, using fallback ID generation');
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

