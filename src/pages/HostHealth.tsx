import React, { useEffect, useMemo, useState } from "react";
import type { XIInstance } from "../api/instances";
import type { HostStatus } from "../services/nagiosXiService";
import { NagiosXIService } from "../services/nagiosXiService";
import { PieChart, Pie, Cell, Tooltip, Legend, LabelList } from "recharts";

interface Props {
  instance: XIInstance;
}

type HostState = 0 | 1 | 2 | 3;

const STATE_LABEL: Record<HostState, string> = {
  0: "UP",
  1: "DOWN",
  2: "UNREACHABLE",
  3: "UNKNOWN",
};

const COLORS: Record<HostState, string> = {
  0: "#22c55e", // green
  1: "#ef4444", // red
  2: "#f59e0b", // amber
  3: "#64748b", // gray
};

export default function HostHealth({ instance }: Props) {
  const [hosts, setHosts] = useState<HostStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKey = useMemo(
    () =>
      `${instance?.id ?? instance?.name ?? instance?.url}|${String(
        instance?.apiKey ?? ""
      )}`,
    [instance?.id, instance?.name, instance?.url, instance?.apiKey]
  );

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await NagiosXIService.getHostStatus(instance, {
          signal: ac.signal,
        });
        setHosts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError(err?.message ?? "Failed to fetch host data");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [fetchKey, instance]);

  const counts = useMemo(() => {
    const base: Record<HostState, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const h of hosts) {
      const s = Number((h as any).current_state) as HostState;
      if (s === 0 || s === 1 || s === 2 || s === 3) base[s] += 1;
      else base[3] += 1;
    }
    return base;
  }, [hosts]);

  const total = hosts.length;

  // Build pie data; set label to "" for zero values so LabelList won't render it.
  const pieData = (Object.keys(counts) as unknown as HostState[]).map((k) => {
    const value = counts[k];
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return {
      name: STATE_LABEL[k],
      value,
      state: k,
      pct,
      label: value > 0 ? `${STATE_LABEL[k]} ${pct}%` : "",
    };
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {instance?.name ?? "XI – Host Health"}
        </h1>
        <div className="text-sm text-gray-500">Total hosts: {total}</div>
      </div>

      {loading && (
        <div className="mt-6 animate-pulse text-gray-600">
          Loading host health…
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-6">
          {/* Fixed-size chart to guarantee visibility */}
          <div className="col-span-1 md:col-span-2 rounded-2xl border p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Overall Status</div>
            <div
              className="border rounded-md"
              style={{ width: 560, height: 340, overflow: "hidden" }}
            >
              <PieChart width={560} height={340}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={90}
                  outerRadius={130}
                  paddingAngle={2}
                  stroke="#0f172a" // safe on dark backgrounds
                  labelLine
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[entry.state as HostState]} />
                  ))}
                  {/* Labels OUTSIDE to prevent overlap; empty labels for zero slices */}
                  <LabelList dataKey="label" position="outside" />
                </Pie>
                {/* TS-safe tooltip formatter */}
                <Tooltip
                  formatter={(value: number | string, _name: string, info: any) => {
                    const pct = info && info.payload ? info.payload.pct : 0;
                    const name = info && info.payload ? info.payload.name : _name;
                    return [`${value}`, `${name} (${pct}%)`];
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </div>
          </div>

          {/* Breakdown list */}
          <div className="col-span-1 rounded-2xl border p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Breakdown</div>
            <ul className="space-y-2">
              {(Object.keys(counts) as unknown as HostState[]).map((s) => (
                <li key={s} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[s] }}
                      aria-hidden
                    />
                    <span className="text-sm">{STATE_LABEL[s]}</span>
                  </div>
                  <span className="tabular-nums text-sm font-medium">
                    {counts[s]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="mt-6 text-gray-600">No hosts found for this instance.</div>
      )}
    </div>
  );
}
