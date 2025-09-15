import { useState } from 'react';
import { XIInstance } from '../api/instances';
import { NagiosXIService } from '../services/nagiosXiService';
import { useAuth } from '../context/AuthContext';

interface InstanceLoginProps {
  instance: XIInstance;
  onLoginSuccess: (instance: XIInstance) => void;
}

export default function InstanceLogin({ instance, onLoginSuccess }: InstanceLoginProps) {
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
    <div className="card">
      <h3>Login to {instance.nickname || instance.name}</h3>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="username" className="block mb-1">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button 
          type="submit" 
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}