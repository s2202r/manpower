"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Building2, HardHat, Activity, IndianRupee, TrendingUp, Clock } from "lucide-react";

interface Stats {
  total_companies: number;
  pending_companies: number;
  total_workers: number;
  pending_workers: number;
  active_requests_today: number;
  invoiced_this_month: number;
  commission_this_month: number;
  recent_activity: { type: string; name: string; time: string }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: "#64748B" }}>{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + "15" }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: "#0F172A" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { setError("Failed to load stats"); setLoading(false); return; }
      setStats(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }} />
    </div>
  );

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const s = stats!;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F172A" }}>Dashboard</h1>
      <p className="text-sm mb-8" style={{ color: "#64748B" }}>Platform overview</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Building2} label="Total Companies" value={s.total_companies} sub={`${s.pending_companies} pending verification`} color="#3B82F6" />
        <StatCard icon={HardHat} label="Total Workers" value={s.total_workers} sub={`${s.pending_workers} pending verification`} color="#10B981" />
        <StatCard icon={Activity} label="Active Requests Today" value={s.active_requests_today} color="#F59E0B" />
        <StatCard icon={IndianRupee} label="Invoiced This Month" value={`₹${(s.invoiced_this_month / 100).toLocaleString("en-IN")}`} color="#8B5CF6" />
        <StatCard icon={TrendingUp} label="Commission This Month" value={`₹${(s.commission_this_month / 100).toLocaleString("en-IN")}`} sub="Platform revenue" color="#EC4899" />
      </div>

      <div className="rounded-xl bg-white p-6" style={{ border: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} style={{ color: "#64748B" }} />
          <h2 className="font-semibold" style={{ color: "#0F172A" }}>Recent Activity</h2>
        </div>
        {s.recent_activity.length === 0 ? (
          <p className="text-sm" style={{ color: "#94A3B8" }}>No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {s.recent_activity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < s.recent_activity.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: item.type === "worker" ? "#D1FAE5" : "#DBEAFE", color: item.type === "worker" ? "#059669" : "#1D4ED8" }}>
                  {item.type === "worker" ? "👷" : "🏢"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "#0F172A" }}>{item.name}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{item.type === "worker" ? "New worker signup" : "New client signup"}</p>
                </div>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{item.time}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
