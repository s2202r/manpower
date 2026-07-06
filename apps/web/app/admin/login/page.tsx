"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "not_admin") {
      setError("Not authorised as admin.");
    }
  }, [searchParams]);

  function fillDemo() {
    setEmail("admin@work4.in");
    setPassword("Admin@2026");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
        .split(",").map((e) => e.trim()).filter(Boolean);
      if (!data.user?.email || !adminEmails.includes(data.user.email)) {
        await supabase.auth.signOut();
        setError("Not authorised as admin");
        return;
      }
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0F172A" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded" style={{ background: "#3B82F6" }}>
            <ShieldCheck size={16} className="text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">Work4.in Admin</span>
        </div>

        <div className="rounded-lg p-6" style={{ background: "#1E293B", border: "1px solid #334155" }}>
          <h2 className="text-base font-semibold mb-1 text-white">Admin Sign In</h2>
          <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>Restricted access — admin accounts only</p>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded text-sm" style={{ background: "#7F1D1D22", border: "1px solid #EF444444", color: "#EF4444" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#CBD5E1" }}>Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@work4.in"
                className="w-full px-3 py-2 rounded text-sm text-white"
                style={{ background: "#0F172A", border: "1px solid #334155", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                onBlur={(e) => (e.target.style.borderColor = "#334155")} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#CBD5E1" }}>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded text-sm text-white"
                style={{ background: "#0F172A", border: "1px solid #334155", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                onBlur={(e) => (e.target.style.borderColor = "#334155")} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded text-sm font-medium transition-opacity disabled:opacity-60 text-white"
              style={{ background: "#3B82F6" }}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Sign in to Admin Console
            </button>
          </form>

          <button onClick={fillDemo} className="mt-3 w-full py-2 rounded text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "#1E3A5F", color: "#93C5FD", border: "1px solid #1D4ED8" }}>
            Fill admin demo credentials
          </button>
        </div>
      </div>
    </div>
  );
}
