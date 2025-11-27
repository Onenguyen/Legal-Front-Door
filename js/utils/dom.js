// DOM Utility Functions

// HTML escape utility to prevent XSS attacks
export function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// DOM ready helper
export function onReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

// Query selector helpers
export function $(selector, context = document) {
    return context.querySelector(selector);
}

export function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// Create element with attributes and children
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            const event = key.substring(2).toLowerCase();
            element.addEventListener(event, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Append children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

// Set inner HTML safely (use with trusted content only)
export function setHTML(element, html) {
    if (element) {
        element.innerHTML = html;
    }
}

// Set text content safely
export function setText(element, text) {
    if (element) {
        element.textContent = text;
    }
}

// Show/hide elements
export function show(element) {
    if (element) {
        element.style.display = '';
    }
}

export function hide(element) {
    if (element) {
        element.style.display = 'none';
    }
}

export function toggle(element) {
    if (element) {
        element.style.display = element.style.display === 'none' ? '' : 'none';
    }
}

// Add/remove classes
export function addClass(element, ...classNames) {
    if (element) {
        element.classList.add(...classNames);
    }
}

export function removeClass(element, ...classNames) {
    if (element) {
        element.classList.remove(...classNames);
    }
}

export function toggleClass(element, className) {
    if (element) {
        element.classList.toggle(className);
    }
}

export function hasClass(element, className) {
    return element ? element.classList.contains(className) : false;
}

// Get/set attributes
export function getAttr(element, name) {
    return element ? element.getAttribute(name) : null;
}

export function setAttr(element, name, value) {
    if (element) {
        element.setAttribute(name, value);
    }
}

export function removeAttr(element, name) {
    if (element) {
        element.removeAttribute(name);
    }
}

// Event helpers
export function on(element, event, handler, options) {
    if (element) {
        element.addEventListener(event, handler, options);
    }
}

export function off(element, event, handler, options) {
    if (element) {
        element.removeEventListener(event, handler, options);
    }
}

export function once(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler, { once: true });
    }
}

// Delegate event handling
export function delegate(parent, selector, event, handler) {
    if (parent) {
        parent.addEventListener(event, (e) => {
            const target = e.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, e);
            }
        });
    }
}

// Scroll helpers
export function scrollToTop(smooth = true) {
    window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

export function scrollIntoView(element, options = { behavior: 'smooth', block: 'center' }) {
    if (element) {
        element.scrollIntoView(options);
    }
}

// Get URL parameters
export function getUrlParams() {
    return new URLSearchParams(window.location.search);
}

export function getUrlParam(name) {
    const params = getUrlParams();
    return params.get(name);
}

// Truncate text
export function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

