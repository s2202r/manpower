"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  skills: string[];
  reliabilityScore: number;
  totalShifts: number;
  noShowCount: number;
  isActive: boolean;
  kycStatus: string | null;
}

function ReliabilityBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  const bg = score >= 80 ? "#F0FDF4" : score >= 60 ? "#FFFBEB" : "#FEF2F2";
  const border = score >= 80 ? "#BBF7D0" : score >= 60 ? "#FDE68A" : "#FECACA";
  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: bg,
        border: `3px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 10, color, fontWeight: 500, marginTop: 2 }}>score</span>
    </div>
  );
}

export default function WorkerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/worker/profile", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setProfile(await res.json());
      }
      setLoading(false);
    }
    load();
  }, []);

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
        <p style={{ color: "#64748B" }}>Profile not found.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 20px" }}>
        Profile
      </h1>

      {/* Identity card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              {profile.name}
            </p>
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
              +91 {profile.phone.replace("+91", "")}
            </p>
          </div>
          <ReliabilityBadge score={Math.round(profile.reliabilityScore ?? 0)} />
        </div>
        <p style={{ fontSize: 11, color: "#94A3B8", margin: "12px 0 0" }}>
          Reliability score
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          { label: "Total shifts", value: profile.totalShifts ?? 0, color: "#0F172A" },
          { label: "No-shows", value: profile.noShowCount ?? 0, color: (profile.noShowCount ?? 0) > 0 ? "#DC2626" : "#0F172A" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              margin: "0 0 10px",
            }}
          >
            Skills
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {profile.skills.map((skill) => (
              <span
                key={skill}
                style={{
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  borderRadius: 20,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KYC */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: 0 }}>
              KYC Verification
            </p>
            <p style={{ fontSize: 12, color: "#64748B", margin: "3px 0 0" }}>
              Identity verification required for payouts
            </p>
          </div>
          <span
            style={{
              background: "#FFFBEB",
              color: "#D97706",
              borderRadius: 20,
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {profile.kycStatus ?? "Pending"}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 10 }}>
          Full KYC flow coming soon
        </p>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        style={{
          width: "100%",
          padding: "14px",
          background: "#FEF2F2",
          color: "#DC2626",
          border: "1px solid #FECACA",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: signingOut ? "not-allowed" : "pointer",
          opacity: signingOut ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {signingOut && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
        Sign Out
      </button>
    </div>
  );
}
