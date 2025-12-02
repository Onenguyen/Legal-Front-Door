// Home Page Logic
import { getCurrentUser, setCurrentUser, getUserFavorites } from '../core/state.js';
import { getUsers } from '../core/state.js';
import { DEPARTMENT_OPTIONS, INTAKE_FORMS, ICON_TYPES, DEPARTMENT_TAXONOMY } from '../core/constants.js?v=2';
import { renderDepartmentCard } from '../components/request-card.js';
import { renderChatbot, initChatbot } from '../components/chatbot.js?v=3';
import { getIcon } from '../components/icons.js';
import { escapeHtml, onReady } from '../utils/dom.js';

// Department Modal State
let currentDepartment = null;
let currentCategoryIndex = 0;

// Launch favorite
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

// Render favorites
function renderFavorites() {
    let currentUser = getCurrentUser();
    if (!currentUser) {
        // Default to Dwight (employee) if not set
        const users = getUsers();
        if (users.length > 0) {
            currentUser = users.find(u => u.name === 'Dwight') || users[0];
            setCurrentUser(currentUser);
        }
    }

    if (currentUser) {
        const favorites = getUserFavorites(currentUser.id);
        const favoritesGrid = document.getElementById('favoritesGrid');
        const favoritesSection = document.getElementById('favoritesSection');

        if (favorites.length > 0 && favoritesGrid && favoritesSection) {
            favoritesSection.style.display = 'block';
            favoritesGrid.innerHTML = favorites.map(fav => {
                const prefill = fav.prefill || {};
                return `
                <div class="favorite-card" data-fav-id="${escapeHtml(fav.id)}" role="button" tabindex="0" aria-label="Launch ${escapeHtml(fav.name)} favorite">
                    <div class="favorite-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="favorite-info">
                        <h3>${escapeHtml(fav.name)}</h3>
                        <p>${escapeHtml(prefill.department || 'General')} • ${escapeHtml(prefill.type || 'Request')}</p>
                    </div>
                    <div class="favorite-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 5L19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
            `;
            }).join('');
            
            // Attach click handlers using data attributes (safer than inline JSON)
            favoritesGrid.querySelectorAll('.favorite-card').forEach(card => {
                card.addEventListener('click', () => {
                    const favId = card.dataset.favId;
                    const fav = favorites.find(f => f.id === favId);
                    if (fav) launchFavorite(fav);
                });
                card.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        card.click();
                    }
                });
            });
        }
    }
}

// Navigate to submit request page with pre-filled department
window.navigateToRequest = function(departmentName) {
    if (departmentName) {
        sessionStorage.setItem('prefilledDepartment', departmentName);
    }
    window.location.href = 'lops-general-intake.html';
};

// Navigate to department (global for onclick handlers)
// Now checks for taxonomy and opens modal if available
window.navigateToDepartment = function(departmentName) {
    // Check if this department has a taxonomy defined
    if (departmentName && DEPARTMENT_TAXONOMY[departmentName]) {
        openDepartmentModal(departmentName);
    } else {
        // Fall back to original behavior
        if (departmentName) {
            sessionStorage.setItem('prefilledDepartment', departmentName);
        }
        window.location.href = 'lops-general-intake.html';
    }
};

// Open the department modal with two-panel layout
function openDepartmentModal(departmentName) {
    const modal = document.getElementById('departmentModal');
    const taxonomy = DEPARTMENT_TAXONOMY[departmentName];
    
    if (!modal || !taxonomy) return;
    
    currentDepartment = departmentName;
    currentCategoryIndex = 0;
    
    // Render the modal content
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = renderDepartmentModalContent(departmentName, taxonomy);
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Set up event listeners
    setupModalEventListeners(modal, taxonomy);
    
    // Focus trap for accessibility
    const closeBtn = modal.querySelector('.department-modal-close');
    if (closeBtn) closeBtn.focus();
}

// Close the department modal
window.closeDepartmentModal = function() {
    const modal = document.getElementById('departmentModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        currentDepartment = null;
        currentCategoryIndex = 0;
    }
};

