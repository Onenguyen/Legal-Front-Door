// Learning Center Page - LOPS Form Tour

class TourManager {
    constructor() {
        this.slides = document.querySelectorAll('.tour-slide');
        this.dots = document.querySelectorAll('.slide-dots .dot');
        this.container = document.querySelector('.tour-container');
        this.currentSlide = 1;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupDotNavigation();
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
                    // Update current slide and dots
                    const slideIndex = Array.from(this.slides).indexOf(entry.target) + 1;
                    this.setActiveSlide(slideIndex);
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

    setupDotNavigation() {
        this.dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const slideNum = parseInt(dot.dataset.slide);
                this.navigateToSlide(slideNum);
            });
        });
    }

    navigateToSlide(slideNum) {
        if (this.container) {
            // Each slide is 100vh tall, so calculate position based on slide number
            const viewportHeight = window.innerHeight;
            const scrollPosition = (slideNum - 1) * viewportHeight;
            
            // Smooth scroll to the target position
            this.container.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
    }

    setActiveSlide(slideNum) {
        this.currentSlide = slideNum;
        
        // Update dots active state
        this.dots.forEach(dot => {
            const dotSlide = parseInt(dot.dataset.slide);
            if (dotSlide === slideNum) {
                dot.classList.add('active');
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.classList.remove('active');
                dot.removeAttribute('aria-current');
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TourManager();
});
