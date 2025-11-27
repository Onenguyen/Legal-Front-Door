// Request Detail Page Logic
import { 
    initializeDefaultUser, 
    getRequest, 
    getUsers, 
    getUserName,
    updateRequestStatus,
    updateRequestAssignment,
    getRequestComments,
    addComment
} from '../core/state.js';
import { STATUS_BADGE_CLASSES, PRIORITY_CLASSES, ROLES } from '../core/constants.js';
import { onReady, getUrlParam, escapeHtml } from '../utils/dom.js';
import { formatDate, formatDateTime } from '../utils/date.js';

let currentRequest = null;
let currentUser = null;
let showAllComments = false;
const INITIAL_COMMENTS_COUNT = 4;

// Load request details
function loadRequestDetails() {
    const requestId = getUrlParam('id');
    
    if (!requestId) {
        window.location.href = 'my-requests.html';
        return;
    }
    
    currentRequest = getRequest(requestId);
    
    if (!currentRequest) {
        alert('Request not found');
        window.location.href = 'my-requests.html';
        return;
    }
    
    // Update page title
    const titleEl = document.getElementById('requestTitle');
    if (titleEl) titleEl.textContent = currentRequest.title;
    
    // Update request details
    const details = {
        'requestId': `REQ-${currentRequest.id}`,
        'requestType': currentRequest.type,
        'requestDepartment': currentRequest.department || 'N/A',
        'requestSubmitter': getUserName(currentRequest.submittedBy),
        'requestDate': formatDate(currentRequest.submittedDate),
        'requestAssignedTo': currentRequest.assignedTo ? getUserName(currentRequest.assignedTo) : 'Unassigned',
        'requestDescription': currentRequest.description
    };
    
    Object.entries(details).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
    
    // Priority with styling
    const prioritySpan = document.createElement('span');
    prioritySpan.className = PRIORITY_CLASSES[currentRequest.priority];
    prioritySpan.textContent = currentRequest.priority;
    const priorityContainer = document.getElementById('requestPriority');
    if (priorityContainer) {
        priorityContainer.innerHTML = '';
        priorityContainer.appendChild(prioritySpan);
    }
    
    // Status text
    const statusBadge = document.getElementById('requestStatus');
    if (statusBadge) {
        statusBadge.textContent = currentRequest.status;
        statusBadge.className = 'status-text';
    }
    
    // Files
    if (currentRequest.files && currentRequest.files.length > 0) {
        const filesSection = document.getElementById('filesSection');
        const filesList = document.getElementById('filesList');
        if (filesSection) filesSection.style.display = 'block';
        if (filesList) {
            filesList.innerHTML = currentRequest.files.map(file => 
                `<li>${escapeHtml(file.name)} (${(file.size / 1024).toFixed(2)} KB)</li>`
            ).join('');
        }
    }
    
    // Admin controls
    if (currentUser && currentUser.role === ROLES.ADMIN) {
        const adminActions = document.getElementById('adminActions');
        if (adminActions) {
            adminActions.style.display = 'block';
            
            const statusSelect = document.getElementById('statusSelect');
            if (statusSelect) statusSelect.value = currentRequest.status;
            
            // Populate admin assignees
            const assignSelect = document.getElementById('assignSelect');
            if (assignSelect) {
                const adminUsers = getUsers().filter(u => u.role === ROLES.ADMIN);
                
                // Clear existing options except "Unassigned"
                while (assignSelect.options.length > 1) {
                    assignSelect.remove(1);
                }
                
                // Add admin users as options
                adminUsers.forEach(admin => {
                    const option = document.createElement('option');
                    option.value = admin.id;
                    option.textContent = admin.name;
                    assignSelect.appendChild(option);
                });
                
                if (currentRequest.assignedTo) {
                    assignSelect.value = currentRequest.assignedTo;
                }
            }
        }
    }
    
    // Comments visibility
    const commentsCard = document.getElementById('commentsCard');
    if (commentsCard) {
        if (currentRequest.status === 'Submitted' && (!currentUser || currentUser.role !== ROLES.ADMIN)) {
            commentsCard.style.display = 'none';
        } else {
            commentsCard.style.display = 'block';
        }
    }
    
    updateSidebarLayout();
    loadTimeline();
    loadComments();
}

