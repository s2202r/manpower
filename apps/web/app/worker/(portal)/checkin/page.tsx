"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface Shift {
  id: string;
  requestId: string;
  request: {
    date: string;
    shiftStart: string;
    shiftEnd: string;
    site: { name: string; address: string };
  };
}

interface CheckInRecord {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
  hoursAccrued: number | null;
}

interface TodayShift {
  shift: Shift | null;
  isToday: boolean;
  checkedIn: boolean;
  checkIn: CheckInRecord | null;
}

function elapsed(from: string): string {
  const secs = Math.floor((Date.now() - new Date(from).getTime()) / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WorkerCheckinPage() {
  const [data, setData] = useState<TodayShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/worker/today-shift", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const d = await res.json();
      setData(d);
      if (d.checkedIn && d.checkIn?.checkInAt && !d.checkIn.checkOutAt) {
        startTimer(d.checkIn.checkInAt);
      }
    }
    setLoading(false);
  }

  function startTimer(from: string) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(elapsed(from));
    intervalRef.current = setInterval(() => setTimer(elapsed(from)), 1000);
  }

  useEffect(() => {
    load();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheckIn() {
    setActing(true);
    setError("");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      ).catch(() => null);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/worker/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          request_id: data?.shift?.requestId,
          lat: pos?.coords.latitude ?? null,
          lng: pos?.coords.longitude ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Check-in failed");
      } else {
        await load();
      }
    } finally {
      setActing(false);
    }
  }

  async function handleCheckOut() {
    setActing(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/worker/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ checkin_id: data?.checkIn?.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Check-out failed");
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        await load();
      }
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Loader2 size={24} style={{ color: "#1D4ED8", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!data?.shift) {
    return (
      <div style={{ padding: 24, textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#0F172A" }}>No upcoming shifts</p>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 6 }}>
          Accept a shift from the Shifts tab to get started.
        </p>
      </div>
    );
  }

  const { shift, isToday, checkedIn, checkIn } = data;
  const checkedOut = !!checkIn?.checkOutAt;

  function formatShiftDate(d: string) {
    const dt = new Date(d + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((dt.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <div style={{ padding: "20px 16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 20px" }}>
        {isToday ? "Check In" : "Upcoming Shift"}
      </h1>

      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#DC2626",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Shift card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: "0 0 6px" }}>
          {shift.request?.site?.name}
        </p>
        <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 4px" }}>
          {shift.request?.site?.address}
        </p>
        <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
          📅 {formatShiftDate(shift.request?.date ?? "")} &nbsp;·&nbsp; ⏰ {shift.request?.shiftStart}–{shift.request?.shiftEnd}
        </p>
      </div>

      {/* Status / timer */}
      {checkedIn && !checkedOut && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: 12,
            padding: 20,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 14, color: "#16A34A", fontWeight: 600, margin: "0 0 8px" }}>
            ✓ Checked in
          </p>
          <p
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#0F172A",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {timer}
          </p>
          <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>hours accruing</p>
        </div>
      )}

      {checkedOut && checkIn && (
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: 20,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 14, color: "#16A34A", fontWeight: 600, margin: "0 0 8px" }}>
            ✓ Shift complete
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            {(checkIn.hoursAccrued ?? 0).toFixed(2)} hrs
          </p>
        </div>
      )}

      {/* Not yet shift day */}
      {!isToday && !checkedIn && !checkedOut && (
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: "#1D4ED8", fontWeight: 600, margin: "0 0 4px" }}>
            Shift confirmed ✓
          </p>
          <p style={{ fontSize: 13, color: "#3B82F6", margin: 0 }}>
            Check-in opens on your shift day.
          </p>
        </div>
      )}

      {/* CTA button */}
      {!checkedOut && isToday && (
        <button
          onClick={checkedIn ? handleCheckOut : handleCheckIn}
          disabled={acting}
          style={{
            width: "100%",
            padding: "16px",
            background: checkedIn ? "#DC2626" : "#1D4ED8",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: acting ? "not-allowed" : "pointer",
            opacity: acting ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {acting && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
          {checkedIn ? "Check Out" : "📍 Check In"}
        </button>
      )}
    </div>
  );
}
