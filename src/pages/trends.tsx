import { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";

interface TrendPoint {
  time: string;
  ok: number;
  warning: number;
  critical: number;
}

export default function Trends() {
  const { authenticatedInstances } = useAuth();
  const [data, setData] = useState<TrendPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch state counts from Nagios XI API
  const fetchServiceStates = async () => {
    try {
      // Example API call - adjust to your actual Nagios XI endpoint
      const response = await fetch(`/nagios-api/servicesummary`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("credentials_token")}`,
        },
      });
      const result = await response.json();

      // Map API response to counts
      const ok = result.services.ok || 0;
      const warning = result.services.warning || 0;
      const critical = result.services.critical || 0;

      const newPoint: TrendPoint = {
        time: new Date().toLocaleTimeString(),
        ok,
        warning,
        critical,
      };

      setData(prev => [...prev.slice(-20), newPoint]); // keep last 20 points
    } catch (err) {
      console.error("Failed to fetch service states:", err);
    }
  };

  useEffect(() => {
    // Initial load
    fetchServiceStates();

    // Refresh every 30s (or faster if needed)
    intervalRef.current = setInterval(fetchServiceStates, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authenticatedInstances]);

  return (
    <div className="trends-page">
      <h2>Service State Trends</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="ok" stroke="#4caf50" strokeWidth={2} name="OK" />
          <Line type="monotone" dataKey="warning" stroke="#ff9800" strokeWidth={2} name="Warning" />
          <Line type="monotone" dataKey="critical" stroke="#f44336" strokeWidth={2} name="Critical" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
