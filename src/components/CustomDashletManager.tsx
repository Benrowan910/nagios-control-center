// components/CustomDashletManager.tsx
import React, { useState, useEffect } from 'react';
import { dashletRegistry, DashletConfig } from '../utils/dashletRegistry';

interface CustomDashletManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onDashletUpdated: () => void;
}

export default function CustomDashletManager({ isOpen, onClose, onDashletUpdated }: CustomDashletManagerProps) {
  const [dashlets, setDashlets] = useState<DashletConfig[]>([]);
  const [editingDashlet, setEditingDashlet] = useState<DashletConfig | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDashlets();
    }
  }, [isOpen]);

  const loadDashlets = () => {
    const allDashlets = dashletRegistry.getAllDashlets();
    setDashlets(allDashlets);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this dashlet?')) {
      dashletRegistry.deleteDashlet(id);
      loadDashlets();
      onDashletUpdated();
    }
  };

  const handleEdit = (dashlet: DashletConfig) => {
    setEditingDashlet(dashlet);
    setEditCode(dashlet.code);
    setEditName(dashlet.name);
  };

  const handleSaveEdit = () => {
    if (editingDashlet) {
      dashletRegistry.updateDashlet(editingDashlet.id, {
        code: editCode,
        name: editName
      });
      setEditingDashlet(null);
      loadDashlets();
      onDashletUpdated();
    }
  };

  const handleCancelEdit = () => {
    setEditingDashlet(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Manage Custom Dashlets</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          {editingDashlet ? (
            <div className="edit-form">
              <h4>Edit Dashlet: {editingDashlet.name}</h4>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Code:</label>
                <textarea
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="form-control code-editor"
                  rows={10}
                />
              </div>
              <div className="form-actions">
                <button onClick={handleSaveEdit} className="btn btn-primary">Save</button>
                <button onClick={handleCancelEdit} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="dashlet-list">
              {dashlets.length === 0 ? (
                <p>No custom dashlets found.</p>
              ) : (
                <table className="dashlet-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashlets.map(dashlet => (
                      <tr key={dashlet.id}>
                        <td>{dashlet.name}</td>
                        <td>{dashlet.type}</td>
                        <td>
                          <button
                            onClick={() => handleEdit(dashlet)}
                            className="btn btn-sm btn-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(dashlet.id)}
                            className="btn btn-sm btn-danger"
                            style={{ marginLeft: '8px' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}