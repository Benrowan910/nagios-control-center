import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { XIInstance } from "../api/instances";
import type { HostStatus } from "../services/nagiosXiService";
import { NagiosXIService } from "../services/nagiosXiService";
import { PieChart, Pie, Cell, Tooltip, Legend, LabelList, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import { useInstances } from "../context/InstanceContext";
import { useTheme } from "../context/ThemeContext";

type HostState = 0 | 1 | 2 | 3;
const STATE_LABEL: Record<HostState, string> = { 0: "UP", 1: "DOWN", 2: "UNREACHABLE", 3: "UNKNOWN" };

function isXIInstance(x: any): x is XIInstance {
  return x && typeof x === "object" && typeof x.url === "string" && typeof x.apiKey === "string";
}

interface Props {
  /** Optional: lock to one instance and hide the dropdown */
  instance?: XIInstance;
}

const LS_SELECTED = "hostHealth:selectedKey";
const LS_REFRESH = "hostHealth:refreshMs";

export default function HostHealth({ instance: forcedInstance }: Props) {
  const { theme } = useTheme();
  const { authenticatedInstances } = useAuth();
  const { getInstanceById, getInstanceByUrl } = useInstances();

  const COLORS: Record<HostState, string> = useMemo(
    () => ({
      0: `rgb(${theme.success})`,
      1: `rgb(${theme.error})`,
      2: `rgb(${theme.warning})`,
      3: `rgb(${theme.secondary})`,
    }),
    [theme.success, theme.error, theme.warning, theme.secondary]
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
  const [hostsByInstance, setHostsByInstance] = useState<Record<string, HostStatus[]>>({});
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
            const data = await NagiosXIService.getHostStatus(inst, { signal: ac.signal });
            return [String(inst.id ?? inst.url), Array.isArray(data) ? data : []] as const;
          })
        );
        const next: Record<string, HostStatus[]> = {};
        for (const r of results) if (r.status === "fulfilled") next[r.value[0]] = r.value[1];
        setHostsByInstance(next);
      } else {
        const target =
          forcedInstance ?? instances.find((i) => String(i.id ?? i.url) === selectedKey) ?? instances[0];
        if (!target) throw new Error("No instance selected");
        const data = await NagiosXIService.getHostStatus(target, { signal: ac.signal });
        setHostsByInstance({ [String(target.id ?? target.url)]: Array.isArray(data) ? data : [] });
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message ?? "Failed to fetch host data");
    } finally {
      setLoading(false);
      ac.abort();
    }
  }, [instances, selectedKey, forcedInstance]);

  useEffect(() => {
    fetchData();
  }, [fetchData, tick]);

  // Aggregate
  const { total, pieData, title, perInstance } = useMemo(() => {
    const base: Record<HostState, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    let ttl = 0;
    const selectedInstances =
      forcedInstance ? [forcedInstance] : selectedKey === "all" ? instances : instances.filter((i) => String(i.id ?? i.url) === selectedKey);
    const perInst: Record<string, { name: string; counts: Record<HostState, number>; total: number }> = {};

    for (const inst of selectedInstances) {
      const key = String(inst.id ?? inst.url);
      const arr = hostsByInstance[key] ?? [];
      ttl += arr.length;
      const local: Record<HostState, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

      for (const h of arr) {
        const s = Number((h as any).current_state) as HostState;
        if (s === 0 || s === 1 || s === 2 || s === 3) {
          base[s] += 1;
          local[s] += 1;
        } else {
          base[3] += 1;
          local[3] += 1;
        }
      }
      perInst[key] = { name: inst.name ?? key, counts: local, total: arr.length };
    }

    const data = (Object.keys(base) as unknown as HostState[]).map((k) => {
      const value = base[k];
      const pct = ttl > 0 ? Math.round((value / ttl) * 100) : 0;
      return { name: STATE_LABEL[k], value, pct, state: k, label: value > 0 ? `${STATE_LABEL[k]} ${pct}%` : "" };
    });

    const t = forcedInstance ? forcedInstance.name ?? "XI" : selectedKey === "all" ? `All XIs (${instances.length})` : selectedInstances[0]?.name ?? "XI";
    return { total: ttl, pieData: data, title: t, perInstance: perInst };
  }, [hostsByInstance, instances, selectedKey, forcedInstance]);

  // Slice filtering
  const [activeFilter, setActiveFilter] = useState<HostState | null>(null);
  const toggleFilter = (state: HostState) => setActiveFilter((prev) => (prev === state ? null : state));

  const filteredRows: HostStatus[] = useMemo(() => {
    const selectedInstances =
      forcedInstance ? [forcedInstance] : selectedKey === "all" ? instances : instances.filter((i) => String(i.id ?? i.url) === selectedKey);
    const rows: HostStatus[] = [];
    for (const inst of selectedInstances) {
      const key = String(inst.id ?? inst.url);
      const arr = hostsByInstance[key] ?? [];
      for (const h of arr) {
        const s = Number((h as any).current_state) as HostState;
        if (activeFilter == null || s === activeFilter) rows.push(h);
      }
    }
    return rows;
  }, [hostsByInstance, instances, selectedKey, forcedInstance, activeFilter]);

  const fmtDate = (isoOrUnix: string) => {
    const d = new Date(isoOrUnix);
    return isNaN(d.getTime()) ? isoOrUnix : d.toLocaleString();
  };

  // Per-instance rows (All XIs only)
  const perInstanceRows = useMemo(() => {
    if (forcedInstance || selectedKey !== "all") return [];
    return Object.entries(perInstance).map(([key, v]) => ({
      key,
      name: v.name,
      total: v.total,
      up: v.counts[0],
      down: v.counts[1],
      unreach: v.counts[2],
      unk: v.counts[3],
    }));
  }, [perInstance, forcedInstance, selectedKey]);

  const showSelector = !forcedInstance;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Top bar: Title + Controls in one row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{title} – Host Health</h1>
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

          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
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

      <div className="text-sm text-gray-400 mt-1">Total hosts: {total}</div>

      {/* Main grid (BIG chart) */}
      {!loading && !error && total > 0 && (
        <div className="mt-4">
          <div className="rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Overall Status</div>
              <div className="text-xs text-gray-500">
                {activeFilter == null ? "Click a slice to drill down" : `Filtered: ${STATE_LABEL[activeFilter]}`}
                {activeFilter != null && (
                  <button className="ml-3 underline" onClick={() => setActiveFilter(null)}>Clear</button>
                )}
              </div>
            </div>

            <div className="w-full" style={{ height: 460 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* Robust click handler on the Pie (index -> state) */}
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
                      const st = pieData[idx]?.state as HostState | undefined;
                      if (st !== undefined) toggleFilter(st);
                    }}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[entry.state as HostState]} cursor="pointer" />
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
                  <th className="py-2 px-4 text-center w-1/8">UP</th>
                  <th className="py-2 px-4 text-center w-1/8">DOWN</th>
                  <th className="py-2 px-4 text-center w-1/8">UNREACHABLE</th>
                  <th className="py-2 px-4 text-center w-1/8">UNKNOWN</th>
                </tr>
              </thead>
              <tbody>
                {perInstanceRows.map((r) => (
                  <tr key={r.key} className="border-t border-slate-200/30">
                    <td className="py-2 px-4 text-center">{r.name}</td>
                    <td className="py-2 px-4 tabular-nums text-center">{r.total}</td>
                    <td className="py-2 px-4 tabular-nums text-center" style={{ color: COLORS[0] }}>{r.up}</td>
                    <td className="py-2 px-4 tabular-nums text-center" style={{ color: COLORS[1] }}>{r.down}</td>
                    <td className="py-2 px-4 tabular-nums text-center" style={{ color: COLORS[2] }}>{r.unreach}</td>
                    <td className="py-2 px-4 tabular-nums text-center" style={{ color: COLORS[3] }}>{r.unk}</td>
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
            {activeFilter == null ? "All Hosts" : `Hosts – ${STATE_LABEL[activeFilter]}`}
          </div>
          <div className="overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Host</th>
                  <th className="py-2 pr-4">State</th>
                  <th className="py-2 pr-4">Output</th>
                  <th className="py-2 pr-4">Last Check</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((h) => {
                  const s = Number((h as any).current_state) as HostState;
                  return (
                    <tr key={`${h.host_object_id}-${h.host_name}`} className="border-t border-slate-200/30">
                      <td className="py-2 pr-4">{h.display_name ?? h.host_name}</td>
                      <td className="py-2 pr-4" style={{ color: COLORS[s] }}>{STATE_LABEL[s]}</td>
                      <td className="py-2 pr-4">{h.output}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{fmtDate(h.last_check)}</td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={4}>No rows for the current filter.</td>
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
