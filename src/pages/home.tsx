import { useState, useEffect } from "react";
import Dashlet from "../components/Dashlet";
import InstanceManager from "../components/InstanceManager";
import { XIInstance } from "../api/instances";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const [instances, setInstances] = useState<XIInstance[]>([]);
  const { authenticatedInstances } = useAuth();

  // Load instances from localStorage
  useEffect(() => {
    const savedInstances = localStorage.getItem('nagios-xi-instances');
    if (savedInstances) {
      setInstances(JSON.parse(savedInstances));
    }
  }, []);

  // Save instances to localStorage when they change
  useEffect(() => {
    localStorage.setItem('nagios-xi-instances', JSON.stringify(instances));
  }, [instances]);

  const handleInstanceAdded = (instance: XIInstance) => {
    setInstances(prev => [...prev, instance]);
  };

  const handleInstanceUpdated = (updatedInstance: XIInstance) => {
    setInstances(prev => 
      prev.map(instance => 
        instance.id === updatedInstance.id ? updatedInstance : instance
      )
    );
  };

  return (
    <div>
      <div className="header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="small">
            Monitor all your Nagios instances from one place
          </p>
        </div>
      </div>

      <InstanceManager onInstanceAdded={handleInstanceAdded} />

      {/* Dashlet Grid */}
      <div className="dashlet-grid">
        {instances.map((instance) => (
          <Dashlet 
            key={instance.id} 
            instance={instance}
            isAuthenticated={authenticatedInstances.includes(instance.id)}
            onInstanceUpdate={handleInstanceUpdated}
          />
        ))}
      </div>
    </div>
  );
}