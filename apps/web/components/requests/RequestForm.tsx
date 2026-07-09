"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSites, createRequest, type Site } from "@/lib/api";
import { Loader2, MapPin, Calendar, Clock, Users, Tag, RefreshCw, FileText, ChevronRight } from "lucide-react";

interface SkillCategory {
  id: string;
  name: string;
  skills: { id: string; label: string }[];
}

function formatLabel(raw: string) {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function shiftDuration(start: string, end: string) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function RequestForm() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [siteId, setSiteId] = useState("");
  const [date, setDate] = useState("");
  const [shiftStart, setShiftStart] = useState("08:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");
  const [headcount, setHeadcount] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    getSites().then(setSites).catch(() => {});
    fetch("/api/skill-tags")
      .then((r) => r.json())
      .then((data: SkillCategory[]) => {
        setCategories(data);
        if (data.length > 0) setActiveCategory(data[0].id);
      })
      .catch(() => {});
  }, []);

  function toggleSkill(skillLabel: string) {
    setSelectedSkills((prev) =>
      prev.includes(skillLabel) ? prev.filter((s) => s !== skillLabel) : [...prev, skillLabel]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const req = await createRequest({
        site_id: siteId,
        date,
        shift_start: shiftStart,
        shift_end: shiftEnd,
        headcount,
        skill_tags: selectedSkills,
        recurring,
        recurrence_rule: recurring ? recurrenceRule : undefined,
        notes: notes.trim() || undefined,
      });
      router.push(`/dashboard/requests/${req.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  }

  const duration = shiftDuration(shiftStart, shiftEnd);
  const activeCat = categories.find((c) => c.id === activeCategory);
  const selectedCount = selectedSkills.length;

  const card = "rounded-lg p-5 space-y-4";
  const cardStyle = {
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
  };
  const fieldStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    outline: "none",
    width: "100%",
    padding: "9px 12px",
    borderRadius: 6,
    fontSize: 13,
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="px-3 py-2.5 rounded text-sm" style={{ background: "#7F1D1D22", border: "1px solid #EF444444", color: "#EF4444" }}>
          {error}
        </div>
      )}

      {/* Section 1 — Location */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-2 pb-1" style={{ borderBottom: "1px solid var(--border-muted)" }}>
          <MapPin size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Location</span>
        </div>
        <div>
          <label style={labelStyle}>Site *</label>
          <select required value={siteId} onChange={(e) => setSiteId(e.target.value)} style={fieldStyle}>
            <option value="">Select a site…</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ""}</option>
            ))}
          </select>
          {sites.length === 0 && (
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
              No sites yet —{" "}
              <a href="/dashboard/sites" className="underline" style={{ color: "var(--accent)" }}>add one first</a>
            </p>
          )}
        </div>
      </div>

      {/* Section 2 — Schedule */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-2 pb-1" style={{ borderBottom: "1px solid var(--border-muted)" }}>
          <Calendar size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Schedule</span>
        </div>

        <div>
          <label style={labelStyle}>Shift Date *</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Start Time *</label>
            <input type="time" required value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>End Time *</label>
            <div className="relative">
              <input type="time" required value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} style={fieldStyle} />
              {duration && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums" style={{ color: "var(--accent)" }}>
                  {duration}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Recurring */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded" style={{ background: "var(--surface-overlay)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <RefreshCw size={13} style={{ color: "var(--text-muted)" }} />
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>Recurring shift</span>
          </div>
          <button
            type="button"
            onClick={() => setRecurring((v) => !v)}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            style={{ background: recurring ? "var(--accent)" : "var(--border)" }}
            role="switch"
            aria-checked={recurring}
          >
            <span
              className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
              style={{ transform: recurring ? "translateX(18px)" : "translateX(2px)" }}
            />
          </button>
        </div>

        {recurring && (
          <div>
            <label style={labelStyle}>Repeat</label>
            <select value={recurrenceRule} onChange={(e) => setRecurrenceRule(e.target.value)} style={fieldStyle}>
              <option value="FREQ=DAILY">Every day</option>
              <option value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">Weekdays (Mon–Fri)</option>
              <option value="FREQ=WEEKLY">Weekly</option>
              <option value="FREQ=MONTHLY">Monthly</option>
            </select>
          </div>
        )}
      </div>

      {/* Section 3 — Headcount */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-2 pb-1" style={{ borderBottom: "1px solid var(--border-muted)" }}>
          <Users size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Headcount</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setHeadcount((n) => Math.max(1, n - 1))}
            className="w-8 h-8 rounded flex items-center justify-center text-lg font-medium transition-opacity hover:opacity-70"
            style={{ background: "var(--surface-overlay)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>−</button>
          <input
            type="number" required min={1} max={500}
            value={headcount}
            onChange={(e) => setHeadcount(Math.max(1, parseInt(e.target.value) || 1))}
            className="tabular-nums text-center font-semibold text-base"
            style={{ ...fieldStyle, width: 72, padding: "8px 4px" }}
          />
          <button type="button" onClick={() => setHeadcount((n) => Math.min(500, n + 1))}
            className="w-8 h-8 rounded flex items-center justify-center text-lg font-medium transition-opacity hover:opacity-70"
            style={{ background: "var(--surface-overlay)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>+</button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>workers needed</span>
        </div>
      </div>

      {/* Section 4 — Skills */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center justify-between pb-1" style={{ borderBottom: "1px solid var(--border-muted)" }}>
          <div className="flex items-center gap-2">
            <Tag size={14} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Skills Required</span>
          </div>
          {selectedCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => {
              const count = cat.skills.filter((s) => selectedSkills.includes(s.label)).length;
              const active = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors shrink-0"
                  style={
                    active
                      ? { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }
                      : { background: "var(--surface-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
                  }
                >
                  {cat.name}
                  {count > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
                      style={{ background: active ? "rgba(255,255,255,0.25)" : "var(--accent)", color: active ? "#fff" : "#fff", fontSize: 10 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Skill chips */}
        <div className="flex flex-wrap gap-2">
          {(activeCat?.skills ?? []).map((skill) => {
            const active = selectedSkills.includes(skill.label);
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.label)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={
                  active
                    ? { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }
                    : { background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
                }
              >
                {formatLabel(skill.label)}
              </button>
            );
          })}
          {categories.length === 0 && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Loading skills…</span>
          )}
        </div>
      </div>

      {/* Section 5 — Notes */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-2 pb-1" style={{ borderBottom: "1px solid var(--border-muted)" }}>
          <FileText size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Notes</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>(optional)</span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special instructions, PPE requirements, experience level…"
          rows={3}
          style={{ ...fieldStyle, resize: "none", lineHeight: 1.5 }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
          {submitting ? "Submitting…" : "Place Request"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded text-sm font-medium transition-opacity hover:opacity-70"
          style={{ background: "var(--surface-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
