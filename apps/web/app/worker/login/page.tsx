"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function WorkerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      const { error: authError } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (authError) {
        setError(authError.message);
      } else {
        setStep("otp");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP sent to your phone.");
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: "sms",
      });
      if (authError) {
        setError(authError.message);
      } else {
        router.push("/worker/shifts");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8FAFC",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#1D4ED8",
              marginBottom: 12,
              fontSize: 22,
            }}
          >
            🏗️
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1D4ED8",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            ManPower
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            Worker Portal
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 16,
            padding: 24,
          }}
        >
          {step === "phone" ? (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: "0 0 4px" }}>
                Sign in with your phone
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>
                We&apos;ll send a one-time code to verify it&apos;s you.
              </p>

              {error && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#475569",
                      marginBottom: 6,
                    }}
                  >
                    Mobile number
                  </label>
                  <div style={{ display: "flex", gap: 0 }}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 12px",
                        background: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        borderRight: "none",
                        borderRadius: "8px 0 0 8px",
                        fontSize: 14,
                        color: "#475569",
                        whiteSpace: "nowrap",
                      }}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      required
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "0 8px 8px 0",
                        fontSize: 16,
                        color: "#0F172A",
                        background: "#FFFFFF",
                        outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#1D4ED8")}
                      onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 16px",
                    background: "#1D4ED8",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Send OTP
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: "0 0 4px" }}>
                Enter verification code
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>
                Sent to +91 {phone}.{" "}
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#1D4ED8",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Change
                </button>
              </p>

              {error && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#475569",
                      marginBottom: 6,
                    }}
                  >
                    6-digit OTP
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid #CBD5E1",
                      borderRadius: 10,
                      fontSize: 24,
                      letterSpacing: "0.3em",
                      textAlign: "center",
                      color: "#0F172A",
                      background: "#FFFFFF",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#1D4ED8")}
                    onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 16px",
                    background: "#1D4ED8",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
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
