document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chatWindow');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const botTypingAnimation = document.getElementById('botTypingAnimation');

    const sessionId = "3d0f2cfa-d078-41b3-b328-2758d1cb3897"; // Fixed session ID as per requirements
    const webhookUrl = "http://localhost:5678/webhook/ea5130bf-1a90-49e5-8122-4aacdb781480/chat";

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Restore email and password from localStorage if available
    if (localStorage.getItem('mashalEmail')) {
        emailInput.value = localStorage.getItem('mashalEmail');
    }
    
    if (localStorage.getItem('mashalPassword')) {
        passwordInput.value = localStorage.getItem('mashalPassword');
    }
    
    // Save email and password to localStorage when changed
    emailInput.addEventListener('input', () => {
        localStorage.setItem('mashalEmail', emailInput.value);
        emailInput.classList.remove('invalid-input');
    });
    
    passwordInput.addEventListener('input', () => {
        localStorage.setItem('mashalPassword', passwordInput.value);
        passwordInput.classList.remove('invalid-input');
    });

    // Function to show bot typing animation
    function showBotTyping() {
        if (botTypingAnimation) {
            // Calculate and set the position based on chat window
            updateTypingPosition();
            
            botTypingAnimation.style.display = 'flex';
            // Add small delay before adding visible class for transition effect
            setTimeout(() => {
                botTypingAnimation.classList.add('visible');
            }, 10);
        }
    }

    // Function to hide bot typing animation
    function hideBotTyping() {
        if (botTypingAnimation) {
            // First remove the visible class to trigger the fade-out
            botTypingAnimation.classList.remove('visible');
            // Then wait for the transition to complete before hiding completely
            setTimeout(() => {
                botTypingAnimation.style.display = 'none';
            }, 300); // Match the transition duration
        }
    }

    // Function to update the typing animation position
    function updateTypingPosition() {
        if (botTypingAnimation && chatWindow) {
            const chatRect = chatWindow.getBoundingClientRect();
            // Position it at the bottom center of chat window
            botTypingAnimation.style.bottom = (window.innerHeight - chatRect.bottom + 15) + 'px';
            botTypingAnimation.style.left = (chatRect.left + chatRect.width / 2) + 'px';
        }
    }

    // Add event listener for chat window scroll to update position
    chatWindow.addEventListener('scroll', updateTypingPosition);

    // Add event listener for window resize to update position
    window.addEventListener('resize', updateTypingPosition);

    function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText === '') {
            return;
        }

        // Get auth credentials
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validate auth credentials
        if (!email || !password) {
            // Show validation errors
            if (!email) {
                emailInput.classList.add('invalid-input');
            }
            if (!password) {
                passwordInput.classList.add('invalid-input');
            }
            // Don't proceed with sending the message
            return;
        }
        
        // Clear any previous validation errors
        emailInput.classList.remove('invalid-input');
        passwordInput.classList.remove('invalid-input');

        appendMessage(messageText, 'user-message');
        chatInput.value = ''; // Clear input field
        
        // Create headers with Basic Auth
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const base64Credentials = btoa(`${email}:${password}`);
        headers['Authorization'] = `Basic ${base64Credentials}`;

        showBotTyping(); // Show typing animation

        fetch(webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                action: "sendMessage",
                sessionId: sessionId,
                chatInput: messageText
            })
        })
        .then(response => response.json())
        .then(data => {
            hideBotTyping(); // Hide typing animation
            if (data && data.output) {
                // No need to replace newlines with <br> anymore as Markdown handles this
                const botResponse = data.output;
                appendMessage(botResponse, 'bot-message');
            } else {
                appendMessage('Error: Could not get a response.', 'bot-message');
            }
        })
        .catch(error => {
            hideBotTyping();
            console.error('Error sending message:', error);
            appendMessage('Error: Could not connect to the chatbot.', 'bot-message');
        });
    }

    function appendMessage(text, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', type);
        
        if (type === 'bot-message') {
            // Parse Markdown content for bot messages using marked.js
            try {
                // Set options for marked - enabling GFM (GitHub Flavored Markdown)
                marked.setOptions({
                    gfm: true,
                    breaks: true,
                    sanitize: false, // Allow HTML in the markdown
                    smartLists: true,
                    smartypants: true,
                    highlight: function(code, lang) {
                        // You can integrate a syntax highlighter here if needed
                        return code;
                    }
                });
                
                // Convert markdown to HTML
                messageElement.innerHTML = marked.parse(text);
                
                // Add target="_blank" to all links to open in new tab
                const links = messageElement.querySelectorAll('a');
                links.forEach(link => {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                });
            } catch (error) {
                console.error('Error parsing Markdown:', error);
                messageElement.innerHTML = text; // Fallback to plain text if parsing fails
            }
        } else {
            // For user messages, keep as plain text
            messageElement.textContent = text;
        }

        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the bottom
    }
});
