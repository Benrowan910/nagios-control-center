export default function NetworkAnalyzerDashboard() {
  return (
    <div>
      <div className="header">
        <div>
          <h1>Network Analyzer Dashboard</h1>
          <p className="small">
            Monitor network traffic and performance
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Network Overview</h2>
        <p>Network Analyzer functionality will be implemented here.</p>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-label">Bandwidth Usage</div>
            <div className="metric-value">0 Mbps</div>
            <div className="metric-bar">
              <div className="metric-bar-fill" style={{ width: '0%', backgroundColor: 'rgb(var(--color-primary))' }}></div>
            </div>
            <div className="metric-description">Current utilization</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Packets/Sec</div>
            <div className="metric-value">0</div>
            <div className="metric-bar">
              <div className="metric-bar-fill" style={{ width: '0%', backgroundColor: 'rgb(var(--color-secondary))' }}></div>
            </div>
            <div className="metric-description">Network traffic</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Active Connections</div>
            <div className="metric-value">0</div>
            <div className="metric-description">Current TCP connections</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Top Protocols</div>
            <div className="metric-value">HTTP: 0%</div>
            <div className="metric-description">HTTPS: 0%, DNS: 0%</div>
          </div>
        </div>
      </div>
    </div>
  );
}