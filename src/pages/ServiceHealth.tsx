import React, { useEffect, useMemo, useState } from "react";
import type { NInstance } from "../api/instances";
import type { ServiceStatus } from "../services/nagiosXiService";
import { NagiosXIService } from "../services/nagiosXiService";
import { PieChart, Pie, Cell, Tooltip, Legend, LabelList } from "recharts";
import { useAuth } from "../context/AuthContext";
import { useInstances } from "../context/InstanceContext";

type ServiceState = 0 | 1 | 2 | 3; // 0 OK, 1 WARN, 2 CRIT, 3 UNK

const STATE_LABEL: Record<ServiceState, string> = {
  0: "OK",
  1: "WARNING",
  2: "CRITICAL",
  3: "UNKNOWN",
};

const COLORS: Record<ServiceState, string> = {
  0: "#22c55e", // green
  1: "#f59e0b", // amber
  2: "#ef4444", // red
  3: "#64748b", // gray
};

function isXIInstance(x: any): x is NInstance {
  return x && typeof x === "object" && typeof x.url === "string" && typeof x.apiKey === "string";
}

interface Props {
  /** Optional: if provided, locks the page to this XI and hides the dropdown */
  instance?: NInstance;
}

export default function ServiceHealth({ instance: forcedInstance }: Props) {
  const { authenticatedInstances } = useAuth();
  const { getInstanceById, getInstanceByUrl } = useInstances();

  // Resolve authenticated entries to full XIInstance objects
  const authInstances: NInstance[] = useMemo(() => {
    const resolved: NInstance[] = [];
    for (const item of authenticatedInstances ?? []) {
      if (isXIInstance(item)) resolved.push(item);
      else if (typeof item === "string") {
        const found = getInstanceById(item) ?? getInstanceByUrl(item);
        if (found) resolved.push(found);
      }
    }
    const seen = new Set<string>();
    return resolved.filter((i) => {
      const key = String(i.id ?? i.url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [authenticatedInstances, getInstanceById, getInstanceByUrl]);

  const [selectedKey, setSelectedKey] = useState<string>(
    forcedInstance ? String(forcedInstance.id ?? forcedInstance.url) : "all"
  );

  // Map of instanceKey -> services
  const [servicesByInstance, setServicesByInstance] = useState<Record<string, ServiceStatus[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instances: NInstance[] = useMemo(
    () => (forcedInstance ? [forcedInstance] : authInstances),
    [forcedInstance, authInstances]
  );

  // Keep selectedKey valid
  useEffect(() => {
    if (forcedInstance) {
      const key = String(forcedInstance.id ?? forcedInstance.url);
      setSelectedKey(key);
      return;
    }
    if (instances.length === 0) {
      setSelectedKey("all");
      return;
    }
    if (selectedKey !== "all" && !instances.find((i) => String(i.id ?? i.url) === selectedKey)) {
      setSelectedKey("all");
    }
  }, [forcedInstance, instances, selectedKey]);

  // Fetch service status for selection
  useEffect(() => {
    if (instances.length === 0) return;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (selectedKey === "all" && !forcedInstance) {
          const results = await Promise.allSettled(
            instances.map(async (inst) => {
              const data = await NagiosXIService.getServiceStatus(inst);
              return [String(inst.id ?? inst.url), Array.isArray(data) ? data : []] as const;
            })
          );
          const next: Record<string, ServiceStatus[]> = {};
          for (const r of results) {
            if (r.status === "fulfilled") {
              const [k, arr] = r.value;
              next[k] = arr;
            }
          }
          setServicesByInstance(next);
        } else {
          const target =
            forcedInstance ??
            instances.find((i) => String(i.id ?? i.url) === selectedKey) ??
            instances[0];
          if (!target) throw new Error("No instance selected");
          const data = await NagiosXIService.getServiceStatus(target);
          setServicesByInstance({ [String(target.id ?? target.url)]: Array.isArray(data) ? data : [] });
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Failed to fetch service data");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [instances, selectedKey, forcedInstance]);

  // Aggregate counts
  const { total, counts, pieData, title } = useMemo(() => {
    const base: Record<ServiceState, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    let ttl = 0;

    const selectedInstances =
      forcedInstance
        ? [forcedInstance]
        : selectedKey === "all"
          ? instances
          : instances.filter((i) => String(i.id ?? i.url) === selectedKey);

    for (const inst of selectedInstances) {
      const key = String(inst.id ?? inst.url);
      const arr = servicesByInstance[key] ?? [];
      ttl += arr.length;
      for (const s of arr) {
        const st = Number((s as any).current_state) as ServiceState;
        if (st === 0 || st === 1 || st === 2 || st === 3) base[st] += 1;
        else base[3] += 1;
      }
    }

    const data = (Object.keys(base) as unknown as ServiceState[]).map((k) => {
      const value = base[k];
      const pct = ttl > 0 ? Math.round((value / ttl) * 100) : 0;
      return {
        name: STATE_LABEL[k],
        value,
        pct,
        state: k,
        label: value > 0 ? `${STATE_LABEL[k]} ${pct}%` : "",
      };
    });

    const t = forcedInstance
      ? forcedInstance.name ?? "XI"
      : selectedKey === "all"
        ? `All XIs (${instances.length})`
        : (selectedInstances[0]?.name ?? "XI");

    return { total: ttl, counts: base, pieData: data, title: t };
  }, [servicesByInstance, instances, selectedKey, forcedInstance]);

  const showSelector = !forcedInstance;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{title} – Service Health</h1>
          <div className="text-sm text-gray-500">Total services: {total}</div>
        </div>

        {showSelector && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Instance:</label>
            <select
              className="rounded-md border border-slate-300 bg-white !text-black dark:bg-white dark:!text-black px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ color: "#000", backgroundColor: "#fff" }}
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              disabled={instances.length === 0}
            >
              <option className="text-black" value="all">All XIs</option>
              {instances.map((i) => {
                const key = String(i.id ?? i.url);
                return (
                  <option className="text-black" key={key} value={key}>
                    {i.name ?? key}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {loading && <div className="mt-6 animate-pulse text-gray-600">Loading…</div>}
      {!loading && error && (
        <div className="mt-6 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>
      )}

      {!loading && !error && total > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-6">
          {/* Pie chart */}
          <div className="col-span-1 md:col-span-2 rounded-2xl border p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Overall Service Status</div>
            <div className="border rounded-md" style={{ width: 560, height: 340, overflow: "hidden" }}>
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
                  stroke="#0f172a"
                  labelLine
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[entry.state as ServiceState]} />
                  ))}
                  <LabelList dataKey="label" position="outside" />
                </Pie>
                <Tooltip
                  formatter={(value: number | string, _name: string, info: any) => {
                    const pct = info?.payload?.pct ?? 0;
                    const nm = info?.payload?.name ?? _name;
                    return [`${value}`, `${nm} (${pct}%)`];
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </div>
          </div>

          {/* Breakdown */}
          <div className="col-span-1 rounded-2xl border p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Breakdown</div>
            <ul className="space-y-2">
              {(Object.keys(counts) as unknown as ServiceState[]).map((s) => (
                <li key={s} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[s] }} aria-hidden />
                    <span className="text-sm">{STATE_LABEL[s]}</span>
                  </div>
                  <span className="tabular-nums text-sm font-medium">{counts[s]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="mt-6 text-gray-600">No services found for selected scope.</div>
      )}
    </div>
  );
}
