import { useState } from 'react';
import { XIInstance } from '../api/instances';
import { NagiosXIService } from '../services/nagiosXiService';
import { useAuth } from '../context/AuthContext';

interface InstanceLoginProps {
  instance: XIInstance;
  onLoginSuccess: (instance: XIInstance) => void;
  onCancel?: () => void;
}

export default function InstanceLogin({ instance, onLoginSuccess, onCancel }: InstanceLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { authenticateInstance } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const isAuthenticated = await NagiosXIService.authenticate(instance, username, password);
      
      if (isAuthenticated) {
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
      </form>
    </div>
  );
}