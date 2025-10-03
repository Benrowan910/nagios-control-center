// Simple configuration that works with Capacitor
class AppConfig {
  constructor() {
    // For Capacitor, we'll use the same origin or allow configuration
    this._serverBaseUrl = localStorage.getItem('serverBaseUrl') || '';
  }

  get serverBaseUrl() {
    // In Capacitor, if no server URL is set, use relative paths
    return this._serverBaseUrl;
  }

  set serverBaseUrl(url) {
    this._serverBaseUrl = url.replace(/\/$/, ''); // Remove trailing slash
    localStorage.setItem('serverBaseUrl', this._serverBaseUrl);
  }

  get apiUrl() {
    if (this._serverBaseUrl) {
      return `${this._serverBaseUrl}/api`;
    }
    // For Capacitor web version or same origin
    return '/api';
  }

  // Test if we can reach the server
  async testConnection(serverUrl = this._serverBaseUrl) {
    const testUrl = serverUrl ? `${serverUrl}/api/needs-setup` : '/api/needs-setup';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const appConfig = new AppConfig();