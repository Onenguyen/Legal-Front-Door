// Chatbot Component
import { escapeHtml } from '../utils/dom.js';

const INITIAL_BOT_MESSAGE = "Hi! I'm your Legal Assistant. I can help you find the right legal service or answer questions about submitting requests. What can I help you with today?";

// Simple HTML sanitizer that only allows safe formatting tags
// This provides defense-in-depth even though bot responses are controlled
function sanitizeHtml(html) {
    if (!html) return '';
    // Only allow specific safe tags for formatting
    const allowedTags = ['strong', 'b', 'em', 'i', 'br', 'p', 'ul', 'li'];
    const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    
    return html.replace(tagPattern, (match, tagName) => {
        const lowerTag = tagName.toLowerCase();
        if (allowedTags.includes(lowerTag)) {
            // Only allow the tag itself, strip any attributes
            const isClosing = match.startsWith('</');
            return isClosing ? `</${lowerTag}>` : `<${lowerTag}>`;
        }
        // Escape disallowed tags
        return escapeHtml(match);
    });
}

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
                        ${INITIAL_BOT_MESSAGE}
                    </div>
                </div>
            </div>
            <div class="chatbot-quick-actions" id="chatbotQuickActions"></div>
            <div class="chatbot-secondary-actions">
                <button id="chatQuickBackBtn" class="chatbot-link-btn" type="button" hidden>Back to main suggestions</button>
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
    
    // Bot messages can contain safe HTML for formatting, user messages are always escaped
    if (isBot && isHtml) {
        // Sanitize HTML to only allow safe formatting tags
        contentDiv.innerHTML = sanitizeHtml(text);
    } else {
        // User messages are always plain text (escaped)
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
    } else if (lowerMessage.includes('help with a request') || (lowerMessage.includes('help') && lowerMessage.includes('request'))) {
        response = 'Happy to help! Tell me which department you sit in or the type of work you need done and I will point you to the right intake card or connect you with the Legal Ops team.';
    } else if (lowerMessage.includes('patent') || lowerMessage.includes('trademark') || lowerMessage.includes('copyright') || lowerMessage.includes('ip')) {
        response = 'Intellectual property matters should be submitted via the <strong>Engineering / OCTO</strong> or <strong>Product Management</strong> cards. This includes patents, trademarks, and copyright protection. Can I help you start a request?';
    } else if (lowerMessage.includes('privacy') || lowerMessage.includes('data')) {
        response = 'For data privacy concerns, use the <strong>FITOPS</strong> or <strong>Marketing</strong> category if applicable, or your specific department. This covers privacy policies, data handling, and breach response. Would you like to proceed?';
    } else if (lowerMessage.includes('business development') || lowerMessage.includes('partnership') || lowerMessage.includes('bizdev')) {
        response = 'Business Development partnerships, NDAs, and deal desk items run through the <strong>Business Development</strong> card. I can take you there so you can outline the opportunity details.';
    } else if (lowerMessage.includes('customer support') || lowerMessage.includes('cx') || lowerMessage.includes('cert')) {
        response = 'Customer Experience, Support, or CERT escalations are handled under the <strong>CX / Customer Support / CERT</strong> card. It captures response SLAs, service credits, and incident support. Want to jump to that request?';
    } else if (lowerMessage.includes('engineering') || lowerMessage.includes('octo')) {
        response = 'Engineering / OCTO requests cover patents, code reviews, and technical collaborations. Use the <strong>Engineering / OCTO</strong> card and provide the repository, feature, or patent context. Ready for the link?';
    } else if (lowerMessage.includes('fitops') || lowerMessage.includes('finance') || lowerMessage.includes('operations') || lowerMessage.includes('security')) {
        response = 'FITOPS handles finance, IT, security, and operations reviews. Open the <strong>FITOPS</strong> card to start items like vendor onboarding, SOC report needs, or tooling access. Should I direct you to it?';
    } else if (lowerMessage.includes('marketing') || lowerMessage.includes('campaign') || lowerMessage.includes('event')) {
        response = 'Marketing campaigns, events, and collateral reviews go through the <strong>Marketing</strong> card. It ensures claims, assets, and sponsorships are cleared. Want me to open that form?';
    } else if (lowerMessage.includes('people') || lowerMessage.includes('places') || lowerMessage.includes('hr')) {
        response = 'HR, workplace, mobility, and benefits questions belong in the <strong>People & Places</strong> card. It routes to the right HRBP or workplace partner. Need me to pull it up for you?';
    } else if (lowerMessage.includes('product') || lowerMessage.includes('roadmap')) {
        response = 'For roadmap alignment, beta programs, or licensing changes, submit through the <strong>Product Management</strong> card. It helps capture launch context and approvals. Would you like that form?';
    } else if (lowerMessage.includes('wwfo') || lowerMessage.includes('field') || lowerMessage.includes('deal desk')) {
        response = 'Field, alliances, and services items—including deal-desk escalations—belong with <strong>WWFO</strong>. That card walks you through customer details and revenue impact. Want to head there?';
    } else if (lowerMessage.includes('learning') || lowerMessage.includes('training') || lowerMessage.includes('enablement')) {
        response = 'Learning, enablement, and training resource updates are supported via <strong>People & Places</strong> / L&D. Submit through that card so the team can review the curriculum or content. Should I open it?';
    } else if (lowerMessage.includes('feedback') || lowerMessage.includes('suggestion') || lowerMessage.includes('idea')) {
        response = 'We love hearing how we can improve. Share your feedback here and we will route it to Legal Ops. For actionable changes, include the affected form or process and any deadlines.';
    } else if (lowerMessage.includes('question') || lowerMessage.includes('clarification') || lowerMessage.includes('unsure')) {
        response = 'Ask away! Give me a quick summary of your question and I will suggest the department, form, or policy that applies.';
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
    const quickActionsContainer = document.getElementById('chatbotQuickActions');
    const quickBackBtn = document.getElementById('chatQuickBackBtn');
    
    if (!chatbot || !chatFloatingBtn) return;

    const quickActionSets = {
        primary: [
            { label: 'Help with a Request', message: 'I need help with a request', nextSet: 'departments' },
            { label: 'Learning', message: 'I need learning resources' },
            { label: 'Feedback', message: "I'd like to leave feedback" },
            { label: 'Question', message: 'I have a question' }
        ],
        departments: [
            { label: 'Business Development', message: 'I need Business Development support' },
            { label: 'CX / Customer Support / CERT', message: 'I need help from CX / Customer Support / CERT' },
            { label: 'Engineering / OCTO', message: 'I need Engineering / OCTO support' },
            { label: 'FITOPS', message: 'I need FITOPS guidance' },
            { label: 'Marketing', message: 'I need Marketing legal review' },
            { label: 'People & Places', message: 'I need People & Places support' },
            { label: 'Product Management', message: 'I need Product Management legal help' },
            { label: 'WWFO', message: 'I need WWFO / field support' }
        ]
    };
    let currentQuickActionSet = 'primary';

    function renderQuickActions(setName = 'primary') {
        if (!quickActionsContainer || !quickActionSets[setName]) return;
        currentQuickActionSet = setName;
        quickActionsContainer.innerHTML = '';
        quickActionSets[setName].forEach(action => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quick-action-btn';
            button.textContent = action.label;
            if (action.message) {
                button.dataset.message = action.message;
            }
            if (action.nextSet) {
                button.dataset.nextSet = action.nextSet;
            }
            if (action.silent) {
                button.dataset.silent = 'true';
            }
            quickActionsContainer.appendChild(button);
        });

        if (quickBackBtn) {
            if (setName === 'departments') {
                quickBackBtn.hidden = false;
            } else {
                quickBackBtn.hidden = true;
            }
        }
    }

    if (quickActionsContainer) {
        quickActionsContainer.addEventListener('click', event => {
            const button = event.target.closest('.quick-action-btn');
            if (!button) return;
            
            const message = button.dataset.message;
            const nextSet = button.dataset.nextSet;
            const silent = button.dataset.silent === 'true';

            if (message && !silent) {
                sendQuickMessage(message);
            }

            if (nextSet && quickActionSets[nextSet]) {
                renderQuickActions(nextSet);
            } else if (!silent && currentQuickActionSet !== 'primary') {
                renderQuickActions('primary');
            }
        });

        renderQuickActions('primary');
    }

    if (quickBackBtn) {
        quickBackBtn.addEventListener('click', () => {
            renderQuickActions('primary');
        });
    }
    
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
    
}

