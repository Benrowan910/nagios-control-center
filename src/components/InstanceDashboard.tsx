import { useEffect, useState } from "react";
import type { XIInstance } from "../api/instances";
import { fetchHostStatus } from "../api/nagiosClient";

interface Props {
  instance: XIInstance;
}

export default function InstanceDashboard({ instance }: Props) {
  const [hosts, setHosts] = useState<any[]>([]);

  useEffect(() => {
    fetchHostStatus(instance).then((data) => setHosts(data.data ?? []));
  }, [instance]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">{instance.name}</h1>
      <h2 className="text-lg font-semibold mt-4">Hosts</h2>
      <ul className="mt-2 space-y-2">
        {hosts.map((h) => (
          <li key={h.attributes.host_name} className="p-2 border rounded-md flex justify-between">
            <span>{h.attributes.host_name}</span>
            <span>
              {h.attributes.current_state === 0 ? "✅ UP" : "❌ DOWN"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