// Select a category in the modal
window.selectCategory = function(index) {
    if (!currentDepartment) return;
    
    const taxonomy = DEPARTMENT_TAXONOMY[currentDepartment];
    if (!taxonomy || index >= taxonomy.categories.length) return;
    
    currentCategoryIndex = index;
    
    // Update active state on category items
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    // Update items panel
    const itemsPanel = document.querySelector('.items-panel');
    if (itemsPanel) {
        const category = taxonomy.categories[index];
        itemsPanel.innerHTML = renderItemsPanel(category);
    }
};

// Launch an external URL from the modal
window.launchItem = function(url) {
    if (url && url.trim()) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};

// Render the full modal content
function renderDepartmentModalContent(departmentName, taxonomy) {
    const firstCategory = taxonomy.categories[0];
    
    return `
        <div class="department-modal-header">
            <h2 id="departmentModalTitle">${escapeHtml(departmentName)}</h2>
            <button class="department-modal-close" onclick="closeDepartmentModal()" aria-label="Close modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <div class="department-modal-body">
            <div class="category-list">
                ${taxonomy.categories.map((cat, index) => renderCategoryItem(cat, index)).join('')}
            </div>
            <div class="items-panel">
                ${renderItemsPanel(firstCategory)}
            </div>
        </div>
    `;
}

// Render a single category item in the left panel
function renderCategoryItem(category, index) {
    const isActive = index === 0;
    const itemCount = category.items.length;
    
    return `
        <div class="category-item ${isActive ? 'active' : ''}" 
             onclick="selectCategory(${index})"
             role="button"
             tabindex="0"
             onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCategory(${index}); }">
            <span class="category-item-icon">
                ${getCategoryIcon(category.name)}
            </span>
            <span class="category-item-text">${escapeHtml(category.name)}</span>
            <span class="category-item-count">${itemCount}</span>
        </div>
    `;
}

// Render the items panel (right side)
function renderItemsPanel(category) {
    if (!category || !category.items || category.items.length === 0) {
        return `
            <div class="items-empty">
                <div class="items-empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 12h8"/>
                    </svg>
                </div>
                <p>No items available in this category.</p>
            </div>
        `;
    }
    
    return `
        <div class="items-panel-header">
            <h3>${escapeHtml(category.name)}</h3>
            <p>${category.items.length} ${category.items.length === 1 ? 'resource' : 'resources'} available</p>
        </div>
        <div class="items-list">
            ${category.items.map(item => renderLaunchItem(item)).join('')}
        </div>
    `;
}

