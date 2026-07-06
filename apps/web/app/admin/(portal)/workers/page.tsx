"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, PauseCircle, Loader2 } from "lucide-react";

type Status = "ALL" | "PENDING" | "VERIFIED" | "SUSPENDED";

interface Worker {
  id: string;
  name: string;
  phone: string;
  skills: string[];
  reliabilityScore: number;
  totalShifts: number;
  isActive: boolean;
  verificationStatus: string;
  kycStatus: string;
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function load() {
    const token = await getToken();
    const res = await fetch("/api/admin/workers", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setWorkers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function doAction(id: string, action: "verify" | "suspend") {
    setActionLoading(id + action);
    const token = await getToken();
    await fetch(`/api/admin/workers/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
    setActionLoading(null);
  }

  const filtered = filter === "ALL" ? workers : workers.filter(w => {
    if (filter === "SUSPENDED") return !w.isActive;
    if (filter === "VERIFIED") return w.isActive && w.verificationStatus === "VERIFIED";
    if (filter === "PENDING") return w.verificationStatus === "PENDING";
    return true;
  });

  const tabCounts = {
    ALL: workers.length,
    PENDING: workers.filter(w => w.verificationStatus === "PENDING").length,
    VERIFIED: workers.filter(w => w.isActive && w.verificationStatus === "VERIFIED").length,
    SUSPENDED: workers.filter(w => !w.isActive).length,
  };

  function kycBadge(status: string) {
    const map: Record<string, { bg: string; color: string }> = {
      VERIFIED: { bg: "#D1FAE5", color: "#059669" },
      PENDING: { bg: "#FEF3C7", color: "#D97706" },
      REJECTED: { bg: "#FEE2E2", color: "#DC2626" },
    };
    const s = map[status] ?? { bg: "#F1F5F9", color: "#64748B" };
    return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={s}>{status || "UNKNOWN"}</span>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F172A" }}>Workers</h1>
      <p className="text-sm mb-6" style={{ color: "#64748B" }}>Verify and manage worker accounts</p>

      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: "#E2E8F0" }}>
        {(["ALL", "PENDING", "VERIFIED", "SUSPENDED"] as Status[]).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{ background: filter === tab ? "white" : "transparent", color: filter === tab ? "#0F172A" : "#64748B", boxShadow: filter === tab ? "0 1px 2px rgba(0,0,0,0.1)" : "none" }}>
            {tab} <span className="ml-1 text-xs" style={{ color: "#94A3B8" }}>({tabCounts[tab]})</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Worker</th>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Skills</th>
              <th className="text-right px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Score</th>
              <th className="text-right px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Shifts</th>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: "#64748B" }}>KYC</th>
              <th className="px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: "#94A3B8" }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: "#94A3B8" }}>No workers found.</td></tr>
            ) : filtered.map((w, i) => (
              <tr key={w.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <td className="px-6 py-3">
                  <p className="font-medium" style={{ color: "#0F172A" }}>{w.name}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{w.phone}</p>
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(w.skills ?? []).slice(0, 3).map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{s}</span>
                    ))}
                    {(w.skills ?? []).length > 3 && <span className="text-xs" style={{ color: "#94A3B8" }}>+{w.skills.length - 3}</span>}
                  </div>
                </td>
                <td className="px-6 py-3 text-right font-semibold" style={{ color: w.reliabilityScore >= 80 ? "#059669" : w.reliabilityScore >= 60 ? "#D97706" : "#DC2626" }}>
                  {w.reliabilityScore?.toFixed(0) ?? "—"}%
                </td>
                <td className="px-6 py-3 text-right" style={{ color: "#64748B" }}>{w.totalShifts ?? 0}</td>
                <td className="px-6 py-3">{kycBadge(w.kycStatus)}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {!w.isActive ? (
                      <button onClick={() => doAction(w.id, "verify")} disabled={actionLoading === w.id + "verify"}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
                        style={{ background: "#D1FAE5", color: "#059669" }}>
                        {actionLoading === w.id + "verify" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Activate
                      </button>
                    ) : (
                      <button onClick={() => doAction(w.id, "suspend")} disabled={actionLoading === w.id + "suspend"}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
                        style={{ background: "#FEF3C7", color: "#D97706" }}>
                        {actionLoading === w.id + "suspend" ? <Loader2 size={12} className="animate-spin" /> : <PauseCircle size={12} />} Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
