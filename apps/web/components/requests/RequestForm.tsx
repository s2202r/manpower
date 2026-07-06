"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSites, getSkillTags, createRequest, type Site, type SkillTag } from "@/lib/api";
import { Loader2, Plus, X, RefreshCw } from "lucide-react";

export function RequestForm() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [skillTags, setSkillTags] = useState<SkillTag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [siteId, setSiteId] = useState("");
  const [date, setDate] = useState("");
  const [shiftStart, setShiftStart] = useState("08:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");
  const [headcount, setHeadcount] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("FREQ=WEEKLY");

  useEffect(() => {
    getSites().then(setSites).catch(() => {});
    getSkillTags().then(setSkillTags).catch(() => {});
  }, []);

  function toggleSkill(id: string) {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
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
      });
      router.push(`/dashboard/requests/${req.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: "0.375rem",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {error && (
        <div
          className="px-3 py-2.5 rounded text-sm"
          style={{
            background: "#7F1D1D22",
            border: "1px solid #EF444444",
            color: "#EF4444",
          }}
        >
          {error}
        </div>
      )}

      {/* Site */}
      <div>
        <label style={labelStyle}>Site *</label>
        <select
          required
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          className="w-full px-3 py-2 rounded text-sm"
          style={fieldStyle}
        >
          <option value="">Select a site…</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.city}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label style={labelStyle}>Shift Date *</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded text-sm"
          style={fieldStyle}
        />
      </div>

      {/* Shift window */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Shift Start *</label>
          <input
            type="time"
            required
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm"
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Shift End *</label>
          <input
            type="time"
            required
            value={shiftEnd}
            onChange={(e) => setShiftEnd(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm"
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Headcount */}
      <div>
        <label style={labelStyle}>Headcount Required *</label>
        <input
          type="number"
          required
          min={1}
          max={500}
          value={headcount}
          onChange={(e) => setHeadcount(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 rounded text-sm tabular-nums"
          style={fieldStyle}
        />
      </div>

      {/* Skill tags */}
      <div>
        <label style={labelStyle}>Skill Tags</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {skillTags.map((tag) => {
            const active = selectedSkills.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleSkill(tag.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={
                  active
                    ? {
                        background: "var(--accent)",
                        color: "white",
                        border: "1px solid var(--accent)",
                      }
                    : {
                        background: "var(--surface)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {active ? <X size={10} /> : <Plus size={10} />}
                {tag.label}
              </button>
            );
          })}
          {skillTags.length === 0 && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Loading skill tags…
            </span>
          )}
        </div>
      </div>

      {/* Recurring toggle */}
      <div
        className="flex items-center justify-between p-3 rounded"
        style={{
          background: "var(--surface-overlay)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <RefreshCw size={14} style={{ color: "var(--text-muted)" }} />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            Recurring shift
          </span>
        </div>
        <button
          type="button"
          onClick={() => setRecurring((v) => !v)}
          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
          style={{
            background: recurring ? "var(--accent)" : "var(--border)",
          }}
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
          <label style={labelStyle}>Recurrence Rule</label>
          <select
            value={recurrenceRule}
            onChange={(e) => setRecurrenceRule(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm"
            style={fieldStyle}
          >
            <option value="FREQ=DAILY">Daily</option>
            <option value="FREQ=WEEKLY">Weekly</option>
            <option value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">
              Weekdays only
            </option>
            <option value="FREQ=MONTHLY">Monthly</option>
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          Create Request
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-70"
          style={{
            background: "var(--surface-overlay)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
