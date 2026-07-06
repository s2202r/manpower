"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, ChevronRight, Loader2, X } from "lucide-react";

type Status = "ALL" | "PENDING" | "VERIFIED" | "REJECTED";

interface Client {
  id: string;
  name: string;
  email: string;
  city: string;
  state: string;
  gstin: string;
  address: string;
  createdAt: string;
  verificationStatus: string;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status>("ALL");
  const [selected, setSelected] = useState<Client | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function load() {
    const token = await getToken();
    const res = await fetch("/api/admin/clients", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function doAction(id: string, action: "verify" | "reject") {
    setActionLoading(id + action);
    const token = await getToken();
    await fetch(`/api/admin/clients/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
    if (selected?.id === id) setSelected(null);
    setActionLoading(null);
  }

  const filtered = filter === "ALL" ? clients : clients.filter(c => c.verificationStatus === filter);

  const tabCounts = {
    ALL: clients.length,
    PENDING: clients.filter(c => c.verificationStatus === "PENDING").length,
    VERIFIED: clients.filter(c => c.verificationStatus === "VERIFIED").length,
    REJECTED: clients.filter(c => c.verificationStatus === "REJECTED").length,
  };

  function statusBadge(status: string) {
    const map: Record<string, { bg: string; color: string }> = {
      VERIFIED: { bg: "#D1FAE5", color: "#059669" },
      PENDING: { bg: "#FEF3C7", color: "#D97706" },
      REJECTED: { bg: "#FEE2E2", color: "#DC2626" },
    };
    const s = map[status] ?? { bg: "#F1F5F9", color: "#64748B" };
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={s}>{status}</span>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F172A" }}>Clients</h1>
      <p className="text-sm mb-6" style={{ color: "#64748B" }}>Verify and manage company accounts</p>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: "#E2E8F0" }}>
        {(["ALL", "PENDING", "VERIFIED", "REJECTED"] as Status[]).map(tab => (
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
              <th className="text-left px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Company</th>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: "#64748B" }}>City</th>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Joined</th>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Status</th>
              <th className="px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8" style={{ color: "#94A3B8" }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8" style={{ color: "#94A3B8" }}>No clients found.</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <td className="px-6 py-3">
                  <p className="font-medium" style={{ color: "#0F172A" }}>{c.name}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{c.email}</p>
                </td>
                <td className="px-6 py-3" style={{ color: "#64748B" }}>{c.city}, {c.state}</td>
                <td className="px-6 py-3" style={{ color: "#64748B" }}>{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-6 py-3">{statusBadge(c.verificationStatus)}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                    {c.verificationStatus !== "VERIFIED" && (
                      <button onClick={() => doAction(c.id, "verify")} disabled={actionLoading === c.id + "verify"}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                        style={{ background: "#D1FAE5", color: "#059669" }}>
                        {actionLoading === c.id + "verify" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Verify
                      </button>
                    )}
                    {c.verificationStatus !== "REJECTED" && (
                      <button onClick={() => doAction(c.id, "reject")} disabled={actionLoading === c.id + "reject"}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
                        style={{ background: "#FEE2E2", color: "#DC2626" }}>
                        {actionLoading === c.id + "reject" ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
                      </button>
                    )}
                    <ChevronRight size={14} style={{ color: "#94A3B8" }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)}>
          <div className="ml-auto h-full overflow-y-auto p-6" style={{ width: 400, background: "white" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: "#0F172A" }}>Company Details</h2>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#94A3B8" }}>Company Name</p>
                <p className="font-medium" style={{ color: "#0F172A" }}>{selected.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#94A3B8" }}>Email</p>
                <p style={{ color: "#374151" }}>{selected.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#94A3B8" }}>GSTIN</p>
                <p style={{ color: "#374151" }}>{selected.gstin || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#94A3B8" }}>Address</p>
                <p style={{ color: "#374151" }}>{selected.address}, {selected.city}, {selected.state}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#94A3B8" }}>Status</p>
                {statusBadge(selected.verificationStatus)}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#94A3B8" }}>Joined</p>
                <p style={{ color: "#374151" }}>{new Date(selected.createdAt).toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              {selected.verificationStatus !== "VERIFIED" && (
                <button onClick={() => doAction(selected.id, "verify")}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#10B981" }}>
                  Verify
                </button>
              )}
              {selected.verificationStatus !== "REJECTED" && (
                <button onClick={() => doAction(selected.id, "reject")}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#EF4444" }}>
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
