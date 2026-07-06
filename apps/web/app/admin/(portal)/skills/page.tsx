"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Skill { id: string; label: string; worker_count: number; request_count: number; }

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function load() {
    const token = await getToken();
    const res = await fetch("/api/admin/skills", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSkills(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    setError("");
    const token = await getToken();
    const res = await fetch("/api/admin/skills", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim() }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); }
    else { setNewLabel(""); await load(); }
    setAdding(false);
  }

  async function deleteSkill(id: string) {
    if (!confirm("Delete this skill?")) return;
    setDeletingId(id);
    const token = await getToken();
    await fetch(`/api/admin/skills?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await load();
    setDeletingId(null);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F172A" }}>Skills</h1>
      <p className="text-sm mb-8" style={{ color: "#64748B" }}>Manage skill tags used for worker profiles and shift requests</p>

      <div className="rounded-xl bg-white p-6 mb-6" style={{ border: "1px solid #E2E8F0" }}>
        <h2 className="font-semibold mb-4" style={{ color: "#0F172A" }}>Add new skill</h2>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <form onSubmit={addSkill} className="flex gap-3">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. FORKLIFT_OPERATOR"
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{ border: "1px solid #CBD5E1", outline: "none", color: "#0F172A" }} />
          <button type="submit" disabled={adding}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "#3B82F6" }}>
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </form>
      </div>

      <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Skill Label</th>
              <th className="text-right px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Workers</th>
              <th className="text-right px-6 py-3 font-semibold" style={{ color: "#64748B" }}>Requests</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8" style={{ color: "#94A3B8" }}>Loading...</td></tr>
            ) : skills.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8" style={{ color: "#94A3B8" }}>No skills yet.</td></tr>
            ) : skills.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < skills.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <td className="px-6 py-3 font-medium" style={{ color: "#0F172A" }}>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{s.label}</span>
                </td>
                <td className="px-6 py-3 text-right" style={{ color: "#64748B" }}>{s.worker_count}</td>
                <td className="px-6 py-3 text-right" style={{ color: "#64748B" }}>{s.request_count}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => deleteSkill(s.id)} disabled={deletingId === s.id}
                    className="p-1.5 rounded transition-colors hover:bg-red-50 disabled:opacity-50">
                    {deletingId === s.id ? <Loader2 size={14} className="animate-spin text-red-500" /> : <Trash2 size={14} style={{ color: "#EF4444" }} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
