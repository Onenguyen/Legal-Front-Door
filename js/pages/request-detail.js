// Request Detail Page Logic
import { 
    initializeDefaultUser, 
    getRequest, 
    getUsers, 
    getUserName,
    updateRequestStatus,
    updateRequestAssignment,
    getRequestComments,
    addComment,
    deleteRequest
} from '../core/state.js';
import { PRIORITY_CLASSES, ROLES } from '../core/constants.js';
import { onReady, getUrlParam, escapeHtml, toTitleCase, getStatusClass } from '../utils/dom.js';
import { formatDate, formatDateTime } from '../utils/date.js';

let currentRequest = null;
let currentUser = null;
let showAllComments = false;
const INITIAL_COMMENTS_COUNT = 4;

// m6 FIX: Cache DOM element references to avoid repeated queries
const domElements = {
    requestTitle: null,
    requestId: null,
    requestType: null,
    requestDepartment: null,
    requestSubmitter: null,
    requestDate: null,
    requestAssignedTo: null,
    requestDescription: null,
    requestPriority: null,
    requestStatus: null,
    filesSection: null,
    filesList: null,
    adminActions: null,
    statusSelect: null,
    assignSelect: null,
    commentsCard: null,
    commentsSection: null,
    commentsToggleWrapper: null,
    showMoreCommentsBtn: null,
    timeline: null,
    actionMenuContainer: null
};

// m6 FIX: Initialize DOM element cache
function initDomCache() {
    domElements.requestTitle = document.getElementById('requestTitle');
    domElements.requestId = document.getElementById('requestId');
    domElements.requestType = document.getElementById('requestType');
    domElements.requestDepartment = document.getElementById('requestDepartment');
    domElements.requestSubmitter = document.getElementById('requestSubmitter');
    domElements.requestDate = document.getElementById('requestDate');
    domElements.requestAssignedTo = document.getElementById('requestAssignedTo');
    domElements.requestDescription = document.getElementById('requestDescription');
    domElements.requestPriority = document.getElementById('requestPriority');
    domElements.requestStatus = document.getElementById('requestStatus');
    domElements.filesSection = document.getElementById('filesSection');
    domElements.filesList = document.getElementById('filesList');
    domElements.adminActions = document.getElementById('adminActions');
    domElements.statusSelect = document.getElementById('statusSelect');
    domElements.assignSelect = document.getElementById('assignSelect');
    domElements.commentsCard = document.getElementById('commentsCard');
    domElements.commentsSection = document.getElementById('commentsSection');
    domElements.commentsToggleWrapper = document.getElementById('commentsToggleWrapper');
    domElements.showMoreCommentsBtn = document.getElementById('showMoreCommentsBtn');
    domElements.timeline = document.getElementById('timeline');
    domElements.actionMenuContainer = document.getElementById('actionMenuContainer');
}

const HELP_TYPE_LABELS = {
    signature: 'Signature Request',
    contractPull: 'Contract Pull',
    other: 'General Request'
};

const WET_INK_OPTION_LABELS = {
    notarize: 'Notarize',
    stampSeal: 'Stamp / Seal',
    mailOriginals: 'Mail original versions'
};

const NOTARIAL_ACT_LABELS = {
    acknowledgements: 'Acknowledgment',
    jurats: 'Jurat',
    oathsAffirmations: 'Oath/Affirmation',
    witnessing: 'Signature Witnessing',
    certifiedCopy: 'Certified Copy'
};

const WET_INK_ORIGINALS_LABELS = {
    mailOriginals: 'Mail originals',
    fileWithLegal: 'File with Legal',
    destroy: 'Destroy',
    scannedCopy: 'Scanned Copy',
    other: 'Other'
};

const NOTARIZATION_LOCATION_LABELS = {
    unitedStates: 'United States',
    outsideUS: 'Outside of US'
};

// Check if user can edit this request
function canUserEditRequest(request, user) {
    if (!request || !user) return false;
    // Admins can edit any request
    if (user.role === ROLES.ADMIN) return true;
    // Users can edit their own requests
    if (request.submittedBy === user.id) return true;
    return false;
}

