// Home Page Logic
import { getCurrentUser, setCurrentUser, getUserFavorites } from '../core/state.js';
import { getUsers } from '../core/state.js';
import { DEPARTMENT_OPTIONS } from '../core/constants.js';
import { renderDepartmentCard } from '../components/request-card.js';
import { renderChatbot, initChatbot } from '../components/chatbot.js';
import { escapeHtml, onReady } from '../utils/dom.js';

// Launch favorite
function launchFavorite(favorite) {
    if (favorite.prefill) {
        if (favorite.prefill.department) {
            sessionStorage.setItem('prefilledDepartment', favorite.prefill.department);
        }
        if (favorite.prefill.type) {
            sessionStorage.setItem('prefilledRequestType', favorite.prefill.type);
        }
        if (favorite.prefill.title) {
            sessionStorage.setItem('prefilledTitle', favorite.prefill.title);
        }
    }
    window.location.href = 'submit-request.html';
}

// Render favorites
function renderFavorites() {
    let currentUser = getCurrentUser();
    if (!currentUser) {
        // Default to first user if not set
        const users = getUsers();
        if (users.length > 0) {
            currentUser = users[0];
            setCurrentUser(currentUser);
        }
    }

    if (currentUser) {
        const favorites = getUserFavorites(currentUser.id);
        const favoritesGrid = document.getElementById('favoritesGrid');
        const favoritesSection = document.getElementById('favoritesSection');

        if (favorites.length > 0 && favoritesGrid && favoritesSection) {
            favoritesSection.style.display = 'block';
            favoritesGrid.innerHTML = favorites.map(fav => `
                <div class="favorite-card" data-fav-id="${escapeHtml(fav.id)}">
                    <div class="favorite-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="favorite-info">
                        <h3>${escapeHtml(fav.name)}</h3>
                        <p>${escapeHtml(fav.prefill.department || 'General')} • ${escapeHtml(fav.prefill.type || 'Request')}</p>
                    </div>
                    <div class="favorite-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 5L19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
            `).join('');
            
            // Attach click handlers using data attributes (safer than inline JSON)
            favoritesGrid.querySelectorAll('.favorite-card').forEach(card => {
                card.addEventListener('click', () => {
                    const favId = card.dataset.favId;
                    const fav = favorites.find(f => f.id === favId);
                    if (fav) launchFavorite(fav);
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
    window.location.href = 'submit-request.html';
};

// Navigate to department (global for onclick handlers)
window.navigateToDepartment = function(departmentName) {
    if (departmentName) {
        sessionStorage.setItem('prefilledDepartment', departmentName);
    }
    window.location.href = 'submit-request.html';
};

// Render department cards
function renderDepartmentCards() {
    const cardsGrid = document.querySelector('.department-cards-grid');
    if (cardsGrid) {
        cardsGrid.innerHTML = DEPARTMENT_OPTIONS.map(dept => renderDepartmentCard(dept)).join('');
    }
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
    const statsObserver = new IntersectionObserver((entries) => {
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
    const revealObserver = new IntersectionObserver((entries) => {
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
    
    // Initialize animations
    initAnimations();
});

