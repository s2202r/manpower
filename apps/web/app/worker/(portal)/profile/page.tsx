"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Pencil, Check, X } from "lucide-react";

interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  skills: string[];
  reliabilityScore: number;
  totalShiftsCompleted: number;
  totalNoShows: number;
  isActive: boolean;
  kycStatus: string | null;
  verificationStatus: string | null;
}

function ReliabilityBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  const bg = score >= 80 ? "#F0FDF4" : score >= 60 ? "#FFFBEB" : "#FEF2F2";
  const border = score >= 80 ? "#BBF7D0" : score >= 60 ? "#FDE68A" : "#FECACA";
  return (
    <div style={{ width: 72, height: 72, borderRadius: "50%", background: bg, border: `3px solid ${border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 10, color, fontWeight: 500, marginTop: 2 }}>score</span>
    </div>
  );
}

function VerificationBadge({ status }: { status: string | null }) {
  const s = status ?? "PENDING";
  const map: Record<string, { bg: string; color: string; label: string }> = {
    VERIFIED: { bg: "#F0FDF4", color: "#16A34A", label: "Verified" },
    PENDING:  { bg: "#FFFBEB", color: "#D97706", label: "Pending Review" },
    REJECTED: { bg: "#FEF2F2", color: "#DC2626", label: "Rejected" },
  };
  const { bg, color, label } = map[s] ?? map.PENDING;
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
      {label}
    </span>
  );
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function WorkerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErrorDetail("No session"); setLoading(false); return; }
      const token = await getToken();
      const res = await fetch("/api/worker/profile", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        const body = await res.json().catch(() => ({}));
        setErrorDetail(`${res.status}: ${body.error ?? "unknown"}`);
      }
      setLoading(false);

      // Load available skills
      const skillRes = await fetch("/api/skill-tags");
      if (skillRes.ok) {
        const tags = await skillRes.json();
        setAvailableSkills((tags as { label: string }[]).map(t => t.label));
      }
    }
    load();
  }, []);

  function startEdit() {
    if (!profile) return;
    setEditName(profile.name);
    setEditSkills([...profile.skills]);
    setEditing(true);
    setSaved(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function toggleSkill(skill: string) {
    setEditSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  }

  async function saveProfile() {
    setSaving(true);
    const token = await getToken();
    const res = await fetch("/api/worker/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name: editName, skills: editSkills }),
    });
    if (res.ok) {
      setProfile(await res.json());
      setEditing(false);
      setSaved(true);
    }
    setSaving(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/worker/login");
  }

  if (loading) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Loader2 size={24} style={{ color: "#1D4ED8", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: 24, textAlign: "center", paddingTop: 80 }}>
        <p style={{ color: "#64748B", marginBottom: 8 }}>Profile not found.</p>
        {errorDetail && <p style={{ color: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}>{errorDetail}</p>}
        <button onClick={() => supabase.auth.signOut().then(() => router.push("/worker/login"))}
          style={{ marginTop: 20, padding: "8px 20px", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 8, fontSize: 13 }}>
          Sign out and try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>Profile</h1>
        {!editing && (
          <button onClick={startEdit}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Pencil size={13} /> Edit
          </button>
        )}
      </div>

      {saved && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={14} color="#16A34A" />
          <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 500 }}>Profile saved. Submitted for re-verification.</span>
        </div>
      )}

      {/* Identity card */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, marginRight: 16 }}>
            {editing ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ width: "100%", fontSize: 16, fontWeight: 700, color: "#0F172A", border: "1px solid #CBD5E1", borderRadius: 8, padding: "6px 10px", outline: "none" }}
                placeholder="Full name"
              />
            ) : (
              <p style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>{profile.name}</p>
            )}
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 8px" }}>
              {profile.phone ? `+91 ${profile.phone.replace("+91", "")}` : profile.email ?? ""}
            </p>
            <VerificationBadge status={profile.verificationStatus} />
          </div>
          <ReliabilityBadge score={Math.round(profile.reliabilityScore ?? 0)} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total shifts", value: profile.totalShiftsCompleted ?? 0, color: "#0F172A" },
          { label: "No-shows", value: profile.totalNoShows ?? 0, color: (profile.totalNoShows ?? 0) > 0 ? "#DC2626" : "#0F172A" },
        ].map(s => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
          Skills
        </p>
        {editing ? (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(availableSkills.length > 0 ? availableSkills : profile.skills).map(skill => {
                const selected = editSkills.includes(skill);
                return (
                  <button key={skill} onClick={() => toggleSkill(skill)}
                    style={{
                      padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      background: selected ? "#1D4ED8" : "#F1F5F9",
                      color: selected ? "#FFFFFF" : "#475569",
                      border: selected ? "1px solid #1D4ED8" : "1px solid #CBD5E1",
                    }}>
                    {skill.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
            {editSkills.length === 0 && (
              <p style={{ fontSize: 12, color: "#F59E0B", marginTop: 8 }}>Select at least one skill</p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {profile.skills.length > 0 ? profile.skills.map(skill => (
              <span key={skill} style={{ background: "#EFF6FF", color: "#1D4ED8", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 500 }}>
                {skill.replace(/_/g, " ")}
              </span>
            )) : (
              <span style={{ fontSize: 13, color: "#94A3B8" }}>No skills added yet</span>
            )}
          </div>
        )}
      </div>

      {/* Edit action buttons */}
      {editing && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={saveProfile} disabled={saving || !editName.trim()}
            style={{ flex: 1, padding: 14, background: saving ? "#93C5FD" : "#1D4ED8", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
            {saving ? "Saving…" : "Save & Resubmit"}
          </button>
          <button onClick={cancelEdit}
            style={{ padding: "14px 20px", background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <X size={14} /> Cancel
          </button>
        </div>
      )}

      {/* KYC */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: 0 }}>KYC Verification</p>
            <p style={{ fontSize: 12, color: "#64748B", margin: "3px 0 0" }}>Identity verification required for payouts</p>
          </div>
          <span style={{ background: "#FFFBEB", color: "#D97706", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
            {profile.kycStatus ?? "Pending"}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 10 }}>Full KYC flow coming soon</p>
      </div>

      {/* Sign out */}
      {!editing && (
        <button onClick={handleSignOut} disabled={signingOut}
          style={{ width: "100%", padding: 14, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: signingOut ? "not-allowed" : "pointer", opacity: signingOut ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {signingOut && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          Sign Out
        </button>
      )}
    </div>
  );
}
