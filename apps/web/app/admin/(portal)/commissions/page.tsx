"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, TrendingUp } from "lucide-react";

interface Config {
  commission_rate: string;
  invoiced_this_month?: string;
}

export default function AdminCommissionsPage() {
  const [config, setConfig] = useState<Config>({ commission_rate: "12" });
  const [rate, setRate] = useState("12");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const [cfgRes, statsRes] = await Promise.all([
        fetch("/api/admin/config", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setConfig(cfg);
        setRate(cfg.commission_rate ?? "12");
      }
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setConfig(prev => ({ ...prev, invoiced_this_month: stats.invoiced_this_month }));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveRate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const token = await getToken();
    await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ commission_rate: parseFloat(rate) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const invoiced = Number(config.invoiced_this_month ?? 0) / 100;
  const commission = (invoiced * parseFloat(rate || "0")) / 100;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F172A" }}>Commissions</h1>
      <p className="text-sm mb-8" style={{ color: "#64748B" }}>Platform commission rates and revenue tracking</p>

      {/* Summary card */}
      <div className="rounded-xl p-6 mb-6 text-white" style={{ background: "linear-gradient(135deg, #1D4ED8, #7C3AED)" }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={18} />
          <p className="font-semibold">Commission Summary — This Month</p>
        </div>
        <p className="text-blue-100 text-sm mb-4">At {rate}% on invoiced amount</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-blue-200 text-xs mb-1">Total Invoiced</p>
            <p className="text-2xl font-bold">₹{invoiced.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs mb-1">Platform Revenue</p>
            <p className="text-2xl font-bold">₹{commission.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Commission rate */}
      <div className="rounded-xl bg-white p-6 mb-6" style={{ border: "1px solid #E2E8F0" }}>
        <h2 className="font-semibold mb-1" style={{ color: "#0F172A" }}>Platform Commission Rate</h2>
        <p className="text-sm mb-4" style={{ color: "#64748B" }}>Applied to all invoices as platform margin</p>
        {loading ? <p className="text-sm" style={{ color: "#94A3B8" }}>Loading...</p> : (
          <form onSubmit={saveRate} className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Commission Rate (%)</label>
              <div className="flex items-center">
                <input type="number" min={0} max={100} step={0.5} value={rate} onChange={e => setRate(e.target.value)}
                  className="w-28 px-3 py-2 rounded-l-lg text-sm font-semibold"
                  style={{ border: "1px solid #CBD5E1", borderRight: "none", outline: "none", color: "#0F172A" }} />
                <span className="px-3 py-2 text-sm font-semibold rounded-r-lg" style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#64748B" }}>%</span>
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: saved ? "#10B981" : "#3B82F6" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saved ? "Saved!" : "Save"}
            </button>
          </form>
        )}
      </div>

      {/* Per-client overrides stub */}
      <div className="rounded-xl bg-white p-6 mb-6" style={{ border: "1px solid #E2E8F0", opacity: 0.7 }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold" style={{ color: "#0F172A" }}>Per-Client Overrides</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#D97706" }}>Coming soon</span>
        </div>
        <p className="text-sm mb-4" style={{ color: "#64748B" }}>Set a custom commission rate for specific clients</p>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: "#64748B" }}>Company</th>
              <th className="text-right px-4 py-2 font-semibold" style={{ color: "#64748B" }}>Custom Rate</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={3} className="text-center py-6 text-sm" style={{ color: "#94A3B8" }}>No per-client overrides configured yet.</td></tr>
          </tbody>
        </table>
      </div>

      {/* Per-skill rates stub */}
      <div className="rounded-xl bg-white p-6" style={{ border: "1px solid #E2E8F0", opacity: 0.7 }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold" style={{ color: "#0F172A" }}>Worker Pay Rate per Skill</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#D97706" }}>Coming soon</span>
        </div>
        <p className="text-sm mb-4" style={{ color: "#64748B" }}>Override default hourly rate (₹150/hr) per skill category</p>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: "#64748B" }}>Skill</th>
              <th className="text-right px-4 py-2 font-semibold" style={{ color: "#64748B" }}>Rate (₹/hr)</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
              <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>DEFAULT</span></td>
              <td className="px-4 py-2.5 text-right font-semibold" style={{ color: "#0F172A" }}>₹150/hr</td>
              <td className="px-4 py-2.5 text-right text-xs" style={{ color: "#94A3B8" }}>Edit (coming soon)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
