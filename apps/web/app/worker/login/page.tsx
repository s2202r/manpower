"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

type Mode = "email" | "phone";
type Step = "phone" | "otp";

const DEMO_WORKERS = [
  { label: "Demo Worker 1", email: "worker1@work4.in", password: "Worker@2026" },
  { label: "Demo Worker 2", email: "worker2@work4.in", password: "Worker@2026" },
];

export default function WorkerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("email");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }
      router.push("/worker/shifts");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (phone.length !== 10) { setError("Enter a valid 10-digit phone number."); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
      if (authError) { setError(authError.message); } else { setStep("otp"); }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit OTP sent to your phone."); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.verifyOtp({ phone: `+91${phone}`, token: otp, type: "sms" });
      if (authError) { setError(authError.message); } else { router.push("/worker/shifts"); }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1",
    borderRadius: 8, fontSize: 15, color: "#0F172A", background: "#FFFFFF", outline: "none",
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8FAFC", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 12, background: "#1D4ED8", marginBottom: 12, fontSize: 22 }}>
            🏗️
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1D4ED8", letterSpacing: "-0.02em", margin: 0 }}>Work4.in</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Worker Portal</p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", background: "#E2E8F0", borderRadius: 10, padding: 3, marginBottom: 16 }}>
          {(["email", "phone"] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); setStep("phone"); }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                background: mode === m ? "#FFFFFF" : "transparent",
                color: mode === m ? "#1D4ED8" : "#64748B",
                boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
              {m === "email" ? "Email & Password" : "Phone OTP"}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24 }}>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {mode === "email" ? (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: "0 0 16px" }}>Sign in with email</h2>
              <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 5 }}>Email address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="worker@example.com" style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#1D4ED8")}
                    onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 5 }}>Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#1D4ED8")}
                    onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#1D4ED8", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Sign In
                </button>
              </form>

              {/* Demo accounts */}
              <div style={{ marginTop: 16, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Demo accounts</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {DEMO_WORKERS.map((w) => (
                    <button key={w.email} onClick={() => { setEmail(w.email); setPassword(w.password); }}
                      style={{ padding: "8px 12px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, fontSize: 12, color: "#1D4ED8", cursor: "pointer", textAlign: "left", fontWeight: 500 }}>
                      {w.label} — {w.email}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : step === "phone" ? (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: "0 0 4px" }}>Sign in with phone</h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>We&apos;ll send a one-time code to verify it&apos;s you.</p>
              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 5 }}>Mobile number</label>
                  <div style={{ display: "flex" }}>
                    <span style={{ display: "flex", alignItems: "center", padding: "10px 12px", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRight: "none", borderRadius: "8px 0 0 8px", fontSize: 14, color: "#475569" }}>+91</span>
                    <input type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="9876543210" required
                      style={{ ...inputStyle, borderRadius: "0 8px 8px 0", fontSize: 16 }}
                      onFocus={(e) => (e.target.style.borderColor = "#1D4ED8")}
                      onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")} />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#1D4ED8", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Send OTP
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: "0 0 4px" }}>Enter verification code</h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
                Sent to +91 {phone}.{" "}
                <button type="button" onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  style={{ background: "none", border: "none", color: "#1D4ED8", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 500 }}>Change</button>
              </p>
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 5 }}>6-digit OTP</label>
                  <input type="tel" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="123456" required
                    style={{ ...inputStyle, fontSize: 24, letterSpacing: "0.3em", textAlign: "center" }}
                    onFocus={(e) => (e.target.style.borderColor = "#1D4ED8")}
                    onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#1D4ED8", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Verify &amp; Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
