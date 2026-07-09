"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ShiftOffer {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  request: {
    id: string;
    date: string;
    shiftStart: string;
    shiftEnd: string;
    headcount: number;
    skillTags: string[];
    site: {
      name: string;
      address: string;
    };
  };
}

const statusConfig = {
  PENDING: { label: "Pending", bg: "#FEF3C7", color: "#D97706" },
  ACCEPTED: { label: "Accepted", bg: "#DCFCE7", color: "#16A34A" },
  DECLINED: { label: "Declined", bg: "#FEE2E2", color: "#DC2626" },
};

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {[80, 120, 60].map((w, i) => (
        <div
          key={i}
          style={{
            height: 14,
            width: `${w}%`,
            background: "#F1F5F9",
            borderRadius: 6,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

export default function WorkerShiftsPage() {
  const [shifts, setShifts] = useState<ShiftOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  async function loadShifts() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/worker/shifts", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      setShifts(data);
    }
    setLoading(false);
  }

  useEffect(() => { loadShifts(); }, []);

  async function handleAction(offerId: string, action: "accept" | "decline") {
    setActioning(offerId);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await fetch(`/api/worker/shifts/${offerId}/${action}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    await loadShifts();
    setActioning(null);
  }

  return (
    <div style={{ padding: "20px 16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 20px" }}>
        My Shifts
      </h1>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : shifts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "#94A3B8",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>No shifts available</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            Check back soon — new shifts will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shifts.map((offer) => {
            const s = statusConfig[offer.status];
            const isPending = offer.status === "PENDING";
            return (
              <div
                key={offer.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                {/* Top row: site + status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: 0 }}>
                      {offer.request.site?.name ?? "Unknown site"}
                    </p>
                    <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
                      {offer.request.site?.address}
                    </p>
                  </div>
                  <span
                    style={{
                      background: s.bg,
                      color: s.color,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                    📅 {offer.request.date} &nbsp;·&nbsp; ⏰ {offer.request.shiftStart}–{offer.request.shiftEnd}
                  </p>
                  <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                    👥 {offer.request.headcount} workers needed
                  </p>
                  {offer.request.skillTags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                      {offer.request.skillTags.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            borderRadius: 20,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isPending && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleAction(offer.id, "accept")}
                      disabled={actioning === offer.id}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: "#1D4ED8",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: actioning === offer.id ? "not-allowed" : "pointer",
                        opacity: actioning === offer.id ? 0.6 : 1,
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(offer.id, "decline")}
                      disabled={actioning === offer.id}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: "#F8FAFC",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: actioning === offer.id ? "not-allowed" : "pointer",
                        opacity: actioning === offer.id ? 0.6 : 1,
                      }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
