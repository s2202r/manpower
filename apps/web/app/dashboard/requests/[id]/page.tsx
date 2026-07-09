"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { FillRateCard } from "@/components/requests/FillRateCard";
import { AttendanceBoard } from "@/components/requests/AttendanceBoard";
import {
  getRequest,
  getRequestAttendance,
  type StaffingRequest,
  type AttendanceRecord,
} from "@/lib/api";
import {
  formatDate,
  formatCurrency,
  getRequestStatusBg,
} from "@/lib/utils";
import { ArrowLeft, MapPin, Clock, Users, RefreshCw, Star, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  worker: {
    id: string; name: string; phone: string; photoUrl: string | null;
    reliabilityScore: number; totalShiftsCompleted: number; totalNoShows: number;
    skills: string[]; kycStatus: string | null;
  } | null;
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<StaffingRequest | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [loadingAtt, setLoadingAtt] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  async function loadApplications() {
    const token = await getToken();
    const res = await fetch(`/api/requests/${id}/applications`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) setApplications(await res.json());
  }

  function load() {
    setLoadingReq(true);
    setLoadingAtt(true);
    getRequest(id)
      .then(setRequest)
      .catch(() => {})
      .finally(() => setLoadingReq(false));
    getRequestAttendance(id)
      .then(setAttendance)
      .catch(() => [])
      .finally(() => setLoadingAtt(false));
    loadApplications();
  }

  async function handleAction(offerId: string, action: "approve" | "reject") {
    setActioning(offerId);
    const token = await getToken();
    await fetch(`/api/requests/${id}/applications/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ action }),
    });
    await loadApplications();
    setActioning(null);
  }

  useEffect(() => { load(); }, [id]);

  // Compute booked vs billed delta
  const bookedCost = request
    ? request.confirmed_count * 8 * 320 // placeholder: ₹320/hr assumption
    : 0;
  const billedCost = request
    ? request.checked_in_count * 8 * 320
    : 0;
  const delta = billedCost - bookedCost;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header />

      <div className="px-6 py-5 max-w-5xl">
        {/* Back + title */}
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/dashboard/requests"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} />
            Requests
          </Link>
          {request && (
            <>
              <span style={{ color: "var(--border)" }}>/</span>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                {request.site?.name ?? `Request ${id.slice(0, 8)}`}
              </span>
              <span
                className={`ml-1 text-xs font-medium px-2 py-0.5 rounded capitalize ${getRequestStatusBg(request.status)}`}
              >
                {request.status}
              </span>
            </>
          )}
          <button
            onClick={load}
            className="ml-auto flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {loadingReq ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-lg" />
            ))}
          </div>
        ) : request ? (
          <div className="space-y-5">
            {/* Meta row */}
            <div
              className="rounded-lg p-4 flex flex-wrap gap-5"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <MetaItem icon={<MapPin size={13} />} label="Site" value={request.site?.name ?? request.site_id} />
              <MetaItem icon={<Clock size={13} />} label="Date" value={formatDate(request.date)} />
              <MetaItem icon={<Clock size={13} />} label="Shift" value={`${request.shift_start} – ${request.shift_end}`} />
              <MetaItem icon={<Users size={13} />} label="Headcount" value={`${request.headcount} workers`} />
              {request.recurring && (
                <MetaItem icon={<RefreshCw size={13} />} label="Recurring" value={request.recurrence_rule ?? "Yes"} />
              )}
              {request.skill_tags.length > 0 && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {request.skill_tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--surface-overlay)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Fill rate card */}
              <FillRateCard
                requested={request.requested_count}
                confirmed={request.confirmed_count}
                checkedIn={request.checked_in_count}
              />

              {/* Booked vs billed delta */}
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
                  Booked vs Billed
                </p>
                <div className="space-y-3">
                  <DeltaRow label="Booked" value={formatCurrency(bookedCost)} color="var(--text-secondary)" />
                  <DeltaRow label="Billed" value={formatCurrency(billedCost)} color="var(--text-primary)" />
                  <div
                    className="h-px w-full"
                    style={{ background: "var(--border)" }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Delta
                    </span>
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{
                        color:
                          delta > 0
                            ? "#22C55E"
                            : delta < 0
                            ? "#EF4444"
                            : "var(--text-muted)",
                      }}
                    >
                      {delta >= 0 ? "+" : ""}{formatCurrency(delta)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  Based on ₹320/hr blended rate. Final billing from invoice.
                </p>
              </div>

              {/* Quick stats */}
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
                  Attendance Summary
                </p>
                <div className="space-y-2.5">
                  <SummaryRow
                    label="Present"
                    value={attendance.filter((a) => !a.check_out_time).length}
                    color="#22C55E"
                  />
                  <SummaryRow
                    label="Completed"
                    value={attendance.filter((a) => a.check_out_time).length}
                    color="#3B82F6"
                  />
                  <SummaryRow
                    label="No-shows"
                    value={Math.max(0, request.confirmed_count - attendance.length)}
                    color="#EF4444"
                  />
                  <SummaryRow
                    label="Geo-verified"
                    value={attendance.filter((a) => a.location_verified).length}
                    color="#22C55E"
                  />
                </div>
              </div>
            </div>

            {/* Worker Applications */}
            {applications.length > 0 && (
              <div className="rounded-lg" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}>
                    Worker Applications
                  </p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                    {applications.filter(a => a.status === "PENDING").length} pending
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border-muted)" }}>
                  {applications.map((app) => {
                    const w = app.worker;
                    if (!w) return null;
                    const score = Math.round((w.reliabilityScore ?? 0) * 100);
                    const scoreColor = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
                    const isPending = app.status === "PENDING";
                    return (
                      <div key={app.id} className="px-4 py-4 flex items-start gap-4">
                        {/* Avatar */}
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-overlay)", border: "1px solid var(--border)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {w.photoUrl
                            ? <img src={w.photoUrl} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span style={{ fontSize: 16, color: "var(--text-muted)" }}>{w.name[0]}</span>}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{w.name}</span>
                            {w.kycStatus === "APPROVED" && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#F0FDF4", color: "#16A34A", fontSize: 10, fontWeight: 600 }}>KYC ✓</span>
                            )}
                            {!isPending && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: app.status === "ACCEPTED" ? "#F0FDF4" : "#FEF2F2", color: app.status === "ACCEPTED" ? "#16A34A" : "#DC2626" }}>
                                {app.status === "ACCEPTED" ? "Approved" : "Rejected"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs flex items-center gap-1" style={{ color: scoreColor }}>
                              <Star size={10} fill={scoreColor} /> {score}% reliability
                            </span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {w.totalShiftsCompleted} shifts done
                            </span>
                            {w.totalNoShows > 0 && (
                              <span className="text-xs" style={{ color: "#DC2626" }}>{w.totalNoShows} no-shows</span>
                            )}
                          </div>
                          {w.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {w.skills.slice(0, 4).map((s: string) => (
                                <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-muted)" }}>
                                  {s.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Actions */}
                        {isPending && (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleAction(app.id, "approve")} disabled={!!actioning}
                              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
                              style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                              {actioning === app.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                              Approve
                            </button>
                            <button onClick={() => handleAction(app.id, "reject")} disabled={!!actioning}
                              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
                              style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                              <XCircle size={11} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live attendance board */}
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
                  Live Attendance Board
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "#22C55E" }}
                  />
                  <span className="text-xs" style={{ color: "#22C55E" }}>
                    Live
                  </span>
                </div>
              </div>
              <AttendanceBoard records={attendance} loading={loadingAtt} />
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>Request not found.</p>
        )}
      </div>
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p
        className="text-xs mb-0.5 flex items-center gap-1"
        style={{ color: "var(--text-muted)" }}
      >
        {icon} {label}
      </p>
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function DeltaRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span
        className="text-sm font-semibold tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}
