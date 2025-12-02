// Learning Center Page - LOPS Form Tour

class TourManager {
    constructor() {
        this.slides = document.querySelectorAll('.tour-slide');
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const options = {
            root: null, // viewport
            rootMargin: '-20% 0px -20% 0px', // trigger when 60% of element is visible
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Optional: Stop observing once activated if we don't want re-animation
                    // observer.unobserve(entry.target);
                } else {
                    // Remove active class to reset animations when scrolling back
                    entry.target.classList.remove('active');
                }
            });
        }, options);

        this.slides.forEach(slide => {
            observer.observe(slide);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TourManager();
});
