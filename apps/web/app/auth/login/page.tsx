"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Boxes, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--surface)" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="flex items-center justify-center w-8 h-8 rounded"
            style={{ background: "var(--accent)" }}
          >
            <Boxes size={16} className="text-white" />
          </div>
          <span
            className="font-semibold text-base tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            ManPower
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-base font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Sign in to your account
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Staffing operations dashboard
          </p>

          {error && (
            <div
              className="mb-4 px-3 py-2.5 rounded text-sm"
              style={{
                background: "#7F1D1D22",
                border: "1px solid #EF444444",
                color: "#EF4444",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => { setEmail("demo@delhilogistics.com"); setPassword("Demo@2026"); }}
            className="w-full mb-4 py-2 rounded text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent)" }}
          >
            Fill demo credentials
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 rounded text-sm transition-colors"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--accent)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border)")
                }
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded text-sm"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--accent)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border)")
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded text-sm font-medium transition-opacity disabled:opacity-60"
              style={{
                background: "var(--accent)",
                color: "white",
              }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p
          className="mt-4 text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Contact your account manager to get access.
        </p>
      </div>
    </div>
  );
}
