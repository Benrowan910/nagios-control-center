import { useState } from "react";
import { NInstance } from "../api/instances";

interface InstanceEditFormProps {
  instance: NInstance;
  onSave: (updatedInstance: NInstance) => void;
  onCancel: () => void;
}

export default function InstanceEditForm({ instance, onSave, onCancel }: InstanceEditFormProps) {
  const [editedInstance, setEditedInstance] = useState<NInstance>({ ...instance });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedInstance);
  };

  const handleChange = (field: keyof NInstance, value: string) => {
    setEditedInstance(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="edit-form-container">
      <h3>Edit Instance</h3>
      
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <label htmlFor="name">Instance Name</label>
          <input
            type="text"
            id="name"
            value={editedInstance.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="nickname">Nickname (Optional)</label>
          <input
            type="text"
            id="nickname"
            value={editedInstance.nickname || ''}
            onChange={(e) => handleChange('nickname', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="url">Host Address</label>
          <input
            type="text"
            id="url"
            value={editedInstance.url.replace(/^https?:\/\//, '')} // Remove protocol for display
            onChange={(e) => {
              // Allow IP addresses, hostnames, or full URLs
              const value = e.target.value;
              handleChange('url', value);
            }}
            placeholder="192.168.1.100 or nagios.example.com"
            required
          />
          <div className="form-help">
            Enter IP address (192.168.1.100) or hostname (nagios.example.com)
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="apiKey">API Key</label>
          <input
            type="password"
            id="apiKey"
            value={editedInstance.apiKey || ''}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="purpose">Purpose (Optional)</label>
          <input
            type="text"
            id="purpose"
            value={editedInstance.purpose || ''}
            onChange={(e) => handleChange('purpose', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Location (Optional)</label>
          <input
            type="text"
            id="location"
            value={editedInstance.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Save Changes</button>
          <button type="button" onClick={onCancel} className="btn">Cancel</button>
        </div>
      </form>
    </div>
  );
}