// Update sidebar layout visibility
function updateSidebarLayout() {
    const adminActions = document.getElementById('adminActions');
    const commentsCard = document.getElementById('commentsCard');
    const detailLayout = document.querySelector('.detail-layout');
    
    if (!detailLayout) return;
    
    const adminHidden = adminActions && window.getComputedStyle(adminActions).display === 'none';
    const commentsHidden = commentsCard && window.getComputedStyle(commentsCard).display === 'none';
    
    if (adminHidden && commentsHidden) {
        detailLayout.classList.add('sidebar-hidden');
    } else {
        detailLayout.classList.remove('sidebar-hidden');
    }
}

// Load timeline
function loadTimeline() {
    const timeline = document.getElementById('timeline');
    if (!timeline || !currentRequest) return;
    
    const events = currentRequest.timeline || [
        { date: currentRequest.submittedDate, event: 'Request Submitted', status: 'Submitted' }
    ];
    
    // Sort events by date (most recent first)
    const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    timeline.innerHTML = sortedEvents.map((event, index) => `
        <div class="timeline-item" style="animation-delay: ${index * 0.05}s;">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-event">${escapeHtml(event.event)}</div>
                <div class="timeline-date">${formatDateTime(event.date)}</div>
            </div>
        </div>
    `).join('');
}

// Load comments
function loadComments() {
    if (!currentRequest) return;
    
    const requestId = currentRequest.id;
    const comments = getRequestComments(requestId);
    const commentsSection = document.getElementById('commentsSection');
    const showMoreBtn = document.getElementById('showMoreCommentsBtn');
    
    if (!commentsSection) return;
    
    if (comments.length === 0) {
        commentsSection.innerHTML = '<p class="no-comments">No comments yet.</p>';
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        return;
    }
    
    // Sort comments by timestamp (most recent first)
    const sortedComments = [...comments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Determine how many comments to show
    const commentsToShow = showAllComments ? sortedComments : sortedComments.slice(0, INITIAL_COMMENTS_COUNT);
    
    commentsSection.innerHTML = commentsToShow.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <strong>${escapeHtml(getUserName(comment.userId))}</strong>
                <span class="comment-date">${formatDateTime(comment.timestamp)}</span>
            </div>
            <div class="comment-body">${escapeHtml(comment.text)}</div>
        </div>
    `).join('');
    
    // Show/hide the "Show More" button
    if (showMoreBtn) {
        if (sortedComments.length > INITIAL_COMMENTS_COUNT) {
            showMoreBtn.style.display = 'flex';
            showMoreBtn.textContent = showAllComments 
                ? `Show Less Comments` 
                : `Show More Comments (${sortedComments.length - INITIAL_COMMENTS_COUNT} more)`;
        } else {
            showMoreBtn.style.display = 'none';
        }
    }
}

// Initialize tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding tab
            button.classList.add('active');
            const tabContent = document.getElementById(`${tabName}-tab`);
            if (tabContent) tabContent.classList.add('active');
        });
    });
}

// Initialize page
onReady(() => {
    currentUser = initializeDefaultUser();
    loadRequestDetails();
    initializeTabs();
    
    // Show more comments toggle
    const showMoreBtn = document.getElementById('showMoreCommentsBtn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            showAllComments = !showAllComments;
            loadComments();
        });
    }
    
    // Add comment
    const addCommentBtn = document.getElementById('addCommentBtn');
    const newCommentInput = document.getElementById('newComment');
    if (addCommentBtn && newCommentInput && currentRequest) {
        addCommentBtn.addEventListener('click', function() {
            const commentText = newCommentInput.value.trim();
            if (!commentText) {
                alert('Please enter a comment');
                return;
            }
            
            addComment(currentRequest.id, currentUser.id, commentText);
            newCommentInput.value = '';
            loadComments();
        });
    }
    
    // Update status (admin only)
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect && currentRequest) {
        statusSelect.addEventListener('change', function() {
            const newStatus = this.value;
            updateRequestStatus(currentRequest.id, newStatus);
            loadRequestDetails();
            addComment(currentRequest.id, currentUser.id, `Status updated to: ${newStatus}`);
            loadComments();
        });
    }
    
    // Update assignment (admin only)
    const updateAssignmentBtn = document.getElementById('updateAssignmentBtn');
    const assignSelect = document.getElementById('assignSelect');
    if (updateAssignmentBtn && assignSelect && currentRequest) {
        updateAssignmentBtn.addEventListener('click', function() {
            const assignedTo = assignSelect.value;
            updateRequestAssignment(currentRequest.id, assignedTo);
            loadRequestDetails();
            
            const assigneeName = assignedTo ? getUserName(assignedTo) : 'Unassigned';
            addComment(currentRequest.id, currentUser.id, `Request assigned to: ${assigneeName}`);
            loadComments();
        });
    }
});

