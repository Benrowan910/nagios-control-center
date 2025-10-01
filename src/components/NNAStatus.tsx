import { useState, useEffect } from "react";
import { NInstance } from "../api/instances";
import { NagiosNNAService, NNAStatusI } from "../services/nagiosNNAService";

interface NNAStatusProps {
  instance: NInstance;
}

export default function NNAStatus({ instance }: NNAStatusProps) {
  const [status, setStatus] = useState<NNAStatusI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const statusData = await NagiosNNAService.getNNAStatus(instance);
        setStatus(statusData);
        setError(null);
      } catch (err) {
        setError("Failed to fetch NNA status");
        console.error("Error fetching NNA status:", err);
      } finally {
        setLoading(false);
      }
    };

    if (instance.authenticated) {
      fetchStatus();
    }
  }, [instance]);

  if (loading) {
    return <div className="loading">Loading NNA status...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!status) {
    return null;
  }

  return (
    <div className="nna-status">
      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-label">Bandwidth Usage</div>
          <div className="metric-value">{status.usedBandwidth} / {status.totalBandwidth} Mbps</div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill" 
              style={{ 
                width: `${(status.usedBandwidth / status.totalBandwidth) * 100}%`, 
                backgroundColor: 'rgb(var(--color-primary))' 
              }}
            ></div>
          </div>
          <div className="metric-description">
            {((status.usedBandwidth / status.totalBandwidth) * 100).toFixed(1)}% utilization
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Packets/Sec</div>
          <div className="metric-value">{status.packetRate}</div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill" 
              style={{ 
                width: `${Math.min(status.packetRate / 10000 * 100, 100)}%`, 
                backgroundColor: 'rgb(var(--color-secondary))' 
              }}
            ></div>
          </div>
          <div className="metric-description">Current packet rate</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Active Flows</div>
          <div className="metric-value">{status.activeFlows}</div>
          <div className="metric-description">Current active network flows</div>
        </div>
      </div>
      <div className="mt-4">
        <h4>Top Protocols</h4>
        <ul>
          {status.topProtocols.map((proto, index) => (
            <li key={index} className="flex justify-between">
              <span>{proto.protocol}</span>
              <span>{proto.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}