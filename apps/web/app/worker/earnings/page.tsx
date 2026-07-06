"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface EarningsShift {
  id: string;
  date: string;
  siteName: string;
  hours: number;
  rate: number;
  amount: number;
}

interface EarningsData {
  total_month: number;
  shifts: EarningsShift[];
}

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function WorkerEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/worker/earnings", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setData(await res.json());
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Loader2 size={24} style={{ color: "#1D4ED8", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 20px" }}>
        Earnings
      </h1>

      {/* Total card */}
      <div
        style={{
          background: "#1D4ED8",
          borderRadius: 16,
          padding: "24px 20px",
          marginBottom: 20,
          textAlign: "center",
          color: "#FFFFFF",
        }}
      >
        <p style={{ fontSize: 13, opacity: 0.8, margin: "0 0 8px", fontWeight: 500 }}>
          Total this month
        </p>
        <p style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
          {fmt(data?.total_month ?? 0)}
        </p>
        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          ₹150/hr · {data?.shifts.length ?? 0} shifts completed
        </p>
      </div>

      {/* Instant pay button */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: "relative" }}>
          <button
            disabled
            title="Coming soon — powered by earned-wage access"
            style={{
              width: "100%",
              padding: "14px",
              background: "#F1F5F9",
              color: "#94A3B8",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "not-allowed",
            }}
          >
            ⚡ Instant Pay — Coming Soon
          </button>
          <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 4 }}>
            Powered by earned-wage access
          </p>
        </div>
      </div>

      {/* Shifts list */}
      <div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            margin: "0 0 12px",
          }}
        >
          Completed shifts
        </p>

        {!data?.shifts.length ? (
          <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", padding: "32px 0" }}>
            No completed shifts this month
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.shifts.map((shift) => (
              <div
                key={shift.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: 0 }}>
                    {shift.siteName}
                  </p>
                  <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
                    {shift.date} · {shift.hours.toFixed(1)} hrs × ₹{shift.rate}
                  </p>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#16A34A", margin: 0 }}>
                  {fmt(shift.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
