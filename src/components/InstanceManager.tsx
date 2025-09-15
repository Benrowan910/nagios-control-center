import { useState } from 'react';
import { XIInstance } from '../api/instances';
import InstanceLogin from './InstanceLogin';

interface InstanceManagerProps {
  onInstanceAdded: (instance: XIInstance) => void;
}

export default function InstanceManager({ onInstanceAdded }: InstanceManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInstance, setNewInstance] = useState<Partial<XIInstance>>({
    name: '',
    url: '',
    nickname: '',
    purpose: '',
    location: '',
    authenticated: false
  });

  const handleAddInstance = () => {
    const instance: XIInstance = {
      id: Date.now().toString(),
      name: newInstance.name || '',
      url: newInstance.url || '',
      apiKey: "0",
      nickname: newInstance.nickname,
      purpose: newInstance.purpose,
      location: newInstance.location,
      authenticated: false
    };
    
    onInstanceAdded(instance);
    setShowAddForm(false);
    setNewInstance({
      name: '',
      url: '',
      nickname: '',
      purpose: '',
      location: '',
      authenticated: false
    });
  };

  return (
    <div>
      {!showAddForm ? (
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary mb-4"
        >
          Add Nagios XI Instance
        </button>
      ) : (
        <div className="card mb-6">
          <h3 className="mb-4">Add New Nagios XI Instance</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1">Instance Name</label>
              <input
                type="text"
                id="name"
                value={newInstance.name}
                onChange={(e) => setNewInstance({...newInstance, name: e.target.value})}
                placeholder="Nagios XI - Data Center A"
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="nickname" className="block mb-1">Nickname (Optional)</label>
              <input
                type="text"
                id="nickname"
                value={newInstance.nickname || ''}
                onChange={(e) => setNewInstance({...newInstance, nickname: e.target.value})}
                placeholder="Prod XI"
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
                placeholder="https://nagios.example.com"
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="purpose" className="block mb-1">Purpose (Optional)</label>
              <input
                type="text"
                id="purpose"
                value={newInstance.purpose || ''}
                onChange={(e) => setNewInstance({...newInstance, purpose: e.target.value})}
                placeholder="Monitoring production infrastructure"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="location" className="block mb-1">Location (Optional)</label>
              <input
                type="text"
                id="location"
                value={newInstance.location || ''}
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
}