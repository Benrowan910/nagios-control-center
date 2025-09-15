import { useState, useEffect } from "react";
import { XIInstance } from "../api/instances";
import { NagiosXIService, HostStatus, ServiceStatus, SystemInfo } from "../services/nagiosXiService";

interface NagiosXIStatusProps {
  instance: XIInstance;
}

export default function NagiosXIStatus({ instance }: NagiosXIStatusProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [hostStatus, setHostStatus] = useState<HostStatus[]>([]);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [info, hosts, services] = await Promise.all([
          NagiosXIService.getSystemInfo(instance),
          NagiosXIService.getHostStatus(instance),
          NagiosXIService.getServiceStatus(instance)
        ]);
        
        setSystemInfo(info);
        setHostStatus(hosts);
        setServiceStatus(services);
        setError(null);
      } catch (err) {
        setError("Failed to fetch monitoring data");
        console.error("Error fetching Nagios XI data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (instance.authenticated) {
      fetchData();
      
      // Set up polling for real-time updates
      const interval = setInterval(fetchData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [instance]);

  if (loading) {
    return <div className="loading">Loading monitoring data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!systemInfo) {
    return null;
  }

  // Calculate status counts
  const hostStatusCounts = {
    up: hostStatus.filter(h => h.current_state === 0).length,
    down: hostStatus.filter(h => h.current_state === 1).length,
    unreachable: hostStatus.filter(h => h.current_state === 2).length
  };

  const serviceStatusCounts = {
    ok: serviceStatus.filter(s => s.current_state === 0).length,
    warning: serviceStatus.filter(s => s.current_state === 1).length,
    critical: serviceStatus.filter(s => s.current_state === 2).length,
    unknown: serviceStatus.filter(s => s.current_state === 3).length
  };

  return (
    <div className="nagios-status">
      <div className="system-info mb-4">
        <div className="small">
          <strong>{systemInfo.product} {systemInfo.version}</strong> | 
          Hosts: {systemInfo.hosts_total} | 
          Services: {systemInfo.services_total}
        </div>
      </div>
      
      <div className="status-grid mb-4">
        <div className="status-item">
          <div className="label">Hosts Up</div>
          <div className="value OK">{hostStatusCounts.up}</div>
        </div>
        <div className="status-item">
          <div className="label">Hosts Down</div>
          <div className="value CRITICAL">{hostStatusCounts.down}</div>
        </div>
        <div className="status-item">
          <div className="label">Services OK</div>
          <div className="value OK">{serviceStatusCounts.ok}</div>
        </div>
        <div className="status-item">
          <div className="label">Services Warn</div>
          <div className="value WARNING">{serviceStatusCounts.warning}</div>
        </div>
        <div className="status-item">
          <div className="label">Services Crit</div>
          <div className="value CRITICAL">{serviceStatusCounts.critical}</div>
        </div>
        <div className="status-item">
          <div className="label">Services Unk</div>
          <div className="value UNKNOWN">{serviceStatusCounts.unknown}</div>
        </div>
      </div>
    </div>
  );
}