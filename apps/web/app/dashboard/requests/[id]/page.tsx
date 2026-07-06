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
import { ArrowLeft, MapPin, Clock, Users, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<StaffingRequest | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [loadingAtt, setLoadingAtt] = useState(true);

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
