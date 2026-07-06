"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Loader2, Tag, FolderOpen, ChevronRight } from "lucide-react";

interface Skill { id: string; label: string; categoryId: string | null; worker_count: number; request_count: number; }
interface Category { id: string; name: string; Skill: { id: string; label: string }[]; }

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

export default function AdminSkillsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Add category form
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [catError, setCatError] = useState("");

  // Add skill form
  const [newSkillLabel, setNewSkillLabel] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillError, setSkillError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const token = await getToken();
    const [catRes, skillRes] = await Promise.all([
      fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/admin/skills", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (catRes.ok) {
      const cats: Category[] = await catRes.json();
      setCategories(cats);
      if (!selectedCat && cats.length > 0) setSelectedCat(cats[0].id);
    }
    if (skillRes.ok) setSkills(await skillRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true); setCatError("");
    const token = await getToken();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    if (!res.ok) { const d = await res.json(); setCatError(d.error ?? "Failed"); }
    else { setNewCatName(""); await load(); }
    setAddingCat(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category and unlink its skills?")) return;
    setDeletingId(id);
    const token = await getToken();
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (selectedCat === id) setSelectedCat(null);
    await load();
    setDeletingId(null);
  }

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newSkillLabel.trim() || !selectedCat) return;
    setAddingSkill(true); setSkillError("");
    const token = await getToken();
    const res = await fetch("/api/admin/skills", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ label: newSkillLabel.trim(), categoryId: selectedCat }),
    });
    if (!res.ok) { const d = await res.json(); setSkillError(d.error ?? "Failed"); }
    else { setNewSkillLabel(""); await load(); }
    setAddingSkill(false);
  }

  async function deleteSkill(id: string) {
    if (!confirm("Delete this skill?")) return;
    setDeletingId(id);
    const token = await getToken();
    await fetch(`/api/admin/skills?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await load();
    setDeletingId(null);
  }

  const activeCat = categories.find(c => c.id === selectedCat);
  const catSkills = skills.filter(s => s.categoryId === selectedCat);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F172A" }}>Skills & Categories</h1>
      <p className="text-sm mb-6" style={{ color: "#64748B" }}>Organise skills into categories for workers and shift requests</p>

      <div className="flex gap-6" style={{ minHeight: 480 }}>
        {/* Left — categories */}
        <div className="flex flex-col" style={{ width: 240, flexShrink: 0 }}>
          <div className="rounded-xl bg-white overflow-hidden flex-1" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
              <FolderOpen size={14} color="#64748B" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Categories</span>
            </div>

            {loading ? (
              <div className="p-4 text-center"><Loader2 size={16} className="animate-spin mx-auto" style={{ color: "#94A3B8" }} /></div>
            ) : categories.length === 0 ? (
              <p className="p-4 text-sm text-center" style={{ color: "#94A3B8" }}>No categories yet</p>
            ) : (
              <ul>
                {categories.map((cat, i) => (
                  <li key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className="flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      background: selectedCat === cat.id ? "#EFF6FF" : "transparent",
                      borderBottom: i < categories.length - 1 ? "1px solid #F1F5F9" : "none",
                    }}>
                    <span className="flex-1 text-sm font-medium truncate" style={{ color: selectedCat === cat.id ? "#1D4ED8" : "#0F172A" }}>
                      {cat.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#F1F5F9", color: "#64748B" }}>
                      {cat.Skill?.length ?? 0}
                    </span>
                    {selectedCat === cat.id && <ChevronRight size={12} color="#1D4ED8" />}
                    <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}
                      disabled={deletingId === cat.id}
                      className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                      style={{ opacity: 0.4 }}>
                      {deletingId === cat.id ? <Loader2 size={11} className="animate-spin" style={{ color: "#EF4444" }} /> : <Trash2 size={11} color="#EF4444" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add category */}
            <div className="p-3" style={{ borderTop: "1px solid #E2E8F0" }}>
              {catError && <p className="text-xs text-red-500 mb-2">{catError}</p>}
              <form onSubmit={addCategory} className="flex gap-2">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  placeholder="New category…"
                  className="flex-1 px-2 py-1.5 rounded text-sm"
                  style={{ border: "1px solid #CBD5E1", outline: "none", color: "#0F172A", minWidth: 0 }} />
                <button type="submit" disabled={addingCat}
                  className="p-1.5 rounded text-white disabled:opacity-60"
                  style={{ background: "#3B82F6" }}>
                  {addingCat ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right — skills in selected category */}
        <div className="flex-1 flex flex-col">
          {!activeCat ? (
            <div className="flex-1 rounded-xl flex items-center justify-center" style={{ border: "1px dashed #CBD5E1", background: "#F8FAFC" }}>
              <p className="text-sm" style={{ color: "#94A3B8" }}>Select a category to manage its skills</p>
            </div>
          ) : (
            <div className="rounded-xl bg-white flex flex-col flex-1" style={{ border: "1px solid #E2E8F0" }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                <Tag size={14} color="#64748B" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
                  Skills in {activeCat.name}
                </span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    {["Skill label", "Workers", "Requests", ""].map(h => (
                      <th key={h} className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider ${h === "" ? "" : "text-left"}`} style={{ color: "#64748B" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catSkills.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-sm" style={{ color: "#94A3B8" }}>No skills in this category yet</td></tr>
                  ) : catSkills.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < catSkills.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                      <td className="px-5 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3" style={{ color: "#64748B" }}>{s.worker_count}</td>
                      <td className="px-5 py-3" style={{ color: "#64748B" }}>{s.request_count}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => deleteSkill(s.id)} disabled={deletingId === s.id}
                          className="p-1.5 rounded hover:bg-red-50 disabled:opacity-50">
                          {deletingId === s.id ? <Loader2 size={13} className="animate-spin text-red-500" /> : <Trash2 size={13} color="#EF4444" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add skill to category */}
              <div className="p-4 mt-auto" style={{ borderTop: "1px solid #E2E8F0" }}>
                {skillError && <p className="text-xs text-red-500 mb-2">{skillError}</p>}
                <form onSubmit={addSkill} className="flex gap-3">
                  <input value={newSkillLabel} onChange={e => setNewSkillLabel(e.target.value)}
                    placeholder={`Add skill to ${activeCat.name}…`}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{ border: "1px solid #CBD5E1", outline: "none", color: "#0F172A" }} />
                  <button type="submit" disabled={addingSkill}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                    style={{ background: "#3B82F6" }}>
                    {addingSkill ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Add
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
