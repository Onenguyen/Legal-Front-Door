// Home Page Logic
import { getCurrentUser, setCurrentUser, getUserFavorites } from '../core/state.js';
import { getUsers } from '../core/state.js';
import { DEPARTMENT_OPTIONS, INTAKE_FORMS, ICON_TYPES } from '../core/constants.js';
import { renderDepartmentCard } from '../components/request-card.js';
import { renderChatbot, initChatbot } from '../components/chatbot.js?v=3';
import { getIcon } from '../components/icons.js';
import { escapeHtml, onReady } from '../utils/dom.js';

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
window.navigateToDepartment = function(departmentName) {
    if (departmentName) {
        sessionStorage.setItem('prefilledDepartment', departmentName);
    }
    window.location.href = 'lops-general-intake.html';
};

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

