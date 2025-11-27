// Reusable Request Card Component
import { STATUS_BADGE_CLASSES, PRIORITY_CLASSES, ROUTES } from '../core/constants.js';
import { getUserName } from '../core/state.js';
import { getIconForRequestType } from './icons.js';
import { escapeHtml, truncateText } from '../utils/dom.js';
import { formatDate } from '../utils/date.js';

// Render a single request card for grid view
export function renderRequestCard(request) {
    const icon = getIconForRequestType(request.type);
    const assignedUserName = request.assignedTo ? getUserName(request.assignedTo) : '';
    
    return `
        <div class="request-card" onclick="window.location.href='${ROUTES.REQUEST_DETAIL}?id=${escapeHtml(request.id)}'">
            <div class="card-icon ${icon.class}">
                ${icon.svg}
            </div>
            
            <div class="request-header-main">
                <h3 class="request-title">${escapeHtml(request.title)}</h3>
                <span class="status-text">${escapeHtml(request.status)}</span>
            </div>
            
            <div class="request-meta-info">
                <span>REQ-${escapeHtml(request.id)}</span>
                <span>•</span>
                <span>${escapeHtml(request.type)}</span>
                <span>•</span>
                <span>${formatDate(request.submittedDate)}</span>
                ${request.priority !== 'Medium' ? `<span>•</span><span class="${PRIORITY_CLASSES[request.priority]}">${escapeHtml(request.priority)}</span>` : ''}
            </div>
            
            <p class="request-desc">${escapeHtml(truncateText(request.description, 100))}</p>
            
            <div class="request-footer">
                <div class="assigned-user">
                    ${assignedUserName ? `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        ${escapeHtml(assignedUserName)}
                    ` : ''}
                </div>
                <div class="card-launch-btn">
                    View Details
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
        </div>
    `;
}

// Render multiple request cards in grid
export function renderRequestCards(requests) {
    if (!requests || requests.length === 0) {
        return `
            <div class="no-data">
                <p>No requests found matching your criteria.</p>
                <a href="${ROUTES.SUBMIT_REQUEST}" class="btn btn-primary">Submit Your First Request</a>
            </div>
        `;
    }
    
    return `
        <div class="requests-grid">
            ${requests.map(request => renderRequestCard(request)).join('')}
        </div>
    `;
}

// Display requests in container
export function displayRequests(containerId, requests) {
    const container = document.getElementById(containerId);
    const noRequestsEl = document.getElementById('noRequests');
    
    if (!container) return;
    
    if (requests.length === 0) {
        container.innerHTML = '';
        if (noRequestsEl) {
            noRequestsEl.style.display = 'block';
        }
        return;
    }
    
    if (noRequestsEl) {
        noRequestsEl.style.display = 'none';
    }
    
    container.innerHTML = requests.map(request => renderRequestCard(request)).join('');
}

// Render a table row for admin dashboard
export function renderRequestTableRow(request) {
    const assignedUserName = request.assignedTo ? getUserName(request.assignedTo) : '<span class="unassigned">Unassigned</span>';
    const submitterName = getUserName(request.submittedBy);
    
    return `
        <tr onclick="window.location.href='${ROUTES.REQUEST_DETAIL}?id=${escapeHtml(request.id)}'" style="cursor: pointer;">
            <td><strong>REQ-${escapeHtml(request.id)}</strong></td>
            <td>${escapeHtml(request.title)}</td>
            <td>${escapeHtml(request.type)}</td>
            <td><span class="${PRIORITY_CLASSES[request.priority]}">${escapeHtml(request.priority)}</span></td>
            <td><span class="status-text">${escapeHtml(request.status)}</span></td>
            <td>${escapeHtml(submitterName)}</td>
            <td>${assignedUserName}</td>
            <td>${formatDate(request.submittedDate)}</td>
            <td onclick="event.stopPropagation()">
                <button class="btn-small btn-primary" onclick="viewRequest('${escapeHtml(request.id)}')">View</button>
            </td>
        </tr>
    `;
}

// Display requests in table for admin dashboard
export function displayRequestsTable(requests) {
    const tbody = document.getElementById('requestsTableBody');
    const noRequests = document.getElementById('noRequests');
    const tableContainer = document.querySelector('.table-container');
    
    if (!tbody) return;
    
    if (requests.length === 0) {
        tbody.innerHTML = '';
        if (noRequests) noRequests.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }
    
    if (noRequests) noRequests.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
    
    tbody.innerHTML = requests.map(request => renderRequestTableRow(request)).join('');
}

// Render department card for home page
export function renderDepartmentCard(department) {
    const { value, label, description } = department;
    let iconName = 'arrow';
    
    // Map department to icon
    switch (value) {
        case 'Business Development':
            iconName = 'arrow';
            break;
        case 'CX / Customer Support / CERT':
            iconName = 'clock';
            break;
        case 'Engineering / OCTO':
            iconName = 'target';
            break;
        case 'FITOPS':
            iconName = 'cloud';
            break;
        case 'Marketing':
            iconName = 'speaker';
            break;
        case 'People & Places':
            iconName = 'user';
            break;
        case 'Product Management':
            iconName = 'package';
            break;
        case 'WWFO':
            iconName = 'globe';
            break;
    }
    
    return `
        <div class="department-card" data-category="${escapeHtml(value.toLowerCase())}" onclick="navigateToDepartment('${escapeHtml(value)}')">
            <div class="card-icon">
                ${getIconHtml(iconName)}
            </div>
            <h3>${escapeHtml(label)}</h3>
            <p>${escapeHtml(description)}</p>
            <div class="card-launch-btn">
                Launch
            </div>
        </div>
    `;
}

// Helper function to get icon HTML (simplified)
function getIconHtml(iconName) {
    const icons = {
        'arrow': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'clock': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'target': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`,
        'cloud': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'speaker': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'user': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'package': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22.08V12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'globe': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12h20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    };
    
    return icons[iconName] || icons['arrow'];
}

