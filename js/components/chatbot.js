// Chatbot Component
import { escapeHtml } from '../utils/dom.js';

// Render chatbot HTML
export function renderChatbot() {
    return `
        <!-- Chatbot Interface -->
        <div id="chatbot" class="chatbot-container">
            <div class="chatbot-header">
                <div class="chatbot-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Legal Assistant
                </div>
                <button class="chatbot-minimize">−</button>
            </div>
            <div class="chatbot-messages" id="chatMessages">
                <div class="chat-message bot-message">
                    <div class="message-content">
                        Hi! I'm your Legal Assistant. I can help you find the right legal service or answer questions about submitting requests. What can I help you with today?
                    </div>
                </div>
            </div>
            <div class="chatbot-quick-actions">
                <button class="quick-action-btn" data-message="I need to review a contract">Review a Contract</button>
                <button class="quick-action-btn" data-message="Employment agreement help">Employment Agreement</button>
                <button class="quick-action-btn" data-message="Compliance question">Compliance Question</button>
            </div>
            <div class="chatbot-input">
                <input type="text" id="chatInput" placeholder="Type your message...">
                <button id="chatSendBtn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.3333 1.66666L9.16666 10.8333M18.3333 1.66666L12.5 18.3333L9.16666 10.8333M18.3333 1.66666L1.66666 7.49999L9.16666 10.8333" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Floating Chat Button -->
        <button id="chatFloatingBtn" class="chat-floating-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;
}

// Add message to chat
function addMessage(text, isBot = false, isHtml = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isBot ? 'bot-message' : 'user-message'}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Bot messages can contain HTML for formatting, user messages are escaped
    if (isBot && isHtml) {
        contentDiv.innerHTML = text;
    } else {
        contentDiv.textContent = text;
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate bot response
function respondToMessage(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';

    if (lowerMessage.includes('contract') || lowerMessage.includes('nda') || lowerMessage.includes('agreement')) {
        response = 'For contract reviews and agreements, please submit a request by selecting your department on the main page. This covers NDAs, vendor contracts, customer agreements, and more. Would you like me to direct you to the request form?';
    } else if (lowerMessage.includes('employment') || lowerMessage.includes('hire') || lowerMessage.includes('offer')) {
        response = 'For employment-related matters, please submit a request via the <strong>People & Places</strong> department card. This includes employment agreements, offer letters, and HR policy questions. Shall I take you to the request form?';
    } else if (lowerMessage.includes('compliance') || lowerMessage.includes('gdpr') || lowerMessage.includes('ccpa')) {
        response = 'Compliance matters can be submitted by selecting your department. This covers GDPR, CCPA, and other regulatory requirements. Would you like to submit a compliance request?';
    } else if (lowerMessage.includes('patent') || lowerMessage.includes('trademark') || lowerMessage.includes('copyright') || lowerMessage.includes('ip')) {
        response = 'Intellectual property matters should be submitted via the <strong>Engineering / OCTO</strong> or <strong>Product Management</strong> cards. This includes patents, trademarks, and copyright protection. Can I help you start a request?';
    } else if (lowerMessage.includes('privacy') || lowerMessage.includes('data')) {
        response = 'For data privacy concerns, use the <strong>FITOPS</strong> or <strong>Marketing</strong> category if applicable, or your specific department. This covers privacy policies, data handling, and breach response. Would you like to proceed?';
    } else {
        response = 'I can help you find the right legal service. You can browse by department:<br><br>• <strong>Business Development</strong><br>• <strong>CX / Customer Support / CERT</strong><br>• <strong>Engineering / OCTO</strong><br>• <strong>FITOPS</strong><br>• <strong>Marketing</strong><br>• <strong>People & Places</strong><br>• <strong>Product Management</strong><br>• <strong>WWFO</strong><br><br>Which department are you from?';
    }

    addMessage(response, true, true);  // Bot responses contain safe HTML formatting
}

// Send quick message
function sendQuickMessage(message) {
    addMessage(message, false, false);
    setTimeout(() => {
        respondToMessage(message);
    }, 500);
}

// Initialize chatbot functionality
export function initChatbot() {
    const chatbot = document.getElementById('chatbot');
    const chatFloatingBtn = document.getElementById('chatFloatingBtn');
    const chatMinimizeBtn = document.querySelector('.chatbot-minimize');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    
    if (!chatbot || !chatFloatingBtn) return;
    
    // Show chatbot
    chatFloatingBtn.addEventListener('click', function() {
        chatbot.classList.add('active');
    });
    
    // Hide chatbot
    if (chatMinimizeBtn) {
        chatMinimizeBtn.addEventListener('click', function() {
            chatbot.classList.remove('active');
        });
    }
    
    // Send message on button click
    if (chatSendBtn && chatInput) {
        chatSendBtn.addEventListener('click', function() {
            const message = chatInput.value.trim();
            if (message) {
                addMessage(message, false, false);
                chatInput.value = '';
                setTimeout(() => {
                    respondToMessage(message);
                }, 500);
            }
        });
        
        // Send message on Enter key
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                chatSendBtn.click();
            }
        });
    }
    
    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const message = this.dataset.message || this.textContent;
            sendQuickMessage(message);
        });
    });
}

