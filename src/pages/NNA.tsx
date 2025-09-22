import { useInstances } from "../context/InstanceContext";
import { useAuth } from "../context/AuthContext";
import GridLayout from "../components/GridLayout";
import Dashlet from "../components/Dashlet";
import InstanceManager from "../components/InstanceManager";
import { useState } from "react";

export default function NetworkAnalyzerDashboard() {
  const { instances, addInstance, updateInstance, removeInstance } = useInstances();
  const { authenticatedInstances } = useAuth();
  
  // Filter only NNA instances
  const nnaInstances = instances.filter(inst => inst.type === 'nna');

  const handleInstanceDelete = (instanceId: string) => {
    removeInstance(instanceId);
  };

  const handleInstanceUpdate = (instance: any) => {
    updateInstance(instance);
  };

  // Custom InstanceManager for NNA
  const NNAInstanceManager = ({ onInstanceAdded }: { onInstanceAdded: (instance: any) => void }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newInstance, setNewInstance] = useState({
      name: '',
      url: '',
      apiKey:'',
      nickname: '',
      purpose: '',
      location: '',
      authenticated: false,
      type: 'nna' as const
    });

    const handleAddInstance = () => {
      const instance = {
        id: Date.now().toString(),
        ...newInstance,
        type: 'nna' as const
      };
      
      onInstanceAdded(instance);
      setShowAddForm(false);
      setNewInstance({
        name: '',
        url: '',
        apiKey:'',
        nickname: '',
        purpose: '',
        location: '',
        authenticated: false,
        type: 'nna'
      });
    };

    return (
      <div>
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary mb-4"
          >
            Add NNA Instance
          </button>
        ) : (
          <div className="card mb-6">
            <h3 className="mb-4">Add New NNA Instance</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block mb-1">Instance Name</label>
                <input
                  type="text"
                  id="name"
                  value={newInstance.name}
                  onChange={(e) => setNewInstance({...newInstance, name: e.target.value})}
                  placeholder="Nagios NNA - Data Center A"
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
                  onChange={(e) => setNewInstance({...newInstance, nickname: e.target.value})}
                  placeholder="Prod NNA"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="url" className="block mb-1">URL</label>
                <input
                  type="url"
                  id="url"
                  value={newInstance.url}
                  onChange={(e) => setNewInstance({...newInstance, url: e.target.value})}
                  placeholder="https://nna.example.com"
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
                onChange={(e) => setNewInstance({...newInstance, apiKey: e.target.value})}
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
                  onChange={(e) => setNewInstance({...newInstance, purpose: e.target.value})}
                  placeholder="Monitoring network traffic"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="location" className="block mb-1">Location (Optional)</label>
                <input
                  type="text"
                  id="location"
                  value={newInstance.location}
                  onChange={(e) => setNewInstance({...newInstance, location: e.target.value})}
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

  return (
    <div>
      <div className="header">
        <div>
          <h1>Network Analyzer Dashboard</h1>
          <p className="small">
            Monitor network traffic and performance
          </p>
        </div>
      </div>

      <NNAInstanceManager onInstanceAdded={addInstance} />

      {nnaInstances.length === 0 ? (
        <div className="card">
          <h3>No NNA Instances</h3>
          <p>Add your first NNA instance to start monitoring network traffic.</p>
        </div>
      ) : (
        <GridLayout onLayoutChange={undefined}>
          {nnaInstances.map((instance) => (
            <div key={instance.id}>
              <Dashlet 
                instance={instance}
                isAuthenticated={authenticatedInstances.includes(instance.id)}
                onInstanceUpdate={handleInstanceUpdate}
                onInstanceDelete={handleInstanceDelete}
              />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}