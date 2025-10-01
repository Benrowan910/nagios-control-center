import { useState } from 'react';
import { NInstance } from '../api/instances';
import { NagiosXIService } from '../services/nagiosXiService';
import { useAuth } from '../context/AuthContext';

interface InstanceLoginProps {
  instance: NInstance;
  onLoginSuccess: (instance: NInstance) => void;
  onCancel?: () => void;
}

// Encrypt function (simple obfuscation - for demo purposes only)
const encrypt = (data: string): string => {
  return btoa(encodeURIComponent(data));
};

// Decrypt function
const decrypt = (data: string): string => {
  return decodeURIComponent(atob(data));
};

export default function InstanceLogin({ instance, onLoginSuccess, onCancel }: InstanceLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { authenticateInstance } = useAuth();

  // Check if credentials are stored in sessionStorage
  useState(() => {
    const credentialsKey = `credentials_${instance.id}`;
    const storedCredentials = sessionStorage.getItem(credentialsKey);
    
    if (storedCredentials) {
      try {
        const credentials = JSON.parse(decrypt(storedCredentials));
        setUsername(credentials.username);
        setPassword(credentials.password);
        
        // Auto-login if credentials are found
        setTimeout(() => {
          handleAutoLogin(credentials.username, credentials.password);
        }, 100);
      } catch (e) {
        console.error('Failed to parse stored credentials:', e);
        sessionStorage.removeItem(credentialsKey);
      }
    }
  });

  const handleAutoLogin = async (storedUsername: string, storedPassword: string) => {
    setIsLoading(true);
    setError('');

    try {
      const isAuthenticated = await NagiosXIService.authenticate(instance, storedUsername, storedPassword);
      
      if (isAuthenticated) {
        // Update instance with credentials
        const updatedInstance = {
          ...instance,
          username: storedUsername,
          password: storedPassword,
          authenticated: true
        };
        
        authenticateInstance(instance.id);
        onLoginSuccess(updatedInstance);
      } else {
        // Clear invalid credentials
        sessionStorage.removeItem(`credentials_${instance.id}`);
        setError('Stored credentials are invalid. Please login again.');
      }
    } catch (err) {
      setError('Failed to connect to Nagios XI instance. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const isAuthenticated = await NagiosXIService.authenticate(instance, username, password);
      
      if (isAuthenticated) {
        // Store credentials in sessionStorage (encrypted)
        const credentialsKey = `credentials_${instance.id}`;
        const credentials = { username, password };
        sessionStorage.setItem(credentialsKey, encrypt(JSON.stringify(credentials)));
        
        // Update instance with credentials
        const updatedInstance = {
          ...instance,
          username,
          password,
          authenticated: true
        };
        
        authenticateInstance(instance.id);
        onLoginSuccess(updatedInstance);
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Failed to connect to Nagios XI instance. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCredentials = () => {
    sessionStorage.removeItem(`credentials_${instance.id}`);
    setUsername('');
    setPassword('');
    setError('Credentials cleared. Please login again.');
  };

  return (
    <div className="login-form">
      <h4>Login to {instance.nickname || instance.name}</h4>
      
      {error && <div className="login-error">{error}</div>}
      
      <form onSubmit={handleLogin} className="login-form-fields">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="login-actions">
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          
          {onCancel && (
            <button 
              type="button"
              onClick={onCancel}
              className="btn"
            >
              Cancel
            </button>
          )}
        </div>
        
        {username && (
          <div className="login-help">
            <button 
              type="button"
              onClick={handleClearCredentials}
              className="btn btn-sm btn-secondary"
            >
              Clear Saved Credentials
            </button>
          </div>
        )}
      </form>
    </div>
  );
}