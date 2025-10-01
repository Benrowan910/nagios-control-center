import React, { useState, useEffect } from 'react';
import { useTheme } from "../context/ThemeContext";
import { dashletRegistry } from '../utils/DashletRegistry';

// Default templates for each dashlet type
const DEFAULT_TEMPLATES = {
  xi: `// Nagios XI Dashlet Template
export default function CustomXIDashlet({ data }) {
  return (
    <div className="card">
      <h3>Custom XI Dashlet</h3>
      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-label">Hosts Up</div>
          <div className="metric-value">{data?.hostsUp || 0}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Services OK</div>
          <div className="metric-value">{data?.servicesOk || 0}</div>
        </div>
      </div>
    </div>
  );
}`,
  
  logserver: `// Log Server Dashlet Template
export default function CustomLogServerDashlet({ data }) {
  return (
    <div className="card">
      <h3>Custom Log Server Dashlet</h3>
      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-label">Total Logs</div>
          <div className="metric-value">{data?.totalLogs || 0}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Critical Alerts</div>
          <div className="metric-value">{data?.criticalAlerts || 0}</div>
        </div>
      </div>
    </div>
  );
}`,
  
  nna: `// NNA Dashlet Template
export default function CustomNNADashlet({ data }) {
  return (
    <div className="card">
      <h3>Custom NNA Dashlet</h3>
      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-label">Bandwidth Usage</div>
          <div className="metric-value">{data?.bandwidthUsage || 0} Mbps</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Active Flows</div>
          <div className="metric-value">{data?.activeFlows || 0}</div>
        </div>
      </div>
    </div>
  );
}`
};

// Mock data for preview
const MOCK_DATA = {
  xi: { hostsUp: 15, servicesOk: 128 },
  logserver: { totalLogs: 10482, criticalAlerts: 7 },
  nna: { bandwidthUsage: 350, activeFlows: 150 }
};

