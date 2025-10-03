import { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { useInstances } from "../context/InstanceContext";
import { NagiosLogServerService, LogServerStatusI, LogSourceI } from "../services/nagiosLSService";

export default function LogServerDashboard() {
  const { instances, addInstance, updateInstance, removeInstance } = useInstances();
  const { authenticatedInstances } = useAuth();

  const [status, setStatus] = useState<LogServerStatusI | null>(null);
  const [sources, setSources] = useState<LogSourceI[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'alerts' | 'search'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Only LS instances that are authenticated
  const logServerInstances = instances.filter(
    inst => authenticatedInstances.includes(inst.id) && inst.type === 'ls'
  );

  // Instance manager for LS
  const LSInstanceManager = ({ onInstanceAdded }: { onInstanceAdded: (instance: any) => void }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newInstance, setNewInstance] = useState({
      name: '',
      url: '',
      apiKey: '',
      nickname: '',
      purpose: '',
      location: '',
      authenticated: false,
      type: 'ls' as const
    });

    const handleAddInstance = () => {
      const instance = {
        id: Date.now().toString(),
        ...newInstance,
        type: 'ls' as const
      };

      onInstanceAdded(instance);
      setShowAddForm(false);
      setNewInstance({
        name: '',
        url: '',
        apiKey: '',
        nickname: '',
        purpose: '',
        location: '',
        authenticated: false,
        type: 'ls'
      });
    };

    return (
      <div>
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary mb-4"
          >
            Add Log Server Instance
          </button>
        ) : (
          <div className="card mb-6">
            <h3 className="mb-4">Add New Log Server Instance</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block mb-1">Instance Name</label>
                <input
                  type="text"
                  id="name"
                  value={newInstance.name}
                  onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                  placeholder="Nagios Log Server - Data Center A"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="nickname" className="block mb-1">Nickname (Optional)</label>
                <input
                  type="text"
                  id="nickname"
                  value={newInstance.nickname}
                  onChange={(e) => setNewInstance({ ...newInstance, nickname: e.target.value })}
                  placeholder="Prod LS"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="url" className="block mb-1">URL</label>
                <input
                  type="url"
                  id="url"
                  value={newInstance.url}
                  onChange={(e) => setNewInstance({ ...newInstance, url: e.target.value })}
                  placeholder="https://ls.example.com"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="apiKey" className="block mb-1">API Key</label>
                <input
                  type="password"
                  id="apiKey"
                  value={newInstance.apiKey || ''}
                  onChange={(e) => setNewInstance({ ...newInstance, apiKey: e.target.value })}
                  placeholder="Enter API Key"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="purpose" className="block mb-1">Purpose (Optional)</label>
                <input
                  type="text"
                  id="purpose"
                  value={newInstance.purpose}
                  onChange={(e) => setNewInstance({ ...newInstance, purpose: e.target.value })}
                  placeholder="Monitoring system logs"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="location" className="block mb-1">Location (Optional)</label>
                <input
                  type="text"
                  id="location"
                  value={newInstance.location}
                  onChange={(e) => setNewInstance({ ...newInstance, location: e.target.value })}
                  placeholder="New York, NY"
                  className="w-full"
                />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleAddInstance}
                  className="btn btn-primary"
                >
                  Add Instance
                </button>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      if (logServerInstances.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const instance = logServerInstances[0]; // Use first authenticated instance
        const [statusData, sourcesData] = await Promise.all([
          NagiosLogServerService.getLogServerStatus(instance),
          NagiosLogServerService.getLogSources(instance)
        ]);
        
        setStatus(statusData);
        setSources(sourcesData);
      } catch (error) {
        console.error('Error fetching Log Server data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [logServerInstances]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || logServerInstances.length === 0) return;
    
    try {
      const instance = logServerInstances[0];
      const results = await NagiosLogServerService.searchLogs(instance, searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching logs:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        Loading Log Server data...
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1>Log Server Dashboard</h1>
          <p className="small">
            Monitor and analyze your log data across all systems
          </p>
        </div>
      </div>

      {/* Add Instance Manager */}
      <LSInstanceManager onInstanceAdded={addInstance} />

      {/* Existing dashboard UI */}
      {!status ? (
        <div className="card">
          <div className="error">
            No Log Server instances available. Please add and authenticate a Log Server instance in Settings.
          </div>
        </div>
      ) : (
        <>
          {/* tabs + overview/sources/search same as before */}
        </>
      )}
    </div>
  );
}
