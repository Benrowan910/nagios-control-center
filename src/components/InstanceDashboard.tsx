import { useEffect, useState } from "react";
import type { XIInstance } from "../api/instances";
import { NagiosXIService, HostStatus } from "../services/nagiosXiService";

interface Props {
  instance: XIInstance;
}

export default function InstanceDashboard({ instance }: Props) {
  const [hosts, setHosts] = useState<HostStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        setLoading(true);
        const hostData = await NagiosXIService.getHostStatus(instance);
        setHosts(hostData);
        setError(null);
      } catch (err) {
        setError("Failed to fetch host data");
        console.error("Error fetching host data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (instance.authenticated) {
      fetchHosts();
    }
  }, [instance]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{instance.name}</h1>
        <div className="loading">Loading host data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{instance.name}</h1>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">{instance.name}</h1>
      <h2 className="text-lg font-semibold mt-4">Hosts ({hosts.length})</h2>
      <ul className="mt-2 space-y-2">
        {hosts.map((host) => (
          <li key={host.host_object_id} className="p-2 border rounded-md flex justify-between">
            <span>{host.host_name}</span>
            <span>
              {host.current_state === "0" ? "✅ UP" : 
               host.current_state === "1" ? "❌ DOWN" : 
               host.current_state === "2" ? "🚫 UNREACHABLE" : "❓ UNKNOWN"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}