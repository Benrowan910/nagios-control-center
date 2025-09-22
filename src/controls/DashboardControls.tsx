import React, { useState, useEffect } from "react";
import { dashletRegistry } from '../utils/dashletRegistry';

interface DashboardControlsProps {
  availableDashlets: string[];
  activeDashlets: string[];
  onAddDashlet: (dashletType: string) => void;
  onRemoveDashlet: (dashletType: string) => void;
  onResetLayout: () => void;
  instanceType?: string;
}

export default function DashboardControls({
  availableDashlets,
  activeDashlets,
  onAddDashlet,
  onRemoveDashlet,
  onResetLayout,
  instanceType = 'xi'
}: DashboardControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customDashlets, setCustomDashlets] = useState<any[]>([]);
  
  useEffect(() => {
    // Load custom dashlets for this instance type
    if (instanceType) {
      const dashlets = dashletRegistry.getDashletsByType(instanceType);
      setCustomDashlets(dashlets);
    }
  }, [instanceType]);

  return (
    <div className="dashboard-controls">
      <button 
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide Controls' : 'Customize Dashboard'}
      </button>
      
      {isOpen && (
        <div className="controls-panel">
          <h4>Dashboard Controls</h4>
          
// Update the custom dashlets section in DashboardControls
{customDashlets.length > 0 && (
  <div className="control-section">
    <h5>Custom Dashlets</h5>
    <div className="dashlet-options">
      {customDashlets.map(dashlet => (
        <div key={dashlet.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <button
            className="btn btn-sm"
            onClick={() => onAddDashlet(`custom-${dashlet.id}`)}
            disabled={activeDashlets.includes(`custom-${dashlet.id}`)}
          >
            Add {dashlet.name}
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (window.confirm(`Delete ${dashlet.name}?`)) {
                dashletRegistry.deleteDashlet(dashlet.id);
                setCustomDashlets(dashletRegistry.getDashletsByType(instanceType));
                // Also remove from active dashlets if it's currently active
                if (activeDashlets.includes(`custom-${dashlet.id}`)) {
                  onRemoveDashlet(`custom-${dashlet.id}`);
                }
              }
            }}
            style={{ marginLeft: '5px' }}
            title="Delete this dashlet"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
)}
          <div className="control-section">
            <h5>Add Dashlets</h5>
            <div className="dashlet-options">
              {availableDashlets.map(dashlet => (
                <button
                  key={dashlet}
                  className="btn btn-sm"
                  onClick={() => onAddDashlet(dashlet)}
                  disabled={activeDashlets.includes(dashlet)}
                >
                  Add {dashlet}
                </button>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <h5>Remove Dashlets</h5>
            <div className="dashlet-options">
              {activeDashlets.map(dashlet => (
                <button
                  key={dashlet}
                  className="btn btn-sm btn-danger"
                  onClick={() => onRemoveDashlet(dashlet)}
                >
                  Remove {dashlet}
                </button>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <button
              className="btn btn-warning"
              onClick={onResetLayout}
            >
              Reset to Default Layout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}