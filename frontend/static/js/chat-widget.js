// ============================================
// Floating Chat Widget - Tim AI Assistant
// RAG-based chatbot with Allianz branding
// ============================================

class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        
        // Knowledge Base (from app.py)
        this.knowledgeBase = `
* **TDP (Thermal Design Power):** The maximum power in watts a hardware component (like a GPU or CPU) is designed to use. We use this as a base for our energy calculation.
* **PUE (Power Usage Effectiveness):** A score that measures data center energy efficiency. A PUE of 1.57 means for every 1 watt of power the computer uses, 0.57 watts are used for cooling and lights.
* **Carbon Intensity (g/kWh):** A measure of how "clean" the electricity is. It's the grams of CO2 emitted to create one kilowatt-hour of electricity. A low number (like in France) is good. A high number (like in India) is bad.
* **SCI (Software Carbon Intensity):** The official industry standard. It's a rate of carbon emissions *per request* (e.g., 'grams of CO2 per user'). It's the best way to measure the footprint of a live application.
* **Nvidia Triton:** A software "manager" for NVIDIA GPUs. It makes them run AI models much faster and more efficiently, which saves time, money, and CO2.
* **Intel OpenVINO:** A software "manager" for Intel CPUs. It's like Triton but specialized for running AI *on CPUs*, making them incredibly fast and efficient.
* **AMD ZenDNN:** A software "manager" for AMD CPUs. It's the AMD equivalent of OpenVINO.
* **Latency (ms):** The "lag" a user experiences. It's the time in milliseconds for a request to go from the user to the data center and back. Low latency is good.
* **Cloud Providers:** AWS, GCP, and Azure are the three major cloud platforms where you can deploy applications.
* **Regions:** Geographic locations where cloud data centers are located. Different regions have different carbon intensities.
* **Workload:** A deployed application or service running in the cloud that consumes resources.
* **API Keys:** Credentials used to authenticate and connect to cloud provider services.
* **CO2 Emissions:** The amount of carbon dioxide produced by running cloud infrastructure, measured in kilograms.
* **Cost Optimization:** Strategies to reduce cloud spending while maintaining performance.
* **GreenMind:** Our platform that helps you optimize cloud workloads for sustainability and cost efficiency.
        `.trim();
        
        this.init();
    }

    init() {
        this.createWidget();
        this.attachEventListeners();
        this.loadChatHistory();
    }

    createWidget() {
        const widgetHTML = `
            <!-- Chat Widget -->
            <div class="chat-widget" id="chatWidget">
                <!-- Floating Button -->
                <button class="chat-button" id="chatButton" aria-label="Open chat with Tim">
                    <span class="chat-tooltip">Chat with Tim</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>

                <!-- Chat Window -->
                <div class="chat-window" id="chatWindow">
                    <!-- Header -->
                    <div class="chat-header">
                        <div class="chat-header-left">
                            <div class="chat-avatar">🤖</div>
                            <div class="chat-header-info">
                                <h3>Tim - AI Assistant</h3>
                                <p>Ask me about cloud sustainability</p>
                            </div>
                        </div>
                        <button class="chat-close" id="chatClose" aria-label="Close chat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <!-- Messages -->
                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-welcome">
                            <h4>👋 Hi! I'm Tim</h4>
                            <p>Your AI guide to cloud sustainability. Ask me anything about our recommender tool!</p>
                            <div class="chat-suggestions">
                                <button class="chat-suggestion-btn" data-question="What is TDP?">What is TDP?</button>
                                <button class="chat-suggestion-btn" data-question="Explain SCI score">Explain SCI score</button>
                                <button class="chat-suggestion-btn" data-question="How does carbon intensity work?">How does carbon intensity work?</button>
                            </div>
                        </div>
                    </div>

                    <!-- Input -->
                    <div class="chat-input-container">
                        <form class="chat-input-form" id="chatForm">
                            <textarea 
                                class="chat-input" 
                                id="chatInput" 
                                placeholder="Ask me about TDP, SCI, PUE..."
                                rows="1"
                            ></textarea>
                            <button class="chat-send-button" id="chatSend" type="submit" aria-label="Send message">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    attachEventListeners() {
        const chatButton = document.getElementById('chatButton');
        const chatClose = document.getElementById('chatClose');
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');

        // Toggle chat window
        chatButton.addEventListener('click', () => this.toggleChat());
        chatClose.addEventListener('click', () => this.closeChat());

        // Handle form submission
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });

        // Enter to send, Shift+Enter for new line
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Suggestion buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('chat-suggestion-btn')) {
                const question = e.target.dataset.question;
                chatInput.value = question;
                this.sendMessage();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        const chatWindow = document.getElementById('chatWindow');
        chatWindow.classList.add('open');
        this.isOpen = true;
        
        // Focus input
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 300);
    }

    closeChat() {
        const chatWindow = document.getElementById('chatWindow');
        chatWindow.classList.remove('open');
        this.isOpen = false;
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';
        input.style.height = 'auto';

        // Show typing indicator
        this.showTyping();

        // Simulate API delay and generate response
        setTimeout(() => {
            const response = this.generateResponse(message);
            this.hideTyping();
            this.addMessage('assistant', response);
        }, 1000 + Math.random() * 1000);
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageHTML = `
            <div class="chat-message ${role}">
                <div class="chat-message-avatar">${role === 'user' ? '👤' : '🤖'}</div>
                <div class="chat-message-content">
                    ${this.formatMessage(content)}
                    <div class="chat-message-time">${this.getCurrentTime()}</div>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();

        // Save to history
        this.messages.push({ role, content, timestamp: new Date().toISOString() });
        this.saveChatHistory();
    }

    formatMessage(text) {
        // Convert markdown-style formatting
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    showTyping() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingHTML = `
            <div class="typing-indicator" id="typingIndicator">
                <div class="chat-message-avatar">🤖</div>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        this.scrollToBottom();
        this.isTyping = true;
    }

    hideTyping() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    generateResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();

        // Extract relevant context from knowledge base
        const context = this.findRelevantContext(lowerMessage);

        // Generate contextual response
        if (context) {
            return context;
        }

        // Default responses for common questions
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! I'm Tim, your AI guide to cloud sustainability. I can help you understand technical terms like TDP, PUE, SCI, and more. What would you like to know?";
        }

        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            return "I can explain technical terms used in our GreenMind platform, including:\n\n• **TDP** - Thermal Design Power\n• **PUE** - Power Usage Effectiveness\n• **SCI** - Software Carbon Intensity\n• **Carbon Intensity**\n• **Latency** and performance metrics\n• **Cloud providers** (AWS, GCP, Azure)\n\nJust ask me about any of these topics!";
        }

        if (lowerMessage.includes('thank')) {
            return "You're welcome! Feel free to ask me anything else about cloud sustainability or our recommender tool. 🌿";
        }

        // If no match found
        return "I'm sorry, I only have information about the terms used in this tool, such as TDP, PUE, SCI, carbon intensity, and cloud optimization. Could you rephrase your question or ask about one of these topics?";
    }

    findRelevantContext(query) {
        // Split knowledge base into entries
        const entries = this.knowledgeBase.split('\n').filter(line => line.trim().startsWith('*'));

        // Search for relevant entries
        for (const entry of entries) {
            const term = entry.match(/\*\*(.*?)\*\*/);
            if (!term) continue;

            const termName = term[1].toLowerCase();
            
            // Check if query mentions this term
            if (query.includes(termName.toLowerCase()) || 
                query.includes(termName.split(' ')[0].toLowerCase())) {
                // Extract the explanation
                const explanation = entry.replace(/^\*\s+/, '').trim();
                return explanation;
            }
        }

        return null;
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    saveChatHistory() {
        try {
            localStorage.setItem('greenmind_chat_history', JSON.stringify(this.messages));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const history = localStorage.getItem('greenmind_chat_history');
            if (history) {
                this.messages = JSON.parse(history);
                // Optionally restore messages to UI
                // this.restoreMessages();
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }
}

// Initialize chat widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already initialized
    if (!window.chatWidget) {
        window.chatWidget = new ChatWidget();
    }
});
