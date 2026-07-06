"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  getDashboardSummary,
  getAlerts,
  getRequests,
  type DashboardSummary,
  type Alert,
  type StaffingRequest,
} from "@/lib/api";
import {
  formatCurrency,
  formatRelative,
  getRequestStatusBg,
  formatPercent,
  getFillStatus,
  getFillStatusColor,
} from "@/lib/utils";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wider mb-2"
        style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-semibold tabular-nums leading-none"
        style={{ color: accent ?? "var(--text-primary)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function FillRateBar({
  onTrack,
  atRisk,
  breached,
  total,
}: {
  onTrack: number;
  atRisk: number;
  breached: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = (n: number) => ((n / total) * 100).toFixed(1) + "%";
  return (
    <div className="flex rounded overflow-hidden h-2" style={{ gap: 1 }}>
      <div style={{ width: pct(onTrack), background: "#22C55E" }} title={`On Track: ${onTrack}`} />
      <div style={{ width: pct(atRisk), background: "#F59E0B" }} title={`At Risk: ${atRisk}`} />
      <div style={{ width: pct(breached), background: "#EF4444" }} title={`Breached: ${breached}`} />
    </div>
  );
}

const alertSeverityIcon = {
  info: <Clock size={13} style={{ color: "#3B82F6" }} />,
  warning: <AlertTriangle size={13} style={{ color: "#F59E0B" }} />,
  critical: <XCircle size={13} style={{ color: "#EF4444" }} />,
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [requests, setRequests] = useState<StaffingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardSummary().catch(() => null),
      getAlerts(false).catch(() => []),
      getRequests({ status: "active" }).catch(() => []),
    ]).then(([s, a, r]) => {
      setSummary(s);
      setAlerts(a as Alert[]);
      setRequests((r as StaffingRequest[]).slice(0, 6));
      setLoading(false);
    });
  }, []);

  const total =
    (summary?.on_track_count ?? 0) +
    (summary?.at_risk_count ?? 0) +
    (summary?.breached_count ?? 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Overview" />

      <div className="px-6 py-5 space-y-6 max-w-6xl">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Active Requests"
            value={loading ? "—" : (summary?.active_requests ?? 0)}
            sub="Open shifts today"
          />
          <StatCard
            label="Avg Fill Rate"
            value={loading ? "—" : formatPercent(summary?.fill_rate_avg ?? 0)}
            sub="Across active requests"
            accent={
              summary
                ? getFillStatusColor(getFillStatus(summary.fill_rate_avg))
                : undefined
            }
          />
          <StatCard
            label="Checked In Today"
            value={loading ? "—" : (summary?.workers_checked_in_today ?? 0)}
            sub="Workers on-site"
            accent="#3B82F6"
          />
          <StatCard
            label="Pending Invoices"
            value={
              loading
                ? "—"
                : formatCurrency(summary?.pending_invoice_amount ?? 0)
            }
            sub={`${summary?.pending_invoices ?? 0} invoices due`}
            accent="#F59E0B"
          />
        </div>

        {/* Fill rate breakdown */}
        {!loading && summary && (
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
              >
                Fill Rate Breakdown
              </p>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {total} requests
              </span>
            </div>
            <FillRateBar
              onTrack={summary.on_track_count}
              atRisk={summary.at_risk_count}
              breached={summary.breached_count}
              total={total}
            />
            <div className="flex gap-5 mt-3">
              {[
                { label: "On Track", count: summary.on_track_count, color: "#22C55E" },
                { label: "At Risk", count: summary.at_risk_count, color: "#F59E0B" },
                { label: "Breached", count: summary.breached_count, color: "#EF4444" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {s.label}
                  </span>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: s.color }}
                  >
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Active requests */}
          <div
            className="rounded-lg"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
              >
                Active Requests
              </p>
              <Link
                href="/dashboard/requests"
                className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-10 rounded" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <p className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
                No active requests right now.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-muted)" }}>
                {requests.map((r) => {
                  const status = getFillStatus(r.fill_rate);
                  const color = getFillStatusColor(status);
                  return (
                    <Link
                      key={r.id}
                      href={`/dashboard/requests/${r.id}`}
                      className="flex items-center justify-between px-4 py-2.5 transition-colors hover:opacity-80"
                      style={{ color: "inherit" }}
                    >
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {r.site?.name ?? `Site ${r.site_id.slice(0, 6)}`}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {r.date} · {r.shift_start}–{r.shift_end}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-xs font-semibold tabular-nums"
                          style={{ color }}
                        >
                          {formatPercent(r.fill_rate, 0)}
                        </span>
                        <div
                          className="w-16 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--border)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${r.fill_rate}%`, background: color }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div
            className="rounded-lg"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
              >
                Recent Alerts
              </p>
              {alerts.filter((a) => a.severity === "critical").length > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: "#7F1D1D22",
                    color: "#EF4444",
                  }}
                >
                  {alerts.filter((a) => a.severity === "critical").length} critical
                </span>
              )}
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-10 rounded" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <CheckCircle2 size={20} style={{ color: "#22C55E" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  All clear — no active alerts
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-muted)" }}>
                {alerts.slice(0, 6).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2.5 px-4 py-2.5"
                  >
                    <span className="mt-0.5 shrink-0">
                      {alertSeverityIcon[alert.severity]}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-sm leading-snug"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {alert.message}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {formatRelative(alert.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
