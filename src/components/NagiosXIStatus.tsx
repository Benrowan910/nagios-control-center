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
  const [systemInfoLoading, setSystemInfoLoading] = useState(true);
  const [hostStatusLoading, setHostStatusLoading] = useState(true);
  const [serviceStatusLoading, setServiceStatusLoading] = useState(true);
  const [systemInfoError, setSystemInfoError] = useState<string | null>(null);
  const [hostStatusError, setHostStatusError] = useState<string | null>(null);
  const [serviceStatusError, setServiceStatusError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        setSystemInfoLoading(true);
        const info = await NagiosXIService.getSystemInfo(instance);
        setSystemInfo(info);
        setSystemInfoError(null);
      } catch (err) {
        setSystemInfoError("Failed to fetch system info");
        console.error("Error fetching system info:", err);
      } finally {
        setSystemInfoLoading(false);
      }
    };

    if (instance.authenticated) {
      fetchSystemInfo();
    }
  }, [instance]);

  useEffect(() => {
    const fetchHostStatus = async () => {
      try {
        setHostStatusLoading(true);
        const hosts = await NagiosXIService.getHostStatus(instance);
        setHostStatus(hosts);
        setHostStatusError(null);
      } catch (err) {
        setHostStatusError("Failed to fetch host status");
        console.error("Error fetching host status:", err);
      } finally {
        setHostStatusLoading(false);
      }
    };

    if (instance.authenticated) {
      fetchHostStatus();
      
      // Set up polling for real-time updates
      const interval = setInterval(fetchHostStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [instance]);

  // Add this to your NagiosXIStatus component to debug what's happening
useEffect(() => {
  console.log('System Info:', systemInfo);
  console.log('Host Status:', hostStatus);
  console.log('Service Status:', serviceStatus);
  console.log('Instance:', instance);
}, [systemInfo, hostStatus, serviceStatus, instance]);

  useEffect(() => {
    const fetchServiceStatus = async () => {
      try {
        setServiceStatusLoading(true);
        const services = await NagiosXIService.getServiceStatus(instance);
        setServiceStatus(services);
        setServiceStatusError(null);
      } catch (err) {
        setServiceStatusError("Failed to fetch service status");
        console.error("Error fetching service status:", err);
      } finally {
        setServiceStatusLoading(false);
      }
    };

    if (instance.authenticated) {
      fetchServiceStatus();
      
      // Set up polling for real-time updates
      const interval = setInterval(fetchServiceStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [instance]);

  // Calculate status counts
  const hostStatusCounts = {
    up: hostStatus.filter(h => h.current_state === '0').length,
    down: hostStatus.filter(h => h.current_state === '1').length,
    unreachable: hostStatus.filter(h => h.current_state === '2').length
  };

  const serviceStatusCounts = {
    ok: serviceStatus.filter(s => s.current_state === 0 || s.current_state === 0).length,
    warning: serviceStatus.filter(s => s.current_state === 1 || s.current_state === 0).length,
    critical: serviceStatus.filter(s => s.current_state === 2 || s.current_state === 0).length,
    unknown: serviceStatus.filter(s => s.current_state === 3 || s.current_state === 0).length
  };

  return (
    <div className="nagios-status">
      {/* System Info Section */}
      <div className="system-info mb-4">
        {systemInfoLoading ? (
          <div className="loading small">Loading system info...</div>
        ) : systemInfoError ? (
          <div className="error small">{systemInfoError}</div>
        ) : systemInfo ? (
          <div className="small">
            <strong>{systemInfo.product} {systemInfo.version}</strong> | 
            Hosts: {systemInfo.hosts_total} | 
            Services: {systemInfo.services_total}
          </div>
        ) : null}
      </div>
      
      {/* Status Grid Section */}
      <div className="status-grid mb-4">
        {/* Host Status */}
        <div className="status-item">
          <div className="label">Hosts Up</div>
          {hostStatusLoading ? (
            <div className="value loading">...</div>
          ) : hostStatusError ? (
            <div className="value error">Error</div>
          ) : (
            <div className="value OK">{hostStatusCounts.up}</div>
          )}
        </div>
        
        <div className="status-item">
          <div className="label">Hosts Down</div>
          {hostStatusLoading ? (
            <div className="value loading">...</div>
          ) : hostStatusError ? (
            <div className="value error">Error</div>
          ) : (
            <div className="value CRITICAL">{hostStatusCounts.down}</div>
          )}
        </div>
        
        <div className="status-item">
          <div className="label">Hosts Unreachable</div>
          {hostStatusLoading ? (
            <div className="value loading">...</div>
          ) : hostStatusError ? (
            <div className="value error">Error</div>
          ) : (
            <div className="value UNKNOWN">{hostStatusCounts.unreachable}</div>
          )}
        </div>
        
        {/* Service Status */}
        <div className="status-item">
          <div className="label">Services OK</div>
          {serviceStatusLoading ? (
            <div className="value loading">...</div>
          ) : serviceStatusError ? (
            <div className="value error">Error</div>
          ) : (
            <div className="value OK">{serviceStatusCounts.ok}</div>
          )}
        </div>
        
        <div className="status-item">
          <div className="label">Services Warn</div>
          {serviceStatusLoading ? (
            <div className="value loading">...</div>
          ) : serviceStatusError ? (
            <div className="value error">Error</div>
          ) : (
            <div className="value WARNING">{serviceStatusCounts.warning}</div>
          )}
        </div>
        
        <div className="status-item">
          <div className="label">Services Crit</div>
          {serviceStatusLoading ? (
            <div className="value loading">...</div>
          ) : serviceStatusError ? (
            <div className="value error">Error</div>
          ) : (
            <div className="value CRITICAL">{serviceStatusCounts.critical}</div>
          )}
        </div>
        
        <div className="status-item">
          <div className="label">Services Unk</div>
          {serviceStatusLoading ? (
            <div className="value loading">...</div>
          ) : serviceStatusError ? (
            <div className="value error">Error</div>
          ) : (
            <div className="value UNKNOWN">{serviceStatusCounts.unknown}</div>
          )}
        </div>
      </div>
    </div>
  );
}