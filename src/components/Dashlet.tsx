import { useState } from "react";
import { Link } from "react-router-dom";
import { NInstance } from "../api/instances";
import InstanceLogin from "./InstanceLogin";
import NagiosXIStatus from "./NagiosXIStatus";
import NNAStatus from "./NNAStatus";

// types/dashlet.ts
export interface DashletConfig {
  id: string;
  name: string;
  type: 'xi' | 'nna' | 'ls';
  component: React.ComponentType<any>;
  defaultSize: { w: number; h: number };
  requiredProps: string[];
}


interface DashletProps {
  instance: NInstance;
  isAuthenticated: boolean;
  onInstanceUpdate: (instance: NInstance) => void;
  onInstanceDelete: (instanceId: string) => void;
}

export default function Dashlet({ instance, isAuthenticated, onInstanceUpdate, onInstanceDelete }: DashletProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLoginSuccess = (updatedInstance: NInstance) => {
    onInstanceUpdate(updatedInstance);
    setShowLogin(false);
  };

  const handleDelete = () => {
    onInstanceDelete(instance.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="card dashlet">
      {/* Delete button */}
      <button 
        className="dashlet-delete-btn"
        onClick={() => setShowDeleteConfirm(true)}
        aria-label="Delete instance"
      >
        ×
      </button>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Delete Instance</h3>
            <p>Are you sure you want to delete "{instance.nickname || instance.name}"?</p>
            <div className="delete-confirm-actions">
              <button 
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      
      
      <div className="dashlet-header">
        <h3>{instance.nickname || instance.name}</h3>
        <span className={`status-dot ${isAuthenticated ? 'OK' : 'CRITICAL'}`}></span>
      </div>
      
      
      <p className="dashlet-purpose">{instance.purpose}</p>
      
      {isAuthenticated ? (
      <>
        {instance.type === 'xi' && <NagiosXIStatus instance={instance} />}
        {instance.type === 'nna' && <NNAStatus instance={instance} />}
        <div className="dashlet-footer">
          <span className="dashlet-url">{instance.url}</span>
          <Link to={`/instance/${instance.id}`} className="btn btn-primary">
            View Details
          </Link>
        </div>
      </>
      ) : (
        <>
          <p className="small mb-4">Authentication required to view monitoring data</p>
          <div className="dashlet-footer">
            <span className="dashlet-url">{instance.url}</span>
            <button 
              onClick={() => setShowLogin(true)}
              className="btn btn-primary"
            >
              Login
            </button>
          </div>
          
          {showLogin && (
            <div className="mt-4">
              <InstanceLogin 
                instance={instance} 
                onLoginSuccess={handleLoginSuccess}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}