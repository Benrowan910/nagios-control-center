import { useState } from "react";

interface DashboardControlsProps {
  availableDashlets: string[];
  activeDashlets: string[];
  onAddDashlet: (dashletType: string) => void;
  onRemoveDashlet: (dashletType: string) => void;
  onResetLayout: () => void;
}

export default function DashboardControls({
  availableDashlets,
  activeDashlets,
  onAddDashlet,
  onRemoveDashlet,
  onResetLayout
}: DashboardControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

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