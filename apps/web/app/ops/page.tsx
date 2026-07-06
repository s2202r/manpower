"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { WorkerBench } from "@/components/workers/WorkerBench";
import {
  getWorkers,
  getOverbookingSuggestions,
  getBackfillAlerts,
  getFillRateAnalytics,
  getSkillDemand,
  type Worker,
  type OverbookingSuggestion,
  type Alert,
  type FillRateDataPoint,
  type SkillDemandPoint,
} from "@/lib/api";
import { formatPercent, formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, AlertTriangle, Users, Zap } from "lucide-react";

const TABS = ["Worker Bench", "Analytics"] as const;
type Tab = (typeof TABS)[number];

export default function OpsConsolePage() {
  const [tab, setTab] = useState<Tab>("Worker Bench");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [suggestions, setSuggestions] = useState<OverbookingSuggestion[]>([]);
  const [backfillAlerts, setBackfillAlerts] = useState<Alert[]>([]);
  const [fillData, setFillData] = useState<FillRateDataPoint[]>([]);
  const [skillData, setSkillData] = useState<SkillDemandPoint[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [searchWorker, setSearchWorker] = useState("");
  const [minReliability, setMinReliability] = useState(0);

  useEffect(() => {
    Promise.all([
      getWorkers().catch(() => []),
      getOverbookingSuggestions().catch(() => []),
      getBackfillAlerts().catch(() => []),
    ]).then(([w, s, b]) => {
      setWorkers(w as Worker[]);
      setSuggestions(s as OverbookingSuggestion[]);
      setBackfillAlerts(b as Alert[]);
      setLoadingWorkers(false);
    });

    Promise.all([
      getFillRateAnalytics(30).catch(() => []),
      getSkillDemand().catch(() => []),
    ]).then(([f, s]) => {
      setFillData(f as FillRateDataPoint[]);
      setSkillData(s as SkillDemandPoint[]);
      setLoadingAnalytics(false);
    });
  }, []);

  const filteredWorkers = workers.filter((w) => {
    const q = searchWorker.toLowerCase();
    const matchesSearch =
      !q ||
      w.name.toLowerCase().includes(q) ||
      w.skills.some((s) => s.toLowerCase().includes(q));
    const matchesReliability = w.reliability_score >= minReliability;
    return matchesSearch && matchesReliability;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Ops Console" />

      <div className="px-6 py-5 space-y-5 max-w-7xl">
        {/* Alert panels */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Overbooking suggestions */}
          <div
            className="rounded-lg"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <Zap size={13} style={{ color: "#F59E0B" }} />
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
              >
                Overbooking Suggestions
              </p>
              <span
                className="ml-auto text-xs px-1.5 py-0.5 rounded"
                style={{ background: "#78350F22", color: "#F59E0B" }}
              >
                {suggestions.length}
              </span>
            </div>
            {suggestions.length === 0 ? (
              <p className="px-4 py-5 text-sm" style={{ color: "var(--text-muted)" }}>
                No overbooking recommendations right now.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-muted)" }}>
                {suggestions.slice(0, 4).map((s) => (
                  <div key={s.request_id} className="px-4 py-3 flex items-start gap-3">
                    <TrendingUp size={13} className="mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                        Request{" "}
                        <span className="font-mono text-xs">{s.request_id.slice(0, 8)}</span>
                        {" "}— book +{s.suggested_extra} extra
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {s.reason} · Est. no-show {formatPercent(s.estimated_no_show_rate * 100, 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backfill alerts */}
          <div
            className="rounded-lg"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <AlertTriangle size={13} style={{ color: "#EF4444" }} />
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
              >
                Backfill Alerts
              </p>
              <span
                className="ml-auto text-xs px-1.5 py-0.5 rounded"
                style={{ background: "#7F1D1D22", color: "#EF4444" }}
              >
                {backfillAlerts.length}
              </span>
            </div>
            {backfillAlerts.length === 0 ? (
              <p className="px-4 py-5 text-sm" style={{ color: "var(--text-muted)" }}>
                No backfill alerts — all shifts adequately covered.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-muted)" }}>
                {backfillAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="px-4 py-3 flex items-start gap-3">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "#EF4444" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded w-fit"
          style={{ background: "var(--surface-overlay)" }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={
                tab === t
                  ? {
                      background: "var(--surface-raised)",
                      color: "var(--text-primary)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                    }
                  : { color: "var(--text-muted)" }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Worker Bench" && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 h-8 rounded flex-1 max-w-xs"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                }}
              >
                <Users size={13} style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search name, skill…"
                  value={searchWorker}
                  onChange={(e) => setSearchWorker(e.target.value)}
                  className="bg-transparent text-sm flex-1 outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Min reliability:
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minReliability}
                  onChange={(e) => setMinReliability(parseInt(e.target.value))}
                  className="w-24"
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="text-xs tabular-nums w-8" style={{ color: "var(--text-secondary)" }}>
                  {minReliability}+
                </span>
              </div>
            </div>
            <WorkerBench workers={filteredWorkers} loading={loadingWorkers} />
          </>
        )}

        {tab === "Analytics" && (
          <div className="space-y-5">
            {/* Fill rate trend */}
            <div
              className="rounded-lg p-5"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
              >
                Fill Rate Trend — Last 30 Days
              </p>
              {loadingAnalytics ? (
                <div className="skeleton h-48 rounded" />
              ) : fillData.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                  No analytics data available
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={fillData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="2 4"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => formatDate(v, "dd MMM")}
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface-overlay)",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        fontSize: 11,
                        color: "var(--text-primary)",
                      }}
                      formatter={(v: number) => [`${v.toFixed(1)}%`]}
                    />
                    <Line
                      type="monotone"
                      dataKey="fill_rate"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      name="Fill Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Skill demand vs supply */}
            <div
              className="rounded-lg p-5"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
              >
                Skill Demand vs Supply
              </p>
              {loadingAnalytics ? (
                <div className="skeleton h-48 rounded" />
              ) : skillData.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                  No skill data available
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={skillData}
                    margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      strokeDasharray="2 4"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="skill"
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface-overlay)",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        fontSize: 11,
                        color: "var(--text-primary)",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }}
                    />
                    <Bar dataKey="demand" name="Demand" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="supply" name="Supply" fill="#22C55E" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
