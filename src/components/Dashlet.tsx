import { useState } from "react";
import { Link } from "react-router-dom";
import { XIInstance } from "../api/instances";
import InstanceLogin from "./InstanceLogin";
import NagiosXIStatus from "./NagiosXIStatus";

interface DashletProps {
  instance: XIInstance;
  isAuthenticated: boolean;
  onInstanceUpdate: (instance: XIInstance) => void;
}

export default function Dashlet({ instance, isAuthenticated, onInstanceUpdate }: DashletProps) {
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = (updatedInstance: XIInstance) => {
    onInstanceUpdate(updatedInstance);
    setShowLogin(false);
  };

  return (
    <div className="card">
      <div className="dashlet-header">
        <h3>{instance.nickname || instance.name}</h3>
        <span className={`status-dot ${isAuthenticated ? 'OK' : 'CRITICAL'}`}></span>
      </div>
      
      <p className="dashlet-purpose">{instance.purpose}</p>
      
      {isAuthenticated ? (
        <>
          <NagiosXIStatus instance={instance} />
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