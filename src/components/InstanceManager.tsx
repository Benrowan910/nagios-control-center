import { useState } from 'react';
import { NInstance, InstanceType } from '../api/instances';
import InstanceLogin from './InstanceLogin';

interface InstanceManagerProps {
  onInstanceAdded: (instance: NInstance) => void;
}

export default function InstanceManager({ onInstanceAdded }: InstanceManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInstance, setNewInstance] = useState<Partial<NInstance>>({
    name: '',
    url: '',
    nickname: '',
    apiKey:'',
    purpose: '',
    location: '',
    authenticated: false,
    type: 'xi'
  });

  const handleAddInstance = () => {
    const instance: NInstance = {
      id: Date.now().toString(),
      name: newInstance.name || '',
      url: newInstance.url || '',
      apiKey: newInstance.apiKey || '',
      nickname: newInstance.nickname,
      purpose: newInstance.purpose,
      location: newInstance.location,
      authenticated: false,
      type: newInstance.type || 'xi'
    };
    
    onInstanceAdded(instance);
    setShowAddForm(false);
    setNewInstance({
      name: '',
      url: '',
      nickname: '',
      apiKey: '',
      purpose: '',
      location: '',
      authenticated: false,
      type: 'xi'
    });
  };

  return (
    <div>
      {!showAddForm ? (
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary mb-4"
        >
          Add Nagios Instance
        </button>
      ) : (
        <div className="card mb-6">
          <h3 className="mb-4">Add New Nagios Instance</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1, required">Instance Name</label>
              <input
                type="text"
                id="name"
                value={newInstance.name}
                onChange={(e) => setNewInstance({...newInstance, name: e.target.value})}
                placeholder="Nagios Instance Name"
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="nickname" className="block mb-1">Nickname</label>
              <input
                type="text"
                id="nickname"
                value={newInstance.nickname || ''}
                onChange={(e) => setNewInstance({...newInstance, nickname: e.target.value})}
                placeholder="Instance Nickname"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="type" className="block mb-1">Instance Type</label>
              <select
                id="type"
                value={newInstance.type || 'xi'}
                onChange={(e) => setNewInstance({...newInstance, type: e.target.value as InstanceType})}
                required
                className="w-full"
              >
                <option value="xi">Nagios XI</option>
                <option value="nna">Nagios Network Analyzer</option>
                <option value="ls">Nagios Log Server</option>
              </select>
            </div>
            <div>
              <label htmlFor="url" className="block mb-1, required">Host Address</label>
              <input
                type="url"
                id="url"
                value={newInstance.url}
                onChange={(e) => setNewInstance({...newInstance, url: e.target.value})}
                placeholder="Ex. 192.168.0.100"
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="apiKey" className="block mb-1, required">API Key</label>
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
              <label htmlFor="purpose" className="block mb-1">Purpose</label>
              <input
                type="text"
                id="purpose"
                value={newInstance.purpose || ''}
                onChange={(e) => setNewInstance({...newInstance, purpose: e.target.value})}
                placeholder="Ex. Monitoring production infrastructure"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="location" className="block mb-1">Location</label>
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