// Load request details - m6 FIX: Use cached DOM elements
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
    if (domElements.requestTitle) domElements.requestTitle.textContent = currentRequest.title;
    
    // Update request details using cached elements
    if (domElements.requestId) domElements.requestId.textContent = `REQ-${currentRequest.id}`;
    if (domElements.requestType) domElements.requestType.textContent = currentRequest.type;
    if (domElements.requestDepartment) domElements.requestDepartment.textContent = currentRequest.department || 'N/A';
    if (domElements.requestSubmitter) domElements.requestSubmitter.textContent = getUserName(currentRequest.submittedBy);
    if (domElements.requestDate) domElements.requestDate.textContent = formatDate(currentRequest.submittedDate);
    if (domElements.requestAssignedTo) domElements.requestAssignedTo.textContent = currentRequest.assignedTo ? getUserName(currentRequest.assignedTo) : 'Unassigned';
    
    // Priority with styling
    const prioritySpan = document.createElement('span');
    prioritySpan.className = PRIORITY_CLASSES[currentRequest.priority] || 'priority-medium';
    prioritySpan.textContent = currentRequest.priority;
    if (domElements.requestPriority) {
        domElements.requestPriority.innerHTML = '';
        domElements.requestPriority.appendChild(prioritySpan);
    }
    
    // Status badge
    if (domElements.requestStatus) {
        domElements.requestStatus.textContent = currentRequest.status;
        const statusClass = getStatusClass(currentRequest.status);
        domElements.requestStatus.className = `status-badge ${statusClass}`;
    }
    
    // Files
    if (currentRequest.files && currentRequest.files.length > 0) {
        if (domElements.filesSection) domElements.filesSection.style.display = 'block';
        if (domElements.filesList) {
            domElements.filesList.innerHTML = currentRequest.files.map(file => 
                `<li>${escapeHtml(file.name)} (${(file.size / 1024).toFixed(2)} KB)</li>`
            ).join('');
        }
    }

    renderRequestDescription(currentRequest);
    
    // Admin controls
    if (currentUser && currentUser.role === ROLES.ADMIN) {
        if (domElements.adminActions) {
            domElements.adminActions.style.display = 'block';
            
            if (domElements.statusSelect) domElements.statusSelect.value = currentRequest.status;
            
            // Populate admin assignees
            if (domElements.assignSelect) {
                const adminUsers = getUsers().filter(u => u.role === ROLES.ADMIN);
                
                // Clear existing options except "Unassigned"
                while (domElements.assignSelect.options.length > 1) {
                    domElements.assignSelect.remove(1);
                }
                
                // Add admin users as options
                adminUsers.forEach(admin => {
                    const option = document.createElement('option');
                    option.value = admin.id;
                    option.textContent = admin.name;
                    domElements.assignSelect.appendChild(option);
                });
                
                if (currentRequest.assignedTo) {
                    domElements.assignSelect.value = currentRequest.assignedTo;
                }
            }
        }
    }
    
    // Comments visibility
    if (domElements.commentsCard) {
        if (currentRequest.status === 'Submitted' && (!currentUser || currentUser.role !== ROLES.ADMIN)) {
            domElements.commentsCard.style.display = 'none';
        } else {
            domElements.commentsCard.style.display = 'block';
        }
    }
    
    updateSidebarLayout();
    loadTimeline();
    loadComments();
    
    // Show action menu if user can edit
    if (canUserEditRequest(currentRequest, currentUser)) {
        if (domElements.actionMenuContainer) {
            domElements.actionMenuContainer.style.display = 'block';
        }
    }
}

// Update sidebar layout visibility - m6 FIX: Use cached elements
function updateSidebarLayout() {
    const detailLayout = document.querySelector('.detail-layout');
    
    if (!detailLayout) return;
    
    const adminHidden = domElements.adminActions && window.getComputedStyle(domElements.adminActions).display === 'none';
    const commentsHidden = domElements.commentsCard && window.getComputedStyle(domElements.commentsCard).display === 'none';
    
    if (adminHidden && commentsHidden) {
        detailLayout.classList.add('sidebar-hidden');
    } else {
        detailLayout.classList.remove('sidebar-hidden');
    }
}

