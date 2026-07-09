"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ReliabilityBadge } from "@/components/workers/ReliabilityBadge";
import { getWorker, getWorkerAttendance, type Worker, type AttendanceRecord } from "@/lib/api";
import { formatDate, formatDateTime, formatHours } from "@/lib/utils";
import { ArrowLeft, Phone, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [noShowLoading, setNoShowLoading] = useState(false);
  const [noShowDone, setNoShowDone] = useState(false);

  useEffect(() => {
    Promise.all([
      getWorker(id).catch(() => null),
      getWorkerAttendance(id).catch(() => []),
    ]).then(([w, a]) => {
      setWorker(w);
      setAttendance(a as AttendanceRecord[]);
      setLoading(false);
    });
  }, [id]);

  async function markNoShow() {
    setNoShowLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await fetch(`/api/worker/${id}/no-show`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setNoShowLoading(false);
    setNoShowDone(true);
    // Refresh worker data
    const w = await getWorker(id).catch(() => null);
    if (w) setWorker(w);
  }

  const attendanceRate = attendance.length > 0
    ? ((attendance.filter((a) => a.check_in_time).length / attendance.length) * 100).toFixed(0)
    : "—";

  return (
    <div className="flex-1 overflow-y-auto">
      <Header />

      <div className="px-6 py-5 max-w-4xl">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/ops"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} />
            Ops Console
          </Link>
          {worker && (
            <>
              <span style={{ color: "var(--border)" }}>/</span>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                {worker.name}
              </span>
            </>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        ) : worker ? (
          <div className="space-y-5">
            {/* Worker profile card */}
            <div
              className="rounded-lg p-5 flex items-start gap-5"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{
                  background: "var(--surface-overlay)",
                  color: "var(--text-secondary)",
                }}
              >
                {worker.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2
                      className="text-base font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {worker.name}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone size={11} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {worker.phone}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markNoShow}
                      disabled={noShowLoading || noShowDone}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 transition-opacity"
                      style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
                    >
                      {noShowLoading ? <Loader2 size={11} className="animate-spin" /> : <AlertTriangle size={11} />}
                      {noShowDone ? "No-show recorded" : "Mark No-show"}
                    </button>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded capitalize"
                    style={
                      worker.status === "active"
                        ? { background: "#14532D22", color: "#22C55E" }
                        : worker.status === "suspended"
                        ? { background: "#7F1D1D22", color: "#EF4444" }
                        : { background: "var(--surface-overlay)", color: "var(--text-muted)" }
                    }
                  >
                    {worker.status}
                  </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  <Stat label="Reliability" value={<ReliabilityBadge score={worker.reliability_score} showLabel />} />
                  <Stat label="Total Shifts" value={<span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{worker.total_shifts}</span>} />
                  <Stat label="No-shows" value={<span className="text-sm font-semibold tabular-nums" style={{ color: worker.no_show_count > 3 ? "#EF4444" : "var(--text-primary)" }}>{worker.no_show_count}</span>} />
                  <Stat label="Late Arrivals" value={<span className="text-sm font-semibold tabular-nums" style={{ color: worker.late_count > 5 ? "#F59E0B" : "var(--text-primary)" }}>{worker.late_count}</span>} />
                  <Stat label="Last Shift" value={<span className="text-sm" style={{ color: "var(--text-secondary)" }}>{worker.last_shift_date ? formatDate(worker.last_shift_date) : "—"}</span>} />
                </div>

                {worker.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {worker.skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "var(--accent-subtle)",
                          color: "var(--accent)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance history */}
            <div
              className="rounded-lg overflow-hidden"
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
                  Attendance History
                </p>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {attendance.length} shifts · {attendanceRate}% attendance rate
                </span>
              </div>
              <div className="overflow-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-muted)" }}>
                      {["Check-in", "Check-out", "Hours", "Location", "Request"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                          style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((rec) => (
                      <tr
                        key={rec.id}
                        style={{ borderBottom: "1px solid var(--border-muted)" }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          {formatDateTime(rec.check_in_time)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {rec.check_out_time ? formatDateTime(rec.check_out_time) : (
                            <span style={{ color: "#22C55E" }}>Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          {formatHours(rec.hours_accrued * 60)}
                        </td>
                        <td className="px-4 py-3">
                          {rec.location_verified ? (
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#22C55E" }}>
                              <CheckCircle2 size={11} /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#F59E0B" }}>
                              <XCircle size={11} /> Unverified
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/requests/${rec.request_id}`}
                            className="font-mono text-xs hover:opacity-70"
                            style={{ color: "var(--accent)" }}
                          >
                            {rec.request_id.slice(0, 8)}
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                          No attendance records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>Worker not found.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      {value}
    </div>
  );
}
