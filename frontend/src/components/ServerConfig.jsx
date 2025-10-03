import { useState, useEffect } from 'react';
import { appConfig } from '../controls/config.js';

export default function ServerConfig({ onServerConfigured }) {
  const [serverUrl, setServerUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Load saved URL if exists
    if (appConfig.serverBaseUrl) {
      setServerUrl(appConfig.serverBaseUrl);
    } else {
      // Try to auto-detect
      autoDetectServer();
    }
  }, []);

  const autoDetectServer = async () => {
    // Get current host information
    const currentHost = window.location.hostname;
    const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
    
    if (isLocalhost) {
      // If we're on localhost, try common local IPs
      const possibleUrls = [
        'http://localhost:3089',
        'http://127.0.0.1:3089',
        'http://192.168.1.100:3089',
        'http://192.168.0.100:3089',
        'http://10.0.0.100:3089',
      ];

      for (const url of possibleUrls) {
        if (await appConfig.testConnection(url)) {
          setServerUrl(url);
          break;
        }
      }
    }
  };

  const handleTestConnection = async () => {
    if (!serverUrl.trim()) {
      setError('Please enter a server URL');
      return;
    }

    setTesting(true);
    setError('');

    // Validate URL format
    let testUrl = serverUrl.trim();
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = 'http://' + testUrl;
    }

    try {
      const isReachable = await appConfig.testConnection(testUrl);
      
      if (isReachable) {
        appConfig.serverBaseUrl = testUrl;
        onServerConfigured();
      } else {
        setError('Server is not responding correctly');
      }
    } catch (error) {
      setError(`Cannot connect to server: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleUseCurrent = () => {
    // Use the same origin (for when backend serves frontend)
    appConfig.serverBaseUrl = '';
    onServerConfigured();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Nagios Control Center</h1>
        <p className="text-gray-300 mb-6 text-center text-sm">
          Connect to your Nagios server
        </p>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Server Address
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="192.168.1.100:3089 or https://your-server.com"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleTestConnection()}
          />
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors font-medium"
          >
            {testing ? 'Testing...' : 'Connect'}
          </button>
        </div>

        {/* Current origin option for bundled apps */}
        <div className="text-center mb-4">
          <button
            onClick={handleUseCurrent}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Use current server (if bundled)
          </button>
        </div>

        <div className="border-t border-gray-600 pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-gray-400 hover:text-gray-300 text-sm flex items-center justify-center w-full"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>
          
          {showAdvanced && (
            <div className="mt-3 p-3 bg-gray-700 rounded-md text-sm">
              <h4 className="font-medium mb-2">Network Tips:</h4>
              <ul className="text-gray-300 space-y-1 text-xs">
                <li>• Find your server IP: <code className="bg-gray-800 px-1">ip addr show</code></li>
                <li>• Local examples: <code className="bg-gray-800 px-1">192.168.1.100:3089</code></li>
                <li>• Internet examples: <code className="bg-gray-800 px-1">https://your-domain.com</code></li>
                <li>• Make sure firewall allows port 3089</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}