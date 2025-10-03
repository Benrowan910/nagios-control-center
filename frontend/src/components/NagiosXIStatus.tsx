import { useState, useEffect } from "react";
import { NInstance } from "../api/instances";
import {
  NagiosXIService,
  HostStatus,
  ServiceStatus,
  SystemInfo,
} from "../services/nagiosXiService";

interface NagiosXIStatusProps {
  instance: NInstance;
}

interface HostWithServices {
  host: HostStatus;
  services: ServiceStatus[];
}

export default function NagiosXIStatus({ instance }: NagiosXIStatusProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [hostStatus, setHostStatus] = useState<HostStatus[]>([]);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus[]>([]);
  const [hostsWithServices, setHostsWithServices] = useState<
    HostWithServices[]
  >([]);
  const [systemInfoLoading, setSystemInfoLoading] = useState(true);
  const [hostStatusLoading, setHostStatusLoading] = useState(true);
  const [serviceStatusLoading, setServiceStatusLoading] = useState(true);
  const [systemInfoError, setSystemInfoError] = useState<string | null>(null);
  const [hostStatusError, setHostStatusError] = useState<string | null>(null);
  const [serviceStatusError, setServiceStatusError] = useState<string | null>(
    null,
  );
  const ac = new AbortController();

  const [expandedHosts, setExpandedHosts] = useState<Set<string>>(new Set());
  const [checkInProgress, setCheckInProgress] = useState<{
    [key: string]: boolean;
  }>({});

  // Group services by host
  useEffect(() => {
    if (hostStatus.length > 0 && serviceStatus.length > 0) {
      const grouped: HostWithServices[] = hostStatus.map((host) => ({
        host,
        services: serviceStatus.filter(
          (service) => service.host_name === host.host_name,
        ),
      }));
      setHostsWithServices(grouped);
    }
  }, [hostStatus, serviceStatus]);

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

  const fetchHostStatus = async () => {
    try {
      setHostStatusLoading(true);
      const hosts = await NagiosXIService.getHostStatus(instance, {signal: ac.signal});
      setHostStatus(hosts);
      setHostStatusError(null);
    } catch (err) {
      setHostStatusError("Failed to fetch host status");
      console.error("Error fetching host status:", err);
    } finally {
      setHostStatusLoading(false);
    }
  };

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

  useEffect(() => {
    if (instance.authenticated) {
      fetchHostStatus();

      // Set up polling for real-time updates
      const interval = setInterval(fetchHostStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [instance]);

  useEffect(() => {
    if (instance.authenticated) {
      fetchServiceStatus();

      // Set up polling for real-time updates
      const interval = setInterval(fetchServiceStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [instance]);

  const triggerHostCheck = async (hostName: string) => {
    const key = `host-${hostName}`;
    setCheckInProgress((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(
        `http://${instance.url}/nagiosxi/api/v1/system/massimmediatecheck?apikey=${instance.apiKey}&pretty=1`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `hosts[]=${encodeURIComponent(hostName)}`,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to trigger host check");
      }

      // Wait a moment for the check to complete, then refresh
      setTimeout(() => {
        fetchHostStatus();
        setCheckInProgress((prev) => ({ ...prev, [key]: false }));
      }, 3000);
    } catch (error) {
      console.error("Error triggering host check:", error);
      setCheckInProgress((prev) => ({ ...prev, [key]: false }));
    }
  };

  const triggerServiceCheck = async (
    hostName: string,
    serviceDescription: string,
  ) => {
    const key = `service-${hostName}-${serviceDescription}`;
    setCheckInProgress((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(
        `http://${instance.url}/nagiosxi/api/v1/system/massimmediatecheck?apikey=${instance.apiKey}&pretty=1`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `services[]=${encodeURIComponent(hostName + "!" + serviceDescription)}`,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to trigger service check");
      }

      // Wait a moment for the check to complete, then refresh
      setTimeout(() => {
        fetchServiceStatus();
        setCheckInProgress((prev) => ({ ...prev, [key]: false }));
      }, 3000);
    } catch (error) {
      console.error("Error triggering service check:", error);
      setCheckInProgress((prev) => ({ ...prev, [key]: false }));
    }
  };

  const toggleHostExpansion = (hostId: string) => {
    const newExpandedHosts = new Set(expandedHosts);
    if (newExpandedHosts.has(hostId)) {
      newExpandedHosts.delete(hostId);
    } else {
      newExpandedHosts.add(hostId);
    }
    setExpandedHosts(newExpandedHosts);
  };

  const getStatusBadge = (status: string | number) => {
    let statusClass = "";
    let statusText = "";

    if (typeof status === "string") {
      // Host status
      statusClass =
        status === "0" ? "OK" : status === "1" ? "CRITICAL" : "UNKNOWN";
      statusText =
        status === "0" ? "UP" : status === "1" ? "DOWN" : "UNREACHABLE";
    } else {
      // Service status
      statusClass =
        status === 0
          ? "OK"
          : status === 1
            ? "WARNING"
            : status === 2
              ? "CRITICAL"
              : "UNKNOWN";
      statusText =
        status === 0
          ? "OK"
          : status === 1
            ? "WARNING"
            : status === 2
              ? "CRITICAL"
              : "UNKNOWN";
    }

    return <span className={`badge ${statusClass}`}>{statusText}</span>;
  };

  // Calculate status counts
  const hostStatusCounts = {
    up: hostStatus.filter((h) => h.current_state === "0").length,
    down: hostStatus.filter((h) => h.current_state === "1").length,
    unreachable: hostStatus.filter((h) => h.current_state === "2").length,
  };

  const serviceStatusCounts = {
    ok: serviceStatus.filter((s) => s.current_state === "0").length,
    warning: serviceStatus.filter((s) => s.current_state === "1").length,
    critical: serviceStatus.filter((s) => s.current_state === "2").length,
    unknown: serviceStatus.filter((s) => s.current_state === "3").length,
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
            <strong>
              {systemInfo.product} {systemInfo.version}
            </strong>{" "}
            | Hosts: {systemInfo.hosts_total} | Services:{" "}
            {systemInfo.services_total}
          </div>
        ) : null}
      </div>

      {/* Status Summary Section */}
      <div className="status-grid mb-6">
        {/* Host Status Summary */}
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

        {/* Service Status Summary */}
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

      {/* Detailed Hosts and Services Section */}
      <div className="hosts-services-container">
        <h3 className="mb-4">Hosts and Services</h3>

        {hostStatusLoading || serviceStatusLoading ? (
          <div className="loading">Loading hosts and services...</div>
        ) : hostStatusError || serviceStatusError ? (
          <div className="error">{hostStatusError || serviceStatusError}</div>
        ) : hostsWithServices.length === 0 ? (
          <div className="empty-state">No hosts or services found</div>
        ) : (
          <div className="hosts-list">
            {hostsWithServices.map(({ host, services }) => {
              const hostCheckKey = `host-${host.host_name}`;
              const isHostCheckInProgress = checkInProgress[hostCheckKey];

              return (
                <div key={host.host_object_id} className="host-card">
                  <div
                    className="host-header"
                    onClick={() => toggleHostExpansion(host.host_object_id)}
                  >
                    <div className="host-name">
                      <span className="toggle-icon">
                        {expandedHosts.has(host.host_object_id) ? "▼" : "►"}
                      </span>
                      {host.host_name} ({host.address})
                    </div>
                    <div className="host-status">
                      {getStatusBadge(host.current_state)}
                      <span className="services-count">
                        {services.length} service
                        {services.length !== 1 ? "s" : ""}
                      </span>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHostCheck(host.host_name);
                        }}
                        disabled={isHostCheckInProgress}
                      >
                        {isHostCheckInProgress ? "Checking..." : "Check Host"}
                      </button>
                    </div>
                  </div>

                  {expandedHosts.has(host.host_object_id) && (
                    <div className="services-list">
                      {services.length === 0 ? (
                        <div className="empty-service">
                          No services found for this host
                        </div>
                      ) : (
                        services.map((service) => {
                          const serviceCheckKey = `service-${service.host_name}-${service.service_description}`;
                          const isServiceCheckInProgress =
                            checkInProgress[serviceCheckKey];

                          return (
                            <div
                              key={`${service.host_name}-${service.service_description}`}
                              className="service-item"
                            >
                              <div className="service-info">
                                <div className="service-name">
                                  {service.service_description}
                                </div>
                                <div className="service-status">
                                  {getStatusBadge(service.current_state)}
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() =>
                                      triggerServiceCheck(
                                        service.host_name,
                                        service.service_description,
                                      )
                                    }
                                    disabled={isServiceCheckInProgress}
                                  >
                                    {isServiceCheckInProgress
                                      ? "Checking..."
                                      : "Check Service"}
                                  </button>
                                </div>
                              </div>
                              <div className="service-output">
                                {service.plugin_output}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
