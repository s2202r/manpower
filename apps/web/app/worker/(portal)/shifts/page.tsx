"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, MapPin, Calendar, Clock, Users, Search, ChevronRight } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────── */

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
    site: { name: string; address: string };
  };
}

interface OpenShift {
  id: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  headcount: number;
  spotsLeft: number;
  skillTags: string[];
  notes: string | null;
  site: { id: string; name: string; address: string; city: string } | null;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function formatLabel(raw: string) {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function durationLabel(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function SkillChips({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {tags.map((t) => (
        <span key={t} style={{ background: "#EFF6FF", color: "#1D4ED8", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>
          {formatLabel(t)}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#64748B", margin: 0 }}>{title}</p>
      <p style={{ fontSize: 13, marginTop: 4 }}>{sub}</p>
    </div>
  );
}

/* ── My Shifts tab ──────────────────────────────────────────────────── */

const offerStatus = {
  PENDING:  { label: "Offer Received", bg: "#FEF3C7", color: "#D97706" },
  ACCEPTED: { label: "Accepted",       bg: "#DCFCE7", color: "#16A34A" },
  DECLINED: { label: "Declined",       bg: "#FEE2E2", color: "#DC2626" },
};

function MyShifts() {
  const [shifts, setShifts] = useState<ShiftOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  async function load() {
    const token = await getToken();
    const res = await fetch("/api/worker/shifts", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (res.ok) setShifts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(offerId: string, action: "accept" | "decline") {
    setActioning(offerId);
    const token = await getToken();
    await fetch(`/api/worker/shifts/${offerId}/${action}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    await load();
    setActioning(null);
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
      <Loader2 size={22} color="#1D4ED8" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!shifts.length) return (
    <EmptyState icon="📋" title="No shift offers yet" sub="Ops will send you offers, or browse open shifts below." />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {shifts.map((offer) => {
        const sc = offerStatus[offer.status];
        const isPending = offer.status === "PENDING";
        const dur = durationLabel(offer.request.shiftStart, offer.request.shiftEnd);
        return (
          <div key={offer.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>{offer.request.site?.name ?? "Unknown site"}</p>
                <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={11} /> {offer.request.site?.address}
                </p>
              </div>
              <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                {sc.label}
              </span>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#475569" }}>
                <Calendar size={13} /> {formatDate(offer.request.date)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#475569" }}>
                <Clock size={13} /> {offer.request.shiftStart}–{offer.request.shiftEnd}
                {dur && <span style={{ color: "#94A3B8", fontSize: 11 }}>({dur})</span>}
              </span>
            </div>

            <SkillChips tags={offer.request.skillTags} />

            {isPending && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => handleAction(offer.id, "accept")} disabled={!!actioning}
                  style={{ flex: 1, padding: 11, background: "#1D4ED8", color: "#FFF", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: actioning ? 0.6 : 1 }}>
                  {actioning === offer.id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Accept"}
                </button>
                <button onClick={() => handleAction(offer.id, "decline")} disabled={!!actioning}
                  style={{ flex: 1, padding: 11, background: "#FFF", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: actioning ? 0.6 : 1 }}>
                  Decline
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Browse tab ─────────────────────────────────────────────────────── */

function BrowseShifts() {
  const [shifts, setShifts] = useState<OpenShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  async function load() {
    const token = await getToken();
    const res = await fetch("/api/worker/open-shifts", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (res.ok) setShifts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function apply(requestId: string) {
    setApplying(requestId);
    const token = await getToken();
    const res = await fetch("/api/worker/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ requestId }),
    });
    if (res.ok) setApplied((prev) => new Set(prev).add(requestId));
    setApplying(null);
  }

  const filtered = shifts.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.site?.name?.toLowerCase().includes(q) ||
      s.site?.city?.toLowerCase().includes(q) ||
      s.skillTags.some((t) => t.toLowerCase().includes(q))
    );
  });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
      <Loader2 size={22} color="#1D4ED8" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by site, city, or skill…"
          style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: 13, color: "#0F172A", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No open shifts" sub={search ? "Try a different search term." : "Check back soon — new shifts are posted regularly."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((shift) => {
            const isApplied = applied.has(shift.id);
            const dur = durationLabel(shift.shiftStart, shift.shiftEnd);
            const spotsLabel = shift.spotsLeft === 1 ? "1 spot left" : `${shift.spotsLeft} spots`;
            const urgent = shift.spotsLeft <= 2;
            return (
              <div key={shift.id} style={{ background: "#FFFFFF", border: `1px solid ${urgent ? "#FCD34D" : "#E2E8F0"}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>{shift.site?.name ?? "Unknown site"}</p>
                    {shift.site?.city && (
                      <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={11} /> {shift.site.city}
                      </p>
                    )}
                  </div>
                  <span style={{ background: urgent ? "#FEF3C7" : "#F1F5F9", color: urgent ? "#D97706" : "#64748B", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                    {spotsLabel}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#475569" }}>
                    <Calendar size={13} /> {formatDate(shift.date)}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#475569" }}>
                    <Clock size={13} /> {shift.shiftStart}–{shift.shiftEnd}
                    {dur && <span style={{ color: "#94A3B8", fontSize: 11 }}>({dur})</span>}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#475569" }}>
                    <Users size={13} /> {shift.headcount} workers
                  </span>
                </div>

                {shift.skillTags.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <SkillChips tags={shift.skillTags} />
                  </div>
                )}

                {shift.notes && (
                  <p style={{ fontSize: 12, color: "#64748B", background: "#F8FAFC", borderRadius: 6, padding: "6px 10px", margin: "0 0 10px" }}>
                    {shift.notes}
                  </p>
                )}

                <button
                  onClick={() => apply(shift.id)}
                  disabled={isApplied || applying === shift.id}
                  style={{
                    width: "100%",
                    padding: 11,
                    background: isApplied ? "#F0FDF4" : "#1D4ED8",
                    color: isApplied ? "#16A34A" : "#FFFFFF",
                    border: isApplied ? "1px solid #BBF7D0" : "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isApplied || applying === shift.id ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {applying === shift.id
                    ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Applying…</>
                    : isApplied
                    ? "✓ Application Sent"
                    : <><ChevronRight size={14} /> Apply for this Shift</>
                  }
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

type Tab = "mine" | "browse";

export default function WorkerShiftsPage() {
  const [tab, setTab] = useState<Tab>("mine");

  return (
    <div style={{ padding: "20px 16px", paddingBottom: 32 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 16px" }}>Shifts</h1>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 3, marginBottom: 20 }}>
        {([["mine", "My Shifts"], ["browse", "Browse Open"]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              background: tab === t ? "#FFFFFF" : "transparent",
              color: tab === t ? "#0F172A" : "#64748B",
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              cursor: "pointer",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "mine" ? <MyShifts /> : <BrowseShifts />}
    </div>
  );
}
