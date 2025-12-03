// Reusable Navigation Component
import { getCurrentUser } from '../core/state.js';
import { ROUTES, ROLES } from '../core/constants.js';

// Render navigation bar
export function renderNavbar(activePage = '') {
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === ROLES.ADMIN;
    
    // Hide the Submit Request button and My Requests link when on the learning page
    const isLearningPage = activePage === 'learning';
    const showSubmitButton = activePage !== 'submit' && !isLearningPage;
    
    const navHTML = `
        <nav class="navbar">
            <div class="nav-container">
                <div class="nav-brand">
                    <img src="https://www.cohesity.com/content/dam/cohesity/live/cohesity-logo-black-green.svg" alt="Cohesity">
                </div>
                <div class="nav-links">
                    <a href="${ROUTES.HOME}" class="${activePage === 'home' ? 'active' : ''}">Home</a>
                    ${isAdmin ? `<a href="${ROUTES.ADMIN_DASHBOARD}" class="${activePage === 'admin' ? 'active' : ''}">All Requests</a>` : ''}
                    ${!isLearningPage ? `<a href="${ROUTES.MY_REQUESTS}" class="${activePage === 'my-requests' ? 'active' : ''}">My Requests</a>` : ''}
                </div>
                <div class="nav-actions">
                    ${showSubmitButton ? `<a href="${ROUTES.SUBMIT_REQUEST}" class="btn-submit-request">Submit Request</a>` : ''}
                </div>
            </div>
        </nav>
    `;
    
    return navHTML;
}

// Initialize navbar in container
export function initNavbar(containerId = 'navbar', activePage = '') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = renderNavbar(activePage);
    }
}

// Detect active page from current URL
export function detectActivePage() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    
    if (page === ROUTES.HOME || page === '') {
        return 'home';
    } else if (page === ROUTES.MY_REQUESTS) {
        return 'my-requests';
    } else if (page === ROUTES.SUBMIT_REQUEST) {
        return 'submit';
    } else if (page === ROUTES.ADMIN_DASHBOARD) {
        return 'admin';
    } else if (page === ROUTES.REQUEST_DETAIL) {
        return 'detail';
    } else if (page === ROUTES.LEARNING) {
        return 'learning';
    }
    
    return '';
}

// Initialize navbar with auto-detection
export function autoInitNavbar(containerId = 'navbar') {
    const activePage = detectActivePage();
    initNavbar(containerId, activePage);
}

