import React, { useState, useEffect } from 'react';
import { dashletRegistry } from '../utils/dashletRegistry';
import { NInstance } from '../api/instances';

interface CustomDashletProps {
  dashletId: string;
  instance: NInstance;
}

export default function CustomDashlet({ dashletId, instance }: CustomDashletProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadDashlet = async () => {
      try {
        // Extract the actual dashlet ID (remove "custom-" prefix)
        const actualDashletId = dashletId.replace('custom-', '');
        const dashlet = dashletRegistry.getDashlet(actualDashletId);
        
        if (!dashlet) {
          setError(`Dashlet ${actualDashletId} not found`);
          setLoading(false);
          return;
        }

        // Prepare data based on instance information
        let dashletData = {};
        
        // For weather dashlets, use instance location
        if (dashlet.name.toLowerCase().includes('weather')) {
          // Get coordinates from instance location
          const coordinateMap: Record<string, {lat: number, lon: number}> = {
            "New York": {lat: 40.7128, lon: -74.0060},
            "London": {lat: 51.5074, lon: -0.1278},
            "Tokyo": {lat: 35.6895, lon: 139.6917},
            "Sydney": {lat: -33.8688, lon: 151.2093},
            "Berlin": {lat: 52.5200, lon: 13.4050}
          };
          
          const location = instance.location || 'New York';
          const coordinates = coordinateMap[location] || coordinateMap['New York'];
          
          dashletData = { 
            coordinates, 
            locationName: instance.location || instance.name,
            latitude: coordinates.lat,
            longitude: coordinates.lon
          };
        } else {
          // For other dashlet types, pass instance data
          dashletData = {
            instance: {
              name: instance.name,
              url: instance.url,
              purpose: instance.purpose,
              location: instance.location,
              // Add other relevant instance data
            }
          };
        }
        
        setData(dashletData);

        // Compile the component code
        const cleanedCode = dashlet.code.replace(/^export\s+default\s+function\s+/, 'function ');
        
        // Create a function from the code
        const componentFunction = new Function('React', 'props', `
          ${cleanedCode}
          return DashletComponent(props);
        `);
        
        // Get the component
        const CompiledComponent = componentFunction(React, dashletData);
        setComponent(() => CompiledComponent);
        setError(null);
      } catch (err) {
        setError(`Error loading dashlet: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Dashlet loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashlet();
  }, [dashletId, instance]);

  if (loading) {
    return (
      <div className="card">
        <h3>Custom Dashlet</h3>
        <div className="loading">Loading dashlet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3>Custom Dashlet</h3>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="card">
        <h3>Custom Dashlet</h3>
        <div className="error">Failed to load dashlet component</div>
      </div>
    );
  }

  return (
    <div className="card">
      <Component data={data} />
    </div>
  );
}