import { useParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useInstances } from "../context/InstanceContext";
import WeatherDashlet from "../components/WeatherDashlet";
import NagiosXIStatus from "../components/NagiosXIStatus";
import InstanceLogin from "../components/InstanceLogin";

export default function Instance() {
  const { id } = useParams<{ id: string }>();
  const { authenticatedInstances } = useAuth();
  const { instances, updateInstance } = useInstances();
  const [showLogin, setShowLogin] = useState(false);

  const instance = instances.find(inst => inst.id === id);
  
  if (!instance) {
    return <div>Instance not found</div>;
  }

  const isAuthenticated = authenticatedInstances.includes(instance.id);

  const handleLoginSuccess = (updatedInstance: any) => {
    updateInstance(updatedInstance);
    setShowLogin(false);
  };

  // Get coordinates for weather
  const getCoordinatesFromLocation = (location: string) => {
    const coordinateMap: Record<string, {lat: number, lon: number}> = {
      "New York": {lat: 40.7128, lon: -74.0060},
      "London": {lat: 51.5074, lon: -0.1278},
      "Tokyo": {lat: 35.6895, lon: 139.6917},
      "Sydney": {lat: -33.8688, lon: 151.2093},
      "Berlin": {lat: 52.5200, lon: 13.4050}
    };
    
    return coordinateMap[location] || {lat: 51.5074, lon: -0.1278};
  };

  const coordinates = instance.location ? getCoordinatesFromLocation(instance.location) : null;

  return (
    <div>
      <div className="header">
        <div>
          <h1>{instance.nickname || instance.name}</h1>
          <p className="small">{instance.purpose}</p>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="card">
          <h3>Authentication Required</h3>
          <p>You need to login to this Nagios XI instance to view its details.</p>
          <button 
            onClick={() => setShowLogin(true)}
            className="btn btn-primary mt-4"
          >
            Login to Nagios XI
          </button>
          
          {showLogin && (
            <div className="mt-4">
              <InstanceLogin 
                instance={instance} 
                onLoginSuccess={handleLoginSuccess}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="dashlet-grid">
          {coordinates && (
            <WeatherDashlet 
              latitude={coordinates.lat}
              longitude={coordinates.lon}
              locationName={instance.location || instance.name}
            />
          )}
          
          <div className="card">
            <h3>Instance Details</h3>
            <p><strong>URL:</strong> {instance.url}</p>
            <p><strong>Status:</strong> <span className="badge OK">Connected</span></p>
          </div>
          
          <div className="card col-span-2">
            <h3>Monitoring Overview</h3>
            <NagiosXIStatus instance={instance} />
          </div>
        </div>
      )}
    </div>
  );
}