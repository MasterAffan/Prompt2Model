class ChatApp {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        
        this.conversationId = 'default';
        this.isLoading = false;
        
        this.initializeEventListeners();
        this.adjustTextareaHeight();
    }
    
    initializeEventListeners() {
        // Send message on button click
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter (without Shift)
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!this.isLoading) {
                    this.sendMessage();
                }
            }
        });
        
        // Auto-resize textarea
        this.userInput.addEventListener('input', () => this.adjustTextareaHeight());
        
        // New chat button
        this.newChatBtn.addEventListener('click', () => this.startNewConversation());
    }
    
    adjustTextareaHeight() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 200) + 'px';
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message || this.isLoading) return;
        
        // Add user message to UI
        this.addMessageToUI('user', message);
        this.userInput.value = '';
        this.adjustTextareaHeight();
        
        // Show loading indicator
        this.isLoading = true;
        this.toggleInputDisabled(true);
        const loadingElement = this.addLoadingIndicator();
        
        try {
            // Call backend API
            const response = await this.callBackendAPI(message);
            
            // Remove loading indicator
            if (loadingElement && loadingElement.parentNode) {
                loadingElement.parentNode.removeChild(loadingElement);
            }
            
            // Add assistant response to UI
            if (response.success) {
                this.addMessageToUI('assistant', response.message);
                
                // Show execution results if any
                if (response.executionResults && response.executionResults.length > 0) {
                    response.executionResults.forEach((result, index) => {
                        if (result.error) {
                            this.addMessageToUI('assistant', `⚠️ Code execution error: ${result.error}`);
                        } else {
                            this.addMessageToUI('assistant', `✅ Code executed successfully: ${result.output || 'Completed'}`);
                        }
                    });
                }
            } else {
                this.addMessageToUI('assistant', `❌ Error: ${response.error || 'Unknown error occurred'}`);
            }
        } catch (error) {
            // Remove loading indicator
            if (loadingElement && loadingElement.parentNode) {
                loadingElement.parentNode.removeChild(loadingElement);
            }
            
            this.addMessageToUI('assistant', `❌ Error: ${error.message || 'Failed to get response from server'}`);
        } finally {
            this.isLoading = false;
            this.toggleInputDisabled(false);
            this.scrollToBottom();
        }
    }
    
    async callBackendAPI(message) {
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationId: this.conversationId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    addMessageToUI(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        // Format content to handle code blocks and multiple paragraphs
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Check if content contains code blocks
        if (content.includes('```')) {
            const parts = this.splitContentWithCodeBlocks(content);
            parts.forEach(part => {
                // Only add text parts to the UI, skip code parts
                if (part.type !== 'code') {
                    // Split text by newlines to preserve paragraph structure
                    const paragraphs = part.content.split('\n');
                    paragraphs.forEach(paragraph => {
                        if (paragraph.trim()) {
                            const p = document.createElement('p');
                            p.textContent = paragraph;
                            contentDiv.appendChild(p);
                        }
                    });
                }
            });
        } else {
            // Split text by newlines to preserve paragraph structure
            const paragraphs = content.split('\n');
            paragraphs.forEach(paragraph => {
                if (paragraph.trim()) {
                    const p = document.createElement('p');
                    p.textContent = paragraph;
                    contentDiv.appendChild(p);
                }
            });
        }
        
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    splitContentWithCodeBlocks(content) {
        const parts = [];
        const regex = /(```[\s\S]*?```)/g;
        let lastIndex = 0;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            // Add text before code block
            if (match.index > lastIndex) {
                const text = content.substring(lastIndex, match.index);
                if (text.trim()) {
                    parts.push({ type: 'text', content: text });
                }
            }
            
            // Skip code blocks - don't add them to the UI (hide Python code)
            lastIndex = regex.lastIndex;
        }
        
        // Add remaining text after last code block
        if (lastIndex < content.length) {
            const text = content.substring(lastIndex);
            if (text.trim()) {
                parts.push({ type: 'text', content: text });
            }
        }
        
        return parts;
    }
    
    addLoadingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        messageDiv.id = 'loading-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-dots';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'loading-dot';
            loadingDiv.appendChild(dot);
        }
        
        contentDiv.appendChild(loadingDiv);
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    toggleInputDisabled(disabled) {
        this.userInput.disabled = disabled;
        this.sendBtn.disabled = disabled;
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    startNewConversation() {
        // Clear current conversation UI
        this.chatMessages.innerHTML = '';
        
        // Add welcome message
        this.addMessageToUI('assistant', 
            'Hello! I\'m your Blender AI Assistant. I can help you create 3D objects and scenes in Blender through natural language commands.\n\nTry asking me to create a cube, sphere, or any 3D object you\'d like!'
        );
        
        // Generate new conversation ID
        this.conversationId = Date.now().toString();
        
        // Clear input
        this.userInput.value = '';
        this.adjustTextareaHeight();
    }
}

// Initialize the chat app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});
