import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { XIInstance } from "../api/instances";
import type { ServiceStatus } from "../services/nagiosXiService";
import { NagiosXIService } from "../services/nagiosXiService";
import { PieChart, Pie, Cell, Tooltip, Legend, LabelList, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import { useInstances } from "../context/InstanceContext";
import { useTheme } from "../context/ThemeContext";

type ServiceState = 0 | 1 | 2 | 3; // 0 OK, 1 WARNING, 2 CRITICAL, 3 UNKNOWN
const STATE_LABEL: Record<ServiceState, string> = { 0: "OK", 1: "WARNING", 2: "CRITICAL", 3: "UNKNOWN" };

function isXIInstance(x: any): x is XIInstance {
  return x && typeof x === "object" && typeof x.url === "string" && typeof x.apiKey === "string";
}

interface Props {
  instance?: XIInstance;
}

const LS_SELECTED = "serviceHealth:selectedKey";
const LS_REFRESH = "serviceHealth:refreshMs";

// --- Normalizers & utils ---
function normalizeService(item: any) {
  const state =
    item.current_state ??
    item.service_current_state ??
    item.status?.current_state ??
    item.status?.service_current_state ??
    3;

  const host =
    item.host_name ??
    item.host ??
    item.status?.host_name ??
    item.status?.host ??
    "";

  const svc =
    item.service_description ??
    item.description ??
    item.status?.service_description ??
    item.status?.description ??
    "";

  const out =
    item.plugin_output ??
    item.output ??
    item.status?.plugin_output ??
    item.status?.output ??
    "";

  const lastRaw =
    item.last_check ??
    item.last_check_time ??
    item.status?.last_check ??
    item.status?.last_check_time ??
    0;

  let last_check: string | number = lastRaw;
  if (Number.isFinite(Number(lastRaw)) && Number(lastRaw) > 0) {
    let ms = Number(lastRaw);
    if (ms < 1e12) ms *= 1000; // seconds -> ms
    last_check = new Date(ms).toISOString();
  }

  return {
    ...item,
    current_state: Number(state),
    host_name: host,
    service_description: svc,
    plugin_output: out,
    last_check,
  } as ServiceStatus & {
    current_state: number | ServiceState;
    host_name: string;
    service_description: string;
    plugin_output: string;
    last_check: string | number;
  };
}

const fmtDate = (v: string | number) => {
  if (typeof v === "number") {
    const ms = v > 1e12 ? v : v * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  }
  const n = Number(v);
  if (Number.isFinite(n) && n > 0) {
    const ms = n > 1e12 ? n : n * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? v : d.toLocaleString();
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
};

export default function ServiceHealth({ instance: forcedInstance }: Props) {
  const { theme } = useTheme();
  const { authenticatedInstances } = useAuth();
  const { getInstanceById, getInstanceByUrl } = useInstances();

  const COLORS: Record<ServiceState, string> = useMemo(
    () => ({
      0: `rgb(${theme.success})`,
      1: `rgb(${theme.warning})`,
      2: `rgb(${theme.error})`,
      3: `rgb(${theme.secondary})`,
    }),
    [theme.success, theme.warning, theme.error, theme.secondary]
  );

  // Resolve authenticated entries to full XIInstance objects
  const authInstances: XIInstance[] = useMemo(() => {
    const resolved: XIInstance[] = [];
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

  // Persisted selection + refresh controls
  const initialSelected =
    forcedInstance ? String(forcedInstance.id ?? forcedInstance.url) : localStorage.getItem(LS_SELECTED) ?? "all";
  const [selectedKey, setSelectedKey] = useState<string>(initialSelected);
  const [refreshMs, setRefreshMs] = useState<number>(() => Number(localStorage.getItem(LS_REFRESH) ?? 60000));
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    if (!forcedInstance) localStorage.setItem(LS_SELECTED, selectedKey);
  }, [selectedKey, forcedInstance]);
  useEffect(() => localStorage.setItem(LS_REFRESH, String(refreshMs)), [refreshMs]);

  const instances: XIInstance[] = useMemo(
    () => (forcedInstance ? [forcedInstance] : authInstances),
    [forcedInstance, authInstances]
  );

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

  useEffect(() => {
    if (!autoRefresh || refreshMs <= 0) return;
    const id = setInterval(() => setTick((t) => t + 1), refreshMs);
    return () => clearInterval(id);
  }, [autoRefresh, refreshMs]);

  // Data
  const [servicesByInstance, setServicesByInstance] = useState<Record<string, ServiceStatus[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (instances.length === 0) return;
    const ac = new AbortController();
    try {
      setLoading(true);
      setError(null);

      if (selectedKey === "all" && !forcedInstance) {
        const results = await Promise.allSettled(
          instances.map(async (inst) => {
            const data = await NagiosXIService.getServiceStatus(inst, { signal: ac.signal });
            const arr = Array.isArray(data) ? data.map(normalizeService) : [];
            return [String(inst.id ?? inst.url), arr] as const;
          })
        );
        const next: Record<string, ServiceStatus[]> = {};
        for (const r of results) if (r.status === "fulfilled") next[r.value[0]] = r.value[1];
        setServicesByInstance(next);
      } else {
        const target =
          forcedInstance ?? instances.find((i) => String(i.id ?? i.url) === selectedKey) ?? instances[0];
        if (!target) throw new Error("No instance selected");
        const data = await NagiosXIService.getServiceStatus(target, { signal: ac.signal });
        setServicesByInstance({
          [String(target.id ?? target.url)]: Array.isArray(data) ? data.map(normalizeService) : [],
        });
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message ?? "Failed to fetch service data");
    } finally {
      setLoading(false);
      ac.abort();
    }
  }, [instances, selectedKey, forcedInstance]);

  useEffect(() => {
    fetchData();
  }, [fetchData, tick]);

  // Aggregate
  type Counts = Record<ServiceState, number>;
  const { total, pieData, title, perInstance } = useMemo(() => {
    const base: Counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
    let ttl = 0;
    const selectedInstances =
      forcedInstance ? [forcedInstance] : selectedKey === "all" ? instances : instances.filter((i) => String(i.id ?? i.url) === selectedKey);
    const perInst: Record<string, { name: string; counts: Counts; total: number }> = {};

    for (const inst of selectedInstances) {
      const key = String(inst.id ?? inst.url);
      const arr = servicesByInstance[key] ?? [];
      ttl += arr.length;
      const local: Counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
      for (const svc of arr) {
        const st = Number((svc as any).current_state) as ServiceState;
        if (st === 0 || st === 1 || st === 2 || st === 3) {
          base[st] += 1;
          local[st] += 1;
        } else {
          base[3] += 1;
          local[3] += 1;
        }
      }
      perInst[key] = { name: inst.name ?? key, counts: local, total: arr.length };
    }

    // IMPORTANT: coerce key strings -> numbers so pieData.state is numeric
    const data = (Object.keys(base) as string[]).map((kStr) => {
      const k = Number(kStr) as ServiceState;
      const value = base[k];
      const pct = ttl > 0 ? Math.round((value / ttl) * 100) : 0;
      return {
        name: STATE_LABEL[k],
        value,
        pct,
        state: k, // numeric
        label: value > 0 ? `${STATE_LABEL[k]} ${pct}%` : "",
      };
    });

    const t = forcedInstance
      ? forcedInstance.name ?? "XI"
      : selectedKey === "all"
      ? `All XIs (${instances.length})`
      : selectedInstances[0]?.name ?? "XI";

    return { total: ttl, pieData: data, title: t, perInstance: perInst };
  }, [servicesByInstance, instances, selectedKey, forcedInstance]);

  // Slice filtering
  const [activeFilter, setActiveFilter] = useState<ServiceState | null>(null);
  const toggleFilter = (state: ServiceState) => setActiveFilter((prev) => (prev === state ? null : state));

  const filteredRows: ServiceStatus[] = useMemo(() => {
    const selectedInstances =
      forcedInstance ? [forcedInstance] : selectedKey === "all" ? instances : instances.filter((i) => String(i.id ?? i.url) === selectedKey);
    const rows: ServiceStatus[] = [];
    for (const inst of selectedInstances) {
      const key = String(inst.id ?? inst.url);
      const arr = servicesByInstance[key] ?? [];
      for (const s of arr) {
        const st = Number((s as any).current_state) as ServiceState;
        if (activeFilter == null || st === activeFilter) rows.push(s);
      }
    }
    return rows;
  }, [servicesByInstance, instances, selectedKey, forcedInstance, activeFilter]);

  const perInstanceRows = useMemo(() => {
    if (forcedInstance || selectedKey !== "all") return [];
    return Object.entries(perInstance).map(([key, v]) => ({
      key,
      name: v.name,
      total: v.total,
      ok: v.counts[0],
      warn: v.counts[1],
      crit: v.counts[2],
      unk: v.counts[3],
    }));
  }, [perInstance, forcedInstance, selectedKey]);

  const showSelector = !forcedInstance;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Top bar: Title + Controls in one row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{title} – Service Health</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {showSelector && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Instance</label>
              <select
                className="rounded-md border border-slate-300 bg-white !text-black px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ color: "#000", backgroundColor: "#fff" }}
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                disabled={instances.length === 0}
              >
                <option className="text-black" value="all">
                  All XIs
                </option>
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

          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Every</label>
            <select
              className="rounded-md border border-slate-300 bg-white !text-black px-2 py-1 text-sm"
              style={{ color: "#000", backgroundColor: "#fff" }}
              value={String(refreshMs)}
              onChange={(e) => setRefreshMs(Number(e.target.value))}
              disabled={!autoRefresh}
            >
              <option value="15000">15s</option>
              <option value="30000">30s</option>
              <option value="60000">60s</option>
              <option value="120000">2m</option>
              <option value="300000">5m</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={() => setTick((t) => t + 1)} title="Refresh now">
            Refresh
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-400 mt-1">Total services: {total}</div>

      {/* Main grid (BIG chart) */}
      {!loading && !error && total > 0 && (
        <div className="mt-4">
          <div className="rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Overall Service Status</div>
              <div className="text-xs text-gray-500">
                {activeFilter == null ? "Click a slice to drill down" : `Filtered: ${STATE_LABEL[activeFilter]}`}
                {activeFilter != null && (
                  <button className="ml-3 underline" onClick={() => setActiveFilter(null)}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="w-full" style={{ height: 460 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={120}
                    outerRadius={170}
                    paddingAngle={2}
                    stroke="#0f172a"
                    labelLine
                    onClick={(_, idx) => {
                      const entry = pieData[idx];
                      if (!entry || entry.value === 0) return; // ignore empty slices
                      const st = Number(entry.state) as ServiceState; // ensure numeric
                      toggleFilter(st);
                    }}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[entry.state as ServiceState]} cursor="pointer" />
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
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="mt-6 animate-pulse text-gray-600">Loading…</div>}
      {!loading && error && (
        <div className="mt-6 rounded-2xl border p-4 shadow-sm border-red-300 bg-red-50 text-red-800">{error}</div>
      )}

      {/* Per-instance table (All XIs only) */}
      {perInstanceRows.length > 0 && (
        <div className="mt-6 rounded-2xl border p-5 shadow-sm">
          <div className="text-sm font-semibold mb-3">Per-instance Breakdown</div>
          <div className="overflow-auto">
            <table className="min-w-[720px] w-full text-sm table-fixed">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-2 px-4 text-center w-1/4">Instance</th>
                  <th className="py-2 px-4 text-center w-1/8">Total</th>
                  <th className="py-2 px-4 text-center w-1/8">OK</th>
                  <th className="py-2 px-4 text-center w-1/8">WARNING</th>
                  <th className="py-2 px-4 text-center w-1/8">CRITICAL</th>
                  <th className="py-2 px-4 text-center w-1/8">UNKNOWN</th>
                </tr>
              </thead>
              <tbody>
                {perInstanceRows.map((r) => (
                  <tr key={r.key} className="border-t border-slate-200/30">
                    <td className="py-2 px-4 text-center">{r.name}</td>
                    <td className="py-2 px-4 tabular-nums text-center">{r.total}</td>
                    <td className="py-2 px-4 tabular-nums text-center" style={{ color: COLORS[0] }}>
                      {r.ok}
                    </td>
                    <td className="py-2 px-4 tabular-nums text-center" style={{ color: COLORS[1] }}>
                      {r.warn}
                    </td>
                    <td className="py-2 px-4 tabular-nums text-center" style={{ color: COLORS[2] }}>
                      {r.crit}
                    </td>
                    <td className="py-2 px-4 tabular-nums text-center" style={{ color: COLORS[3] }}>
                      {r.unk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drilldown table */}
      {!loading && !error && total > 0 && (
        <div className="mt-6 rounded-2xl border p-5 shadow-sm">
          <div className="text-sm font-semibold mb-3">
            {activeFilter == null ? "All Services" : `Services – ${STATE_LABEL[activeFilter]}`}
          </div>
          <div className="overflow-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Host</th>
                  <th className="py-2 pr-4">Service</th>
                  <th className="py-2 pr-4">State</th>
                  <th className="py-2 pr-4">Output</th>
                  <th className="py-2 pr-4">Last Check</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((s, idx) => {
                  const st = Number((s as any).current_state) as ServiceState;
                  return (
                    <tr key={`${(s as any).host_name}-${(s as any).service_description}-${idx}`} className="border-t border-slate-200/30">
                      <td className="py-2 pr-4">{(s as any).host_name}</td>
                      <td className="py-2 pr-4">{(s as any).service_description}</td>
                      <td className="py-2 pr-4" style={{ color: COLORS[st] }}>
                        {STATE_LABEL[st]}
                      </td>
                      <td className="py-2 pr-4">{(s as any).plugin_output}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{fmtDate((s as any).last_check)}</td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={5}>
                      No rows for the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