// Render a single launch item
function renderLaunchItem(item) {
    const hasUrl = item.url && item.url.trim();
    const disabledClass = hasUrl ? '' : 'launch-item-disabled';
    
    return `
        <div class="launch-item ${disabledClass}" 
             ${hasUrl ? `onclick="launchItem('${escapeHtml(item.url)}')"` : ''}
             role="button"
             tabindex="${hasUrl ? '0' : '-1'}"
             ${hasUrl ? `onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); launchItem('${escapeHtml(item.url)}'); }"` : ''}>
            <div class="launch-item-content">
                <div class="launch-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                </div>
                <span class="launch-item-label">${escapeHtml(item.label)}</span>
            </div>
            <div class="launch-item-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </div>
        </div>
    `;
}

// Get an icon for a category based on its name
function getCategoryIcon(categoryName) {
    const name = categoryName.toLowerCase();
    
    if (name.includes('patent') || name.includes('trademark') || name.includes('copyright')) {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    }
    if (name.includes('product') || name.includes('open source')) {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
    }
    if (name.includes('content') || name.includes('information') || name.includes('review')) {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    }
    if (name.includes('nda')) {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    }
    if (name.includes('ai') || name.includes('privacy')) {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    }
    if (name.includes('compliance') || name.includes('ethics')) {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    }
    if (name.includes('buy') || name.includes('purchase')) {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
    }
    if (name.includes('employee') || name.includes('assistance')) {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    }
    
    // Default icon
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;
}

// Setup event listeners for the modal
function setupModalEventListeners(modal, taxonomy) {
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeDepartmentModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDepartmentModal();
        }
    });
}

// Render department cards
function renderDepartmentCards() {
    const cardsGrid = document.querySelector('.department-cards-grid');
    if (cardsGrid) {
        cardsGrid.innerHTML = DEPARTMENT_OPTIONS.map(dept => renderDepartmentCard(dept)).join('');
    }
}

// m3 FIX: Store observer references for cleanup
let statsObserver = null;
let revealObserver = null;

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('heroSearchInput');
    const searchResults = document.getElementById('searchResults');
    let selectedIndex = -1;
    
    if (!searchInput || !searchResults) return;

    function performSearch(query) {
        if (!query || query.length < 2) {
            searchResults.classList.remove('show');
            selectedIndex = -1;
            return;
        }

        const normalizedQuery = query.toLowerCase();
        
        // Filter Forms
        const matchedForms = INTAKE_FORMS.filter(form => 
            form.label.toLowerCase().includes(normalizedQuery) || 
            form.description.toLowerCase().includes(normalizedQuery) ||
            (form.keywords && form.keywords.some(k => k.toLowerCase().includes(normalizedQuery)))
        );

        if (matchedForms.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No matches found</div>';
            searchResults.classList.add('show');
            selectedIndex = -1;
            return;
        }

        let html = '';

        if (matchedForms.length > 0) {
            html += '<div class="search-result-category">Forms</div>';
            html += matchedForms.map(form => `
                <div class="search-result-item" role="button" onclick="navigateToForm('${escapeHtml(form.url)}')">
                    <div class="search-result-icon">
                        ${getIcon(ICON_TYPES.CONTRACT, 20)}
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${escapeHtml(form.label)}</div>
                        <div class="search-result-subtitle">${escapeHtml(form.description)}</div>
                    </div>
                </div>
            `).join('');
        }

        searchResults.innerHTML = html;
        searchResults.classList.add('show');
        selectedIndex = -1;
    }

    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length >= 2) {
            searchResults.classList.add('show');
        }
    });

    // Keyboard Navigation
    searchInput.addEventListener('keydown', (e) => {
        const items = searchResults.querySelectorAll('.search-result-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateSelection(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && items[selectedIndex]) {
                items[selectedIndex].click();
            }
        } else if (e.key === 'Escape') {
            searchResults.classList.remove('show');
            searchInput.blur();
        }
    });

    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('highlighted');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('highlighted');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('show');
        }
    });
    
    // Global handler for request type navigation from search
    window.navigateToRequestType = function(type) {
        sessionStorage.setItem('prefilledRequestType', type);
        window.location.href = 'lops-general-intake.html';
    };

    // Global handler for form navigation from search
    window.navigateToForm = function(url) {
        window.location.href = url;
    };
}

// Initialize animations (counter, reveal)
function initAnimations() {
    // Animated counter for stats
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16); // 60fps
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = Math.floor(target) + (target === 98 ? '%' : '');
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start) + (target === 98 ? '%' : '');
            }
        }, 16);
    }

    // Intersection Observer for counter animation
    statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = document.querySelectorAll('.stat-number');
                statNumbers.forEach((stat, index) => {
                    const target = parseInt(stat.dataset.target);
                    setTimeout(() => {
                        animateCounter(stat, target);
                    }, index * 100);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    // Observe the quick stats section
    const quickStats = document.querySelector('.quick-stats');
    if (quickStats) {
        statsObserver.observe(quickStats);
    }

    // Add smooth scroll reveal for sections
    const revealElements = document.querySelectorAll('.section-header, .department-card, .favorite-card');
    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
}

// m3 FIX: Cleanup observers on page hide/unload
function cleanupObservers() {
    if (statsObserver) {
        statsObserver.disconnect();
        statsObserver = null;
    }
    if (revealObserver) {
        revealObserver.disconnect();
        revealObserver = null;
    }
}

// Initialize page
onReady(() => {
    renderFavorites();
    renderDepartmentCards();
    
    // Add chatbot to page
    const chatbotContainer = document.createElement('div');
    chatbotContainer.innerHTML = renderChatbot();
    document.body.appendChild(chatbotContainer.firstElementChild);
    document.body.appendChild(chatbotContainer.lastElementChild);
    
    // Initialize chatbot
    initChatbot();
    
    // Initialize search
    setupSearch();
    
    // Initialize animations
    initAnimations();
    
    // m3 FIX: Cleanup observers on page hide (for bfcache support)
    window.addEventListener('pagehide', cleanupObservers);
});

