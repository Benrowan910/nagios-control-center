import { useParams } from "react-router-dom";
import { useState, useEffect, JSX } from "react";
import { useAuth } from "../context/AuthContext";
import { useInstances } from "../context/InstanceContext";
import WeatherDashlet from "../components/WeatherDashlet";
import NagiosXIStatus from "../components/NagiosXIStatus";
import InstanceLogin from "../components/InstanceLogin";
import InstanceEditForm from "../components/InstanceEditForm";
import GridLayout from "../components/GridLayout";
import DashboardControls from "../controls/DashboardControls";
import { NInstance } from "../api/instances";
import NNAStatus from "../components/NNAStatus"
import { dashletRegistry } from '../utils/DashletRegistry';
import CustomDashlet from '../components/CustomDashlet';
import CustomDashletManager from '../components/CustomDashletManager';

// Define types for coordinates
interface Coordinates {
  lat: number;
  lon: number;
}

// Define type for layout items
interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Define type for dashlet
interface Dashlet {
  i: string;
  component: JSX.Element;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Default layout configuration
const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'instance-details', x: 0, y: 0, w: 4, h: 2 },
  { i: 'monitoring-overview', x: 4, y: 0, w: 8, h: 4 },
  { i: 'weather', x: 0, y: 2, w: 4, h: 3 },
  { i: 'performance', x: 4, y: 4, w: 4, h: 2 },
  { i: 'alerts', x: 8, y: 4, w: 4, h: 2 }
];