// Load timeline - m6 FIX: Use cached elements
function loadTimeline() {
    if (!domElements.timeline || !currentRequest) return;
    const timeline = domElements.timeline;
    
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

function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Load comments - Social Media Style
function loadComments() {
    if (!currentRequest) return;
    
    const requestId = currentRequest.id;
    const comments = getRequestComments(requestId);
    const commentsSection = domElements.commentsSection;
    
    if (!commentsSection) return;
    
    if (comments.length === 0) {
        commentsSection.innerHTML = `
            <div class="no-comments">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <p style="font-family: 'Space Grotesk', sans-serif;">No comments yet.<br>Start the conversation!</p>
            </div>
        `;
        updateCommentsToggle(0);
        return;
    }
    
    // Sort comments by timestamp (oldest first for chat view)
    const sortedComments = [...comments].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const visibleComments = showAllComments
        ? sortedComments
        : sortedComments.slice(Math.max(sortedComments.length - INITIAL_COMMENTS_COUNT, 0));
    
    commentsSection.innerHTML = visibleComments.map(comment => {
        const isOwn = currentUser && comment.userId === currentUser.id;
        const userName = getUserName(comment.userId);
        const initials = getInitials(userName);
        
        return `
        <div class="comment-item ${isOwn ? 'own-comment' : ''}">
            <div class="comment-avatar" title="${escapeHtml(userName)}">
                ${initials}
            </div>
            <div class="comment-content-wrapper">
                ${!isOwn ? `<div class="comment-author-header">${escapeHtml(userName)}</div>` : ''}
                <div class="comment-bubble">
                    <div class="comment-text">${escapeHtml(comment.text)}</div>
                </div>
                <div class="comment-meta">
                    ${formatDateTime(comment.timestamp)}
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    updateCommentsToggle(sortedComments.length);
    
    // Scroll to bottom
    setTimeout(() => {
        commentsSection.scrollTop = commentsSection.scrollHeight;
    }, 50);
}

function updateCommentsToggle(totalCount) {
    const wrapper = domElements.commentsToggleWrapper;
    const toggleBtn = domElements.showMoreCommentsBtn;
    
    if (totalCount <= INITIAL_COMMENTS_COUNT) {
        if (wrapper) wrapper.classList.remove('show');
        if (toggleBtn) toggleBtn.style.display = 'none';
        return;
    }
    
    if (wrapper) wrapper.classList.add('show');
    if (toggleBtn) {
        toggleBtn.style.display = 'inline-flex';
        toggleBtn.textContent = showAllComments
            ? 'Show recent comments'
            : `Show all ${totalCount} comments`;
    }
}

// Structured request details rendering - m6 FIX: Use cached elements
function renderRequestDescription(request) {
    if (!domElements.requestDescription || !request) return;
    const descriptionEl = domElements.requestDescription;
    
    const structured = parseStructuredDescription(request);
    
    if (!structured) {
        const fallbackText = (request.description && request.description.trim())
            ? request.description.trim()
            : 'No submission details provided.';
        descriptionEl.textContent = fallbackText;
        return;
    }
    
    const sections = [];
    
    if (structured.generalItems.length > 0) {
        sections.push(renderDetailsSection('Submission Overview', structured.generalItems));
    }
    
    if (structured.sectionTitle && structured.typeSpecificItems.length > 0) {
        sections.push(renderDetailsSection(structured.sectionTitle, structured.typeSpecificItems));
    }
    
    const notesHtml = renderNotesSection(structured.notes);
    const combinedHtml = `${sections.join('')}${notesHtml}`.trim();
    
    if (combinedHtml) {
        descriptionEl.innerHTML = combinedHtml;
    } else {
        descriptionEl.textContent = request.description || 'No submission details provided.';
    }
}

function parseStructuredDescription(request) {
    if (!request?.description) return null;
    
    let data;
    try {
        data = JSON.parse(request.description);
    } catch (error) {
        return null;
    }
    
    if (!data || typeof data !== 'object') return null;
    
    const generalItems = [];
    const typeSpecificItems = [];
    const notes = [];
    let sectionTitle = '';
    
    if (request.title) {
        generalItems.push({ label: 'Request Title', value: request.title });
    }
    
    const helpTypeLabel = getHelpTypeLabel(data.helpType);
    if (helpTypeLabel) {
        generalItems.push({ label: 'Help Needed', value: helpTypeLabel });
    }
    
    if (data.completionDate) {
        generalItems.push({ label: 'Need By', value: formatDate(data.completionDate) });
    }
    
    const submittingForValue = data.submittingForOtherDetails?.name
        || (data.submittingForOther ? data.submittingForOther : 'Self');
    if (submittingForValue) {
        generalItems.push({ label: 'Submitting For', value: submittingForValue });
    }
    
    const submittedTimestamp = data.submittedAt || request.submittedDate;
    if (submittedTimestamp) {
        generalItems.push({ label: 'Submitted', value: formatDateTime(submittedTimestamp) });
    }
    
    if (Array.isArray(request.files) && request.files.length > 0) {
        const fileCount = request.files.length;
        generalItems.push({ label: 'Files Uploaded', value: `${fileCount} file${fileCount === 1 ? '' : 's'}` });
    }
    
    switch (data.helpType) {
        case 'signature':
            sectionTitle = 'Signature Requirements';
            buildSignatureItems(data.signatureDetails || {}, typeSpecificItems, notes);
            break;
        case 'contractPull':
            sectionTitle = 'Contract Pull Details';
            buildContractPullItems(data.contractPullDetails || {}, typeSpecificItems, notes);
            break;
        case 'other':
            sectionTitle = 'Request Details';
            buildOtherItems(data.otherDetails || {}, notes);
            break;
        default:
            sectionTitle = '';
    }
    
    const cleanedGeneral = generalItems.filter(item => item.value);
    const cleanedType = typeSpecificItems.filter(item => item.value);
    const cleanedNotes = notes.filter(note => note.value);
    
    if (cleanedGeneral.length === 0 && cleanedType.length === 0 && cleanedNotes.length === 0) {
        return null;
    }
    
    return {
        generalItems: cleanedGeneral,
        typeSpecificItems: cleanedType,
        notes: cleanedNotes,
        sectionTitle
    };
}

function buildSignatureItems(details, items, notes) {
    if (!details || typeof details !== 'object') return;
    
    if (details.signatureType) {
        const label = details.signatureType === 'wetInk' ? 'Wet Ink' : 'E-Signature';
        items.push({ label: 'Signature Type', value: label });
    }
    
    if (typeof details.needsTranslation === 'boolean') {
        if (details.needsTranslation) {
            const translationValue = details.translationLanguage 
                ? `Yes (${details.translationLanguage})` 
                : 'Yes';
            items.push({ label: 'Needs Translation', value: translationValue });
        } else {
            items.push({ label: 'Needs Translation', value: 'No' });
        }
    }
    
    if (Array.isArray(details.wetInkOptions) && details.wetInkOptions.length > 0) {
        items.push({ 
            label: 'Wet Ink Options', 
            value: formatOptions(details.wetInkOptions, WET_INK_OPTION_LABELS) 
        });
    }
    
    if (details.scannedCopy) {
        items.push({ label: 'Scanned Copy Needed', value: formatYesNo(details.scannedCopy) });
    }
    
    if (details.wetInkOriginals) {
        const originalsLabel = WET_INK_ORIGINALS_LABELS[details.wetInkOriginals] || toTitleCase(details.wetInkOriginals);
        items.push({ label: 'Wet Ink Originals', value: originalsLabel });
    }
    
    if (details.wetInkCopies) {
        items.push({ label: 'Copies Needed', value: details.wetInkCopies.toString() });
    }
    
    if (details.notarization && Array.isArray(details.notarization.notarialActs) && details.notarization.notarialActs.length > 0) {
        items.push({
            label: 'Notarial Acts',
            value: formatOptions(details.notarization.notarialActs, NOTARIAL_ACT_LABELS)
        });
    }
    
    if (details.notarization && details.notarization.location) {
        const locationLabel = NOTARIZATION_LOCATION_LABELS[details.notarization.location] || toTitleCase(details.notarization.location);
        let locationValue = locationLabel;
        
        if (details.notarization.location === 'unitedStates' && details.notarization.state) {
            locationValue = `${locationLabel} — ${details.notarization.state}`;
        } else if (details.notarization.location === 'outsideUS' && details.notarization.country) {
            locationValue = `${locationLabel} — ${details.notarization.country}`;
        }
        
        items.push({ label: 'Notarization Location', value: locationValue });
    }
    
    if (details.notarization && details.notarization.apostille) {
        items.push({ label: 'Apostille Required', value: formatYesNo(details.notarization.apostille) });
        
        if (details.notarization.apostille === 'yes' && details.notarization.apostilleCountry) {
            items.push({ label: 'Apostille Country', value: details.notarization.apostilleCountry });
        }
    }
    
    if (details.mailingInfo) {
        const addressee = formatMailingAddressee(details.mailingInfo);
        if (addressee) {
            items.push({ label: 'Mail To', value: addressee });
        }
        
        const mailingAddress = formatMailingAddressLine(details.mailingInfo);
        if (mailingAddress) {
            items.push({ label: 'Mailing Address', value: mailingAddress });
        }
    }
    
    const notesText = details.additionalNotes?.trim();
    if (notesText) {
        notes.push({ title: 'Additional Notes', value: notesText });
    }
}

function buildContractPullItems(details, items, notes) {
    if (!details || typeof details !== 'object') return;
    
    if (details.salesContract) {
        items.push({ label: 'Sales Contract', value: formatYesNo(details.salesContract) });
    }
    
    if (details.originatingEntity) {
        items.push({ label: 'Originating Entity', value: toTitleCase(details.originatingEntity) });
    }
    
    const companyNames = details.companyNames?.trim();
    if (companyNames) {
        items.push({ label: 'Counterparty Name (s)', value: companyNames });
    }
    
    const agreementName = details.agreementName?.trim();
    if (agreementName) {
        items.push({ label: 'Agreement Type', value: agreementName });
    }
    
    const description = details.description?.trim();
    if (description) {
        notes.push({ title: 'Request Description', value: description });
    }
}

function buildOtherItems(details, notes) {
    if (!details || typeof details !== 'object') return;
    
    const description = details.description?.trim();
    if (description) {
        notes.push({ title: 'Request Details', value: description });
    }
}

function getHelpTypeLabel(helpType) {
    if (!helpType) return '';
    return HELP_TYPE_LABELS[helpType] || toTitleCase(helpType);
}

function formatOptions(values, dictionary) {
    if (!Array.isArray(values) || values.length === 0) return '';
    return values
        .map(value => dictionary[value] || toTitleCase(value))
        .join(', ');
}

function formatYesNo(value) {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'string') {
        const normalized = value.toLowerCase();
        if (normalized === 'yes' || normalized === 'true') return 'Yes';
        if (normalized === 'no' || normalized === 'false') return 'No';
        return toTitleCase(value);
    }
    
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    
    return value.toString();
}

function formatMailingAddressee(info) {
    if (!info) return '';
    const parts = [];
    if (info.recipient) parts.push(info.recipient);
    if (info.company) parts.push(info.company);
    return parts.join(' • ');
}

function formatMailingAddressLine(info) {
    if (!info) return '';
    const parts = [];
    if (info.address) parts.push(info.address);
    
    const cityState = [info.city, info.stateProvince].filter(Boolean).join(', ');
    if (cityState) parts.push(cityState);
    
    if (info.postalCode) parts.push(info.postalCode);
    if (info.country) parts.push(info.country);
    
    return parts.join(' • ');
}

function renderDetailsSection(title, items) {
    if (!items || items.length === 0) return '';
    
    const titleHtml = title ? `<h4>${escapeHtml(title)}</h4>` : '';
    
    const itemsHtml = items.map(item => `
        <div class="request-detail-item">
            <span class="detail-label">${escapeHtml(item.label)}</span>
            <span class="detail-value">${escapeHtml(item.value)}</span>
        </div>
    `).join('');
    
    return `
        <div class="request-details-section">
            ${titleHtml}
            <div class="request-details-list">
                ${itemsHtml}
            </div>
        </div>
    `;
}

function renderNotesSection(notes) {
    if (!notes || notes.length === 0) return '';
    
    const notesHtml = notes
        .filter(note => note.value)
        .map(note => `
            <div class="request-note">
                <label>${escapeHtml(note.title)}</label>
                <p>${formatMultilineText(note.value)}</p>
            </div>
        `).join('');
    
    if (!notesHtml) return '';
    
    return `
        <div class="request-notes">
            ${notesHtml}
        </div>
    `;
}

function formatMultilineText(text) {
    if (!text) return '';
    return escapeHtml(text).replace(/\n/g, '<br>');
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

// Initialize action menu
function initializeActionMenu() {
    const actionMenuBtn = document.getElementById('actionMenuBtn');
    const actionMenuDropdown = document.getElementById('actionMenuDropdown');
    const editBtn = document.getElementById('editRequestBtn');
    const cloneBtn = document.getElementById('cloneRequestBtn');
    const deleteBtn = document.getElementById('deleteRequestBtn');
    
    if (!actionMenuBtn || !actionMenuDropdown) return;
    
    // Toggle dropdown
    actionMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actionMenuDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        actionMenuDropdown.classList.remove('show');
    });
    
    // Prevent dropdown close when clicking inside
    actionMenuDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Edit request
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            // TODO: Navigate to edit page or open edit modal
            alert('Edit functionality coming soon!');
            actionMenuDropdown.classList.remove('show');
        });
    }
    
    // Clone request
    if (cloneBtn) {
        cloneBtn.addEventListener('click', () => {
            // TODO: Navigate to form with pre-filled data
            alert('Clone functionality coming soon!');
            actionMenuDropdown.classList.remove('show');
        });
    }
    
    // Delete request
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
                const success = deleteRequest(currentRequest.id);
                if (success) {
                    // Redirect to my-requests after successful deletion
                    window.location.href = 'my-requests.html';
                } else {
                    alert('Failed to delete request. Please try again.');
                }
            }
            actionMenuDropdown.classList.remove('show');
        });
    }
}

// Initialize page
onReady(() => {
    // m6 FIX: Initialize DOM cache first
    initDomCache();
    
    currentUser = initializeDefaultUser();
    loadRequestDetails();
    initializeTabs();
    initializeActionMenu();
    
    // Show more comments toggle - m6 FIX: Use cached elements
    if (domElements.showMoreCommentsBtn) {
        domElements.showMoreCommentsBtn.addEventListener('click', function() {
            showAllComments = !showAllComments;
            loadComments();
        });
    }
    
    // Add comment
    const addCommentBtn = document.getElementById('addCommentBtn');
    const newCommentInput = document.getElementById('newComment');
    
    function submitComment() {
        if (!currentRequest) return;
        
            if (!currentUser) {
                alert('Please log in to add comments');
                return;
            }
            
            const commentText = newCommentInput.value.trim();
        if (!commentText) return;
            
            addComment(currentRequest.id, currentUser.id, commentText);
            newCommentInput.value = '';
            loadComments();
    }

    if (addCommentBtn && newCommentInput && currentRequest) {
        addCommentBtn.addEventListener('click', submitComment);
        
        newCommentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitComment();
            }
        });
    }
    
    // Update status (admin only) - m6 FIX: Use cached elements
    if (domElements.statusSelect && currentRequest) {
        domElements.statusSelect.addEventListener('change', function() {
            const newStatus = this.value;
            updateRequestStatus(currentRequest.id, newStatus);
            loadRequestDetails();
            addComment(currentRequest.id, currentUser.id, `Status updated to: ${newStatus}`);
            loadComments();
        });
    }
    
    // Update assignment (admin only) - m6 FIX: Use cached elements
    const updateAssignmentBtn = document.getElementById('updateAssignmentBtn');
    if (updateAssignmentBtn && domElements.assignSelect && currentRequest) {
        updateAssignmentBtn.addEventListener('click', function() {
            const assignedTo = domElements.assignSelect.value;
            updateRequestAssignment(currentRequest.id, assignedTo);
            
            // Auto-update status to "Under Review" when someone is assigned
            if (assignedTo && currentRequest.status === 'Submitted') {
                updateRequestStatus(currentRequest.id, 'Under Review');
            }
            
            loadRequestDetails();
            
            const assigneeName = assignedTo ? getUserName(assignedTo) : 'Unassigned';
            addComment(currentRequest.id, currentUser.id, `Request assigned to: ${assigneeName}`);
            loadComments();
        });
    }
});

