import { useState } from "react";
import { XIInstance } from "../api/instances";

interface InstanceEditFormProps {
  instance: XIInstance;
  onSave: (updatedInstance: XIInstance) => void;
  onCancel: () => void;
}

export default function InstanceEditForm({ instance, onSave, onCancel }: InstanceEditFormProps) {
  const [editedInstance, setEditedInstance] = useState<XIInstance>({ ...instance });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedInstance);
  };

  const handleChange = (field: keyof XIInstance, value: string) => {
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
          <label htmlFor="url">URL</label>
          <input
            type="url"
            id="url"
            value={editedInstance.url}
            onChange={(e) => handleChange('url', e.target.value)}
            required
          />
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