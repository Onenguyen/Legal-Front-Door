// Core Application Logic and Data Management

// HTML escape utility to prevent XSS attacks
function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

// Get all users
function getUsers() {
    const users = localStorage.getItem('legalFrontDoor_users');
    return safeJsonParse(users, []);
}

// Get user by ID
function getUser(userId) {
    const users = getUsers();
    return users.find(u => u.id === userId);
}

// Get user name by ID
function getUserName(userId) {
    const user = getUser(userId);
    return user ? user.name : 'Unknown User';
}

// Get favorites for user
function getUserFavorites(userId) {
    const favorites = localStorage.getItem('legalFrontDoor_favorites');
    const allFavorites = safeJsonParse(favorites, []);
    return allFavorites.filter(f => f.userId === userId);
}

// Launch a favorite
function launchFavorite(favorite) {
    const prefill = favorite?.prefill || {};
    if (prefill.department) {
        sessionStorage.setItem('prefilledDepartment', prefill.department);
    }
    if (prefill.type) {
        sessionStorage.setItem('prefilledRequestType', prefill.type);
    }
    if (prefill.title) {
        sessionStorage.setItem('prefilledTitle', prefill.title);
    }
    window.location.href = 'lops-general-intake.html';
}

// Current user management
function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
    const user = sessionStorage.getItem('currentUser');
    return safeJsonParse(user, null);
}

function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
}

// Date formatting utilities
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// Generate unique ID
function generateId() {
    return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

// Get next request ID
function getNextRequestId() {
    const nextId = localStorage.getItem('legalFrontDoor_nextRequestId');
    const id = nextId ? parseInt(nextId) : 1001;
    localStorage.setItem('legalFrontDoor_nextRequestId', (id + 1).toString());
    return id.toString();
}

// DOM ready helper
function onReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

// Initialize tooltips or other UI enhancements
function initializeUI() {
    // Initialize default user if not set (defaults to Dwight)
    initializeDefaultUser();
    
    // Initialize header user dropdown
    initializeUserDropdown();
    
    // Initialize role switcher
    initializeRoleSwitcher();
    
    // Initialize search icon
    initializeSearchIcon();
    
    // Update navigation for admin
    updateNavigationForAdmin();
}

// Initialize default user if not set
function initializeDefaultUser() {
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

// Update navigation for Admin role
function updateNavigationForAdmin() {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            // Check if link already exists
            const existingLink = Array.from(navLinks.children).find(a => a.getAttribute('href') === 'admin-dashboard.html');
            
            if (!existingLink) {
                const allRequestsLink = document.createElement('a');
                allRequestsLink.href = 'admin-dashboard.html';
                allRequestsLink.textContent = 'All Requests';
                
                // Highlight if active
                if (window.location.pathname.includes('admin-dashboard.html')) {
                    allRequestsLink.className = 'active';
                }
                
                // Insert after Home (first child)
                if (navLinks.children.length > 0) {
                    navLinks.insertBefore(allRequestsLink, navLinks.children[1]);
                } else {
                    navLinks.appendChild(allRequestsLink);
                }
            }
        }
    }
}

// Role switcher functionality
function initializeRoleSwitcher() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    // Create container
    const switcherContainer = document.createElement('div');
    switcherContainer.className = 'role-switcher';
    switcherContainer.style.marginRight = '1rem';

    // Create select
    const select = document.createElement('select');
    select.className = 'form-control';
    select.style.padding = '0.4rem 2rem 0.4rem 1rem'; // Compact padding
    select.style.fontSize = '0.8rem';
    select.style.width = 'auto';
    select.style.cursor = 'pointer';
    select.style.borderColor = '#000000';
    select.style.height = 'auto';

    const users = getUsers();
    const currentUser = getCurrentUser();

    // Group users by role
    const admins = users.filter(u => u.role === 'admin');
    const employees = users.filter(u => u.role === 'employee');

    // Add option group for Admins
    const adminGroup = document.createElement('optgroup');
    adminGroup.label = 'Admins';
    admins.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        if (currentUser && currentUser.id === user.id) {
            option.selected = true;
        }
        adminGroup.appendChild(option);
    });
    select.appendChild(adminGroup);

    // Add option group for Employees
    const empGroup = document.createElement('optgroup');
    empGroup.label = 'Employees';
    employees.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        if (currentUser && currentUser.id === user.id) {
            option.selected = true;
        }
        empGroup.appendChild(option);
    });
    select.appendChild(empGroup);

    select.addEventListener('change', (e) => {
        const userId = e.target.value;
        const selectedUser = users.find(u => u.id === userId);
        if (selectedUser) {
            setCurrentUser(selectedUser);
            // Disable browser's automatic scroll restoration
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }
            // Scroll to top before navigation
            window.scrollTo(0, 0);
            // If on admin dashboard and switching to non-admin, redirect to home
            if (window.location.pathname.includes('admin-dashboard.html') && selectedUser.role !== 'admin') {
                window.location.href = 'index.html';
            } else {
                window.location.reload();
            }
        }
    });

    switcherContainer.appendChild(select);
    // Insert before the "Submit Request" button or at the beginning
    navActions.insertBefore(switcherContainer, navActions.firstChild);
}

// User dropdown functionality
function initializeUserDropdown() {
    const userIcon = document.getElementById('userIcon');
    if (!userIcon) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown-menu';
    
    // Build dropdown content safely to prevent XSS
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    
    const userName = document.createElement('span');
    userName.className = 'user-name-text';
    userName.textContent = currentUser.name;
    
    const userRole = document.createElement('span');
    userRole.className = 'user-role-text';
    userRole.textContent = currentUser.role;
    
    userInfo.appendChild(userName);
    userInfo.appendChild(userRole);
    dropdown.appendChild(userInfo);
    
    // Add navigation links
    const myRequestsLink = document.createElement('a');
    myRequestsLink.href = 'my-requests.html';
    myRequestsLink.textContent = 'My Requests';
    dropdown.appendChild(myRequestsLink);
    
    if (currentUser.role === 'admin') {
        const adminLink = document.createElement('a');
        adminLink.href = 'admin-dashboard.html';
        adminLink.textContent = 'Admin Dashboard';
        dropdown.appendChild(adminLink);
    }
    
    const submitLink = document.createElement('a');
    submitLink.href = 'lops-general-intake.html';
    submitLink.textContent = 'Submit Request';
    dropdown.appendChild(submitLink);
    
    const logoutLink = document.createElement('a');
    logoutLink.href = 'index.html';
    logoutLink.textContent = 'Logout';
    logoutLink.addEventListener('click', clearCurrentUser);
    dropdown.appendChild(logoutLink);
    
    // Wrap user icon in dropdown container
    const wrapper = document.createElement('div');
    wrapper.className = 'user-dropdown';
    userIcon.parentNode.insertBefore(wrapper, userIcon);
    wrapper.appendChild(userIcon);
    wrapper.appendChild(dropdown);
    
    // Toggle dropdown on click
    userIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

// Search icon functionality
function initializeSearchIcon() {
    const searchIcon = document.getElementById('searchIcon');
    if (!searchIcon) return;
    
    searchIcon.addEventListener('click', function() {
        // Check if we're on a page with a search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Redirect to my-requests page where search is available
            window.location.href = 'my-requests.html';
        }
    });
}

// Call UI initialization when DOM is ready
onReady(initializeUI);
