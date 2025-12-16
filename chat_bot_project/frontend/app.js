import ChatAPI from './api.js';

const API_BASE = 'http://127.0.0.1:8000';
let currentSessionId = null;
let isTyping = false;

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authModal = document.getElementById('authModal');
const modalTitle = document.getElementById('modalTitle');
const authForm = document.getElementById('authForm');
const submitAuthBtn = document.getElementById('submitAuthBtn');
const errorMessage = document.getElementById('errorMessage');
const sessionsList = document.getElementById('sessionsList');
const typingIndicator = document.getElementById('typingIndicator');

class ChatUI {
    constructor() {
        this.chatAPI = new ChatAPI(API_BASE);
        this.initEventListeners();
        this.loadSessions();
        this.createNewSession();
    }

    initEventListeners() {
        // Отправка сообщения
        sendBtn.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !isTyping) this.sendMessage();
        });

        // Управление чатом
        clearChatBtn.addEventListener('click', () => this.clearChat());
        newSessionBtn.addEventListener('click', () => this.createNewSession());

        // Авторизация
        loginBtn.addEventListener('click', () => this.showAuthModal('login'));
        registerBtn.addEventListener('click', () => this.showAuthModal('register'));
        authModal.querySelector('.close').addEventListener('click', () => this.hideAuthModal());
        
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const isLogin = modalTitle.textContent.includes('Вход');
            this.handleAuth(isLogin);
        });

        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (e) => {
            if (e.target === authModal) this.hideAuthModal();
        });
    }

    async sendMessage() {
        const text = messageInput.value.trim();
        if (!text || isTyping) return;

        // Валидация
        if (text.length > 500) {
            this.showError('Сообщение не может быть длиннее 500 символов');
            return;
        }

        if (!currentSessionId) {
            await this.createNewSession();
        }

        this.addMessage(text, 'user');
        messageInput.value = '';
        
        // Блокировка ввода
        this.showTyping(true);
        isTyping = true;

        try {
            const response = await this.chatAPI.sendMessage(currentSessionId, text);
            setTimeout(() => {
                this.addMessage(response.response, 'bot');
                this.showTyping(false);
                isTyping = false;
                this.loadSessions();
            }, 1000);
        } catch (error) {
            this.showError('Ошибка отправки сообщения');
            this.showTyping(false);
            isTyping = false;
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-text">${this.escapeHtml(text)}</div>
            <div class="message-time">${time}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async createNewSession() {
        try {
            const session = await this.chatAPI.createSession();
            currentSessionId = session.session_id;
            chatMessages.innerHTML = '';
            this.addMessage('Создана новая сессия. Чем могу помочь?', 'bot');
            this.loadSessions();
        } catch (error) {
            this.showError('Ошибка создания сессии');
        }
    }

    clearChat() {
        if (chatMessages.children.length === 0) return;
        
        if (confirm('Очистить историю чата?')) {
            chatMessages.innerHTML = '';
            this.addMessage('Чат очищен. Чем могу помочь?', 'bot');
        }
    }

    async loadSessions() {
        try {
            // В реальном приложении здесь был бы запрос к API для получения сессий
            // Для демонстрации используем localStorage
            const sessions = JSON.parse(localStorage.getItem('chat_sessions')) || [];
            this.renderSessions(sessions);
        } catch (error) {
            console.error('Ошибка загрузки сессий:', error);
        }
    }

    renderSessions(sessions) {
        sessionsList.innerHTML = '';
        
        sessions.forEach(session => {
            const sessionDiv = document.createElement('div');
            sessionDiv.className = `session-item ${session.id === currentSessionId ? 'active' : ''}`;
            sessionDiv.innerHTML = `
                <strong>Сессия #${session.id}</strong>
                <small>${new Date(session.created_at).toLocaleDateString()}</small>
            `;
            
            sessionDiv.addEventListener('click', () => this.loadSession(session.id));
            sessionsList.appendChild(sessionDiv);
        });
    }

    async loadSession(sessionId) {
        try {
            const messages = await this.chatAPI.getHistory(sessionId);
            currentSessionId = sessionId;
            chatMessages.innerHTML = '';
            
            messages.forEach(msg => {
                this.addMessage(msg.text, msg.sender);
            });
            
            this.loadSessions();
        } catch (error) {
            this.showError('Ошибка загрузки истории');
        }
    }

    showAuthModal(type) {
        const isLogin = type === 'login';
        modalTitle.textContent = isLogin ? 'Вход в систему' : 'Регистрация';
        submitAuthBtn.textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
        authModal.classList.add('active');
        errorMessage.textContent = '';
    }

    hideAuthModal() {
        authModal.classList.remove('active');
        authForm.reset();
    }

    async handleAuth(isLogin) {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showError('Заполните все поля');
            return;
        }

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                
                if (isLogin) {
                    localStorage.setItem('token', data.access_token);
                    this.chatAPI.setToken(data.access_token);
                    this.updateAuthButtons(true);
                }
                
                this.hideAuthModal();
                this.showSuccess(isLogin ? 'Успешный вход!' : 'Регистрация успешна!');
            } else {
                const error = await response.json();
                this.showError(error.detail || 'Ошибка авторизации');
            }
        } catch (error) {
            this.showError('Ошибка сети');
        }
    }

    updateAuthButtons(isLoggedIn) {
        if (isLoggedIn) {
            loginBtn.innerHTML = '<i class="fas fa-user"></i> Профиль';
            registerBtn.style.display = 'none';
        } else {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
            registerBtn.style.display = 'inline-block';
        }
    }

    showTyping(show) {
        typingIndicator.classList.toggle('active', show);
        messageInput.disabled = show;
        sendBtn.disabled = show;
    }

    showError(message) {
        errorMessage.textContent = message;
        setTimeout(() => errorMessage.textContent = '', 3000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'message bot';
        successDiv.textContent = message;
        chatMessages.appendChild(successDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ChatUI();
    
    // Проверка авторизации
    const token = localStorage.getItem('token');
    if (token) {
        new ChatUI().updateAuthButtons(true);
    }
});