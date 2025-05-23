document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chatWindow');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');

    const sessionId = "3d0f2cfa-d078-41b3-b328-2758d1cb3897"; // Fixed session ID as per requirements
    const webhookUrl = "http://35.179.39.3:5678/webhook/ea5130bf-1a90-49e5-8122-4aacdb781480/chat";

    // Initialize Materialize components
    M.AutoInit();

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

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
            if (data && data.output) {
                // Replace newline characters with <br> for HTML display
                const botResponse = data.output.replace(/\n/g, '<br>');
                appendMessage(botResponse, 'bot-message');
            } else {
                appendMessage('Error: Could not get a response.', 'bot-message');
            }
        })
        .catch(error => {
            console.error('Error sending message:', error);
            appendMessage('Error: Could not connect to the chatbot.', 'bot-message');
        });
    }

    // Add input event listeners to remove error class when user starts typing
    emailInput.addEventListener('input', () => {
        emailInput.classList.remove('invalid-input');
    });
    
    passwordInput.addEventListener('input', () => {
        passwordInput.classList.remove('invalid-input');
    });

    function appendMessage(text, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', type);
        messageElement.innerHTML = text; // Use innerHTML to render <br> tags

        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the bottom
    }
});
