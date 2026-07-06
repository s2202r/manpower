"use client";

import { type AttendanceRecord } from "@/lib/api";
import { formatRelative, formatHours } from "@/lib/utils";
import { MapPin, Clock, CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface AttendanceBoardProps {
  records: AttendanceRecord[];
  loading?: boolean;
}

export function AttendanceBoard({ records, loading }: AttendanceBoardProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-14 rounded" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Clock size={20} style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No workers have checked in yet
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: "var(--border-muted)" }}>
      {records.map((rec) => (
        <WorkerRow key={rec.id} record={rec} />
      ))}
    </div>
  );
}

function WorkerRow({ record }: { record: AttendanceRecord }) {
  const isCheckedOut = Boolean(record.check_out_time);
  const minutesElapsed = record.hours_accrued * 60;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Selfie thumbnail */}
      <div
        className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-semibold"
        style={{
          background: "var(--surface-overlay)",
          color: "var(--text-muted)",
        }}
      >
        {record.selfie_url ? (
          <Image
            src={record.selfie_url}
            alt={record.worker?.name ?? "Worker"}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        ) : (
          (record.worker?.name ?? "WK").slice(0, 2).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {record.worker?.name ?? `Worker ${record.worker_id.slice(0, 6)}`}
          </p>
          {record.location_verified && (
            <span title="Location verified">
              <MapPin size={11} style={{ color: "#22C55E" }} />
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          In {formatRelative(record.check_in_time)}
          {isCheckedOut && ` · Out ${formatRelative(record.check_out_time!)}`}
        </p>
      </div>

      {/* Hours */}
      <div className="text-right shrink-0">
        <p
          className="text-sm font-semibold tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {formatHours(minutesElapsed)}
        </p>
        <div className="flex items-center gap-1 justify-end mt-0.5">
          {isCheckedOut ? (
            <CheckCircle2 size={10} style={{ color: "#22C55E" }} />
          ) : (
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#22C55E" }}
            />
          )}
          <span className="text-2xs" style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
            {isCheckedOut ? "done" : "live"}
          </span>
        </div>
      </div>
    </div>
  );
}
