import { appConfig } from '../controls/config.js';

export class ApiService {
  constructor() {
    this.baseUrl = appConfig.apiUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async validateSession(sessionId) {
    return this.request('/validate-session', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

  async logout(sessionId) {
    return this.request('/logout', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

  async needsSetup() {
    return this.request('/needs-setup');
  }
}

export const apiService = new ApiService();