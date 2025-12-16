export default class ChatAPI {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async createSession() {
        return this.request('/chat/session', {
            method: 'POST'
        });
    }

    async sendMessage(sessionId, text) {
        return this.request('/chat/message', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId, text })
        });
    }

    async getHistory(sessionId) {
        return this.request(`/chat/history/${sessionId}`);
    }

    async register(username, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }
}