export default function Instance() {
  const { id } = useParams<{ id: string }>();
  const { authenticatedInstances } = useAuth();
  const { instances, updateInstance } = useInstances();
  const [showLogin, setShowLogin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dashlets, setDashlets] = useState<Dashlet[]>([]);
  const [activeDashletTypes, setActiveDashletTypes] = useState<string[]>([]);
  const [showDashletManager, setShowDashletManager] = useState(false);
  const [dashletsUpdated, setDashletsUpdated] = useState(0);

  const instance = instances.find(inst => inst.id === id);
  
  // Get coordinates for weather - return undefined instead of null for type consistency
  const getCoordinatesFromLocation = (location: string): Coordinates | undefined => {
    const coordinateMap: Record<string, Coordinates> = {
      "New York": {lat: 40.7128, lon: -74.0060},
      "London": {lat: 51.5074, lon: -0.1278},
      "Tokyo": {lat: 35.6895, lon: 139.6917},
      "Sydney": {lat: -33.8688, lon: 151.2093},
      "Berlin": {lat: 52.5200, lon: 13.4050}
    };
    
    return coordinateMap[location] || undefined;
  };

const createDashletComponent = (dashletType: string, instance: NInstance, coordinates?: Coordinates): JSX.Element => {
  // Check if this is a custom dashlet
  if (dashletType.startsWith('custom-')) {
    return <CustomDashlet key={dashletType} dashletId={dashletType} instance={instance} />;
  }  switch (dashletType) {
    case 'instance-details':
      return (
        <div key="instance-details" className="card">
          <h3>Instance Details</h3>
          <p><strong>URL:</strong> {instance.url}</p>
          <p><strong>Status:</strong> <span className="badge OK">Connected</span></p>
          <p><strong>API Key:</strong> {instance.apiKey ? '••••••••' : 'Not set'}</p>
          {instance.purpose && <p><strong>Purpose:</strong> {instance.purpose}</p>}
          {instance.location && <p><strong>Location:</strong> {instance.location}</p>}
        </div>
      );
    
    case 'monitoring-overview':
      return (
        <div key="monitoring-overview" className="card">
          <h3>Monitoring Overview</h3>
          {instance.type === 'xi' && <NagiosXIStatus instance={instance} />}
          {instance.type === 'nna' && <NNAStatus instance={instance} />}
        </div>
      );
      
      case 'weather':
        return coordinates ? (
          <WeatherDashlet 
            key="weather"
            latitude={coordinates.lat}
            longitude={coordinates.lon}
            locationName={instance.location || instance.name}
          />
        ) : (
          <div key="weather" className="card">
            <h3>Weather Information</h3>
            <div className="error">Location not configured for weather data</div>
          </div>
        );
      
      default:
        return (
          <div key="unknown" className="card">
            <h3>Unknown Dashlet</h3>
            <div className="error">Unknown dashlet type: {dashletType}</div>
          </div>
        );
    }
  };

// Initialize dashlets based on instance data
useEffect(() => {
  if (instance) {
    const coordinates = instance.location ? getCoordinatesFromLocation(instance.location) : undefined;
    
    // Load saved layout or use default
    const layoutKey = `instance-${instance.id}-layout`;
    const savedLayout = localStorage.getItem(layoutKey);
    let layout: LayoutItem[] = [];
    
    if (savedLayout) {
      layout = JSON.parse(savedLayout);
    } else {
      // Load custom dashlets for this instance type
      const customDashlets = dashletRegistry.getDashletsByType(instance.type);
      const customDashletItems = customDashlets.map(dashlet => ({
        i: `custom-${dashlet.id}`,
        x: 0,
        y: 0,
        w: dashlet.defaultSize.w,
        h: dashlet.defaultSize.h
      }));
      
      // Combine with default layout
      layout = [...DEFAULT_LAYOUT, ...customDashletItems];
    }
    
    // Determine which dashlets are active
    const activeTypes = layout.map((item: LayoutItem) => item.i);
    setActiveDashletTypes(activeTypes);
    
    // Create dashlet components
    const dashletComponents: Dashlet[] = layout.map((item: LayoutItem) => {
      const component = createDashletComponent(item.i, instance, coordinates);
      return {
        i: item.i,
        component,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h
      };
    });
    
    setDashlets(dashletComponents);
  }
}, [instance]);

  if (!instance) {
    return <div>Instance not found</div>;
  }

  const isAuthenticated = authenticatedInstances.includes(instance.id);

  const handleLoginSuccess = (updatedInstance: NInstance) => {
    updateInstance(updatedInstance);
    setShowLogin(false);
  };

  const handleEditSave = (updatedInstance: NInstance) => {
    updateInstance(updatedInstance);
    setEditing(false);
  };

  const handleEditCancel = () => {
    setEditing(false);
  };

  const handleDashletsUpdated = () => {
    setDashletsUpdated(prev => prev + 1);
    if(instance){
      const coordinates = instance.location ? getCoordinatesFromLocation(instance.location) : undefined;
    }
  }


  const addDashlet = (dashletType: string) => {
  if (dashletType.startsWith('custom-')) {
    // Add custom dashlet
    const dashletId = dashletType.replace('custom-', '');
    const dashlet = dashletRegistry.getDashlet(dashletId);
    
    if (dashlet) {
      const coordinates = instance.location ? getCoordinatesFromLocation(instance.location) : undefined;
      
      const newDashlet: Dashlet = {
        i: `custom-${dashletId}`,
        component: createDashletComponent(`custom-${dashletId}`, instance, coordinates),
        x: 0,
        y: Math.max(...dashlets.map(d => d.y + d.h), 0),
        w: dashlet.defaultSize.w,
        h: dashlet.defaultSize.h
      };
      
      setActiveDashletTypes([...activeDashletTypes, `custom-${dashletId}`]);
      setDashlets([...dashlets, newDashlet]);
    } else{
      console.error(`Dashlet ${dashletId} not found in registry`);
    }
  } else {
    const coordinates = instance.location ? getCoordinatesFromLocation(instance.location) : undefined;
    
    // Create new dashlet
    const newDashlet: Dashlet = {
      i: dashletType,
      component: createDashletComponent(dashletType, instance, coordinates),
      x: 0,
      y: Math.max(...dashlets.map(d => d.y + d.h), 0),
      w: 4,
      h: 2
    };
    
    // Update active dashlet types
    setActiveDashletTypes([...activeDashletTypes, dashletType]);
    
    // Add to dashlets array
    setDashlets([...dashlets, newDashlet]);
  }
};


  const removeDashlet = (dashletType: string) => {
    // Remove from active dashlet types
    setActiveDashletTypes(activeDashletTypes.filter(type => type !== dashletType));
    
    // Remove from dashlets array
    setDashlets(dashlets.filter(d => d.i !== dashletType));
  };

  const resetLayout = () => {
    if (instance) {
      localStorage.removeItem(`instance-${instance.id}-layout`);
      window.location.reload(); // Reload to apply default layout
    }
  };

  const availableDashlets = ['instance-details', 'monitoring-overview', 'weather', 'performance', 'alerts'].filter(
    type => !activeDashletTypes.includes(type)
  );

  return (
    <div>
      <div className="header">
        <button 
          onClick={() => setShowDashletManager(true)}
          className="btn btn-secondary"
        >
          Manage Custom Dashlets
        </button>
        <CustomDashletManager
          isOpen={showDashletManager}
          onClose={() => setShowDashletManager(false)}
          onDashletUpdated={handleDashletsUpdated}
        />
        <div>
          <h1>{instance.nickname || instance.name}</h1>
          <p className="small">{instance.purpose}</p>
        </div>
        {isAuthenticated && (
          <div className="header-actions">
            <DashboardControls
              availableDashlets={availableDashlets}
              activeDashlets={activeDashletTypes}
              onAddDashlet={addDashlet}
              onRemoveDashlet={removeDashlet}
              onResetLayout={resetLayout}
              instanceType={instance.type} // Add this
            />

            
            <button 
              onClick={() => setEditing(true)}
              className="btn btn-secondary"
            >
              Edit Instance
            </button>
            <button 
              onClick={() => {
                // Refresh all dashlets
                setDashlets([...dashlets]);
              }}
              className="btn btn-primary"
            >
              Refresh Data
            </button>
          </div>
        )}
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

        
      ) : editing ? (
        <InstanceEditForm 
          instance={instance}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      ) : (
        <GridLayout onLayoutChange={undefined}>
          {dashlets.map(dashlet => (
            <div key={dashlet.i}>
              {dashlet.component}
            </div>
          ))}
        </GridLayout>

        
      )}
    </div>

    
  
  );
}