export default function DashletCreator() {
  const { theme } = useTheme();
  const [dashletType, setDashletType] = useState('xi');
  const [code, setCode] = useState(DEFAULT_TEMPLATES.xi);
  const [dashletName, setDashletName] = useState('MyCustomDashlet');
  const [previewComponent, setPreviewComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedDashlets, setSavedDashlets] = useState<string[]>([]);

  useEffect(() => {
    // Load saved dashlets from registry
    dashletRegistry.loadFromStorage();
    const saved = dashletRegistry.getDashletsByType(dashletType);
    setSavedDashlets(saved.map(d => d.name));
  }, [dashletType]);

  // Update code when dashlet type changes
  useEffect(() => {
    setCode(DEFAULT_TEMPLATES[dashletType as keyof typeof DEFAULT_TEMPLATES]);
  }, [dashletType]);

// Compile and update preview
  useEffect(() => {
    try {
      setError(null);
      
      // Check if the code contains helper functions outside the main component
      const hasHelperFunctions = code.includes('function ') && 
        !code.includes('export default function') &&
        code.split('function ').length > 2;
      
      if (hasHelperFunctions) {
        // Wrap the entire code in a self-executing function
        const fullCode = `
          ${code}
          return WeatherDashlet;
        `;
        
        // Get the component function
        const componentFunc = new Function('React', fullCode)(React);
        setPreviewComponent(() => componentFunc);
      } else {
        // Original approach for simple components
        let functionBody = code;
        
        // Handle different function export patterns
        if (code.includes('export default function')) {
          functionBody = code.replace('export default function', 'function');
        } else if (code.includes('export function')) {
          functionBody = code.replace('export function', 'function');
        } else if (code.includes('export const') && code.includes('=') && code.includes('=>')) {
          functionBody = code.replace('export const', 'const');
        }
        
        // Extract the function name if available
        const functionMatch = functionBody.match(/function\s+([^\s(]+)/);
        const functionName = functionMatch ? functionMatch[1] : 'AnonymousComponent';
        
        // Create a self-executing function that returns the component
        const fullCode = `
          ${functionBody}
          return ${functionName};
        `;
        
        // Get the component function
        const componentFunc = new Function('React', fullCode)(React);
        setPreviewComponent(() => componentFunc);
      }
    } catch (err) {
      // Handle the 'unknown' error type
      const errorMessage = err instanceof Error ? err.message : 'Unknown compilation error';
      setError(`Compilation error: ${errorMessage}`);
      
      // Log the full error for debugging
      console.error('Compilation error details:', err);
    }
  }, [code]);

const handleSave = () => {
    if (!dashletName.trim()) {
      setError('Please provide a name for your dashlet');
      return;
    }

    if (error) {
      setError('Please fix compilation errors before saving');
      return;
    }

    try {
      // Register the dashlet
      const dashletId = `${dashletType}-${dashletName.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Ensure the code uses the correct function name
      let cleanedCode = code;
      if (!cleanedCode.includes('function DashletComponent')) {
        // If the code doesn't use the expected function name, modify it
        cleanedCode = code.replace(/export\s+default\s+function\s+(\w+)/, 'function DashletComponent');
      }
      dashletRegistry.register({
        id: dashletId,
        name: dashletName,
        type: dashletType as 'xi' | 'nna' | 'ls',
        code: cleanedCode,
        defaultSize: { w: 4, h: 2 }
      });
      
      // Update saved dashlets list
      const newSavedDashlets = [...savedDashlets, dashletName];
      setSavedDashlets(newSavedDashlets);
      
      setError(null);
      alert('Dashlet saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to save dashlet: ${errorMessage}`);
    }
  };

  const PreviewComponent = previewComponent;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="header">
        <h1>Dashlet Creator</h1>
        <p className="small">Create custom dashlets for your Nagios products</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editor Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Dashlet Code</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Dashlet Name</label>
                <input
                  type="text"
                  value={dashletName}
                  onChange={(e) => setDashletName(e.target.value)}
                  className="w-full p-2 border border-border rounded"
                  placeholder="Enter dashlet name"
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">Dashlet Type</label>
                <select
                  value={dashletType}
                  onChange={(e) => setDashletType(e.target.value)}
                  className="w-full p-2 border border-border rounded"
                >
                  <option value="xi">Nagios XI</option>
                  <option value="logserver">Log Server</option>
                  <option value="nna">Network Analyzer</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-2 font-medium">Code Editor</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-96 p-3 font-mono text-sm border border-border rounded"
                  spellCheck="false"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-error/20 border border-error/50 text-error rounded">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={!!error}
              >
                Save Dashlet
              </button>
            </div>
          </div>
          
          {/* Preview Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
            
            <div className="preview-area border border-border rounded p-4 min-h-[400px]">
              {PreviewComponent ? (
                <PreviewComponent data={MOCK_DATA[dashletType as keyof typeof MOCK_DATA]} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted">
                  {error ? 'Error in code' : 'Preview will appear here'}
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Saved Dashlets</h3>
              {savedDashlets.length > 0 ? (
                <ul className="list-disc list-inside">
                  {savedDashlets.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No dashlets saved yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Dashlet Creation Guide</h2>
        
        <div className="prose max-w-none">
          <h3>Creating Custom Dashlets</h3>
          <p>
            Create custom dashlets for your Nagios products using React components. 
            Your dashlet will receive data props specific to the dashlet type.
          </p>
          
          <h4>Available Props by Type</h4>
          <ul>
            <li><strong>Nagios XI:</strong> hostsUp, servicesOk, hostsDown, servicesCritical, etc.</li>
            <li><strong>Log Server:</strong> totalLogs, criticalAlerts, warningAlerts, logSources, etc.</li>
            <li><strong>Network Analyzer:</strong> bandwidthUsage, activeFlows, packetRate, topProtocols, etc.</li>
          </ul>
          
          <h4>Example Usage</h4>
          <pre className="bg-gray-100 p-3 rounded">
{`// Access data props in your component
export default function MyDashlet({ data }) {
  return (
    <div className="card">
      <h3>Custom Dashlet</h3>
      <p>Hosts Up: {data.hostsUp}</p>
    </div>
  );
}`}
          </pre>

          <h4>Troubleshooting</h4>
          <p>If your dashlet works in the main app but not in the creator, try:</p>
          <ol className="list-decimal list-inside">
            <li>Make sure your component uses the <code>export default</code> syntax</li>
            <li>Ensure your component is a function that returns JSX</li>
            <li>Check that you're not using TypeScript-specific syntax</li>
            <li>Verify all imports are included in the component code</li>
          </ol>
        </div>
      </div>
    </div>
  );
}