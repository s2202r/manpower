"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AdminPaymentGatewayPage() {
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [mode, setMode] = useState<"test" | "live">("test");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [savedKeyId, setSavedKeyId] = useState("");

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const res = await fetch("/api/admin/config", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const cfg = await res.json();
        setSavedKeyId(cfg.razorpay_key_id ?? "");
        setKeyId(cfg.razorpay_key_id ?? "");
        setMode((cfg.razorpay_mode ?? "test") as "test" | "live");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const token = await getToken();
    const body: Record<string, string> = {
      razorpay_key_id: keyId,
      razorpay_mode: mode,
    };
    if (keySecret) body.razorpay_key_secret = keySecret;
    if (webhookSecret) body.razorpay_webhook_secret = webhookSecret;
    await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSavedKeyId(keyId);
    setKeySecret("");
    setWebhookSecret("");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    const token = await getToken();
    const res = await fetch("/api/admin/payment-gateway/test", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTestResult(data);
    setTesting(false);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F172A" }}>Payment Gateway</h1>
      <p className="text-sm mb-8" style={{ color: "#64748B" }}>Configure Razorpay for invoice payments</p>

      <div className="rounded-xl bg-white p-6 mb-6" style={{ border: "1px solid #E2E8F0" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: "#0F172A" }}>Razorpay Configuration</h2>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: mode === "live" ? "#D1FAE5" : "#FEF3C7", color: mode === "live" ? "#059669" : "#D97706" }}>
            {mode.toUpperCase()}
          </span>
        </div>

        <div className="rounded-lg p-3 mb-5 text-sm" style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#92400E" }}>
          Key Secret and Webhook Secret are stored server-side only and are never returned to the browser. Leave blank to keep the existing value.
        </div>

        {loading ? <p className="text-sm" style={{ color: "#94A3B8" }}>Loading...</p> : (
          <form onSubmit={save} className="space-y-4">
            {/* Mode toggle */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#64748B" }}>Mode</label>
              <div className="flex gap-2">
                {(["test", "live"] as const).map(m => (
                  <button type="button" key={m} onClick={() => setMode(m)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: mode === m ? (m === "live" ? "#D1FAE5" : "#DBEAFE") : "#F1F5F9", color: mode === m ? (m === "live" ? "#059669" : "#1D4ED8") : "#64748B", border: mode === m ? `2px solid ${m === "live" ? "#10B981" : "#3B82F6"}` : "2px solid transparent" }}>
                    {m === "test" ? "🧪 Test" : "🚀 Live"}
                  </button>
                ))}
              </div>
            </div>

            {/* Key ID */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Key ID</label>
              <input type="text" value={keyId} onChange={e => setKeyId(e.target.value)}
                placeholder={mode === "test" ? "rzp_test_..." : "rzp_live_..."}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ border: "1px solid #CBD5E1", outline: "none", color: "#0F172A" }} />
              {savedKeyId && <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Saved: {savedKeyId.slice(0, 12)}…</p>}
            </div>

            {/* Key Secret */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Key Secret <span style={{ color: "#94A3B8" }}>(leave blank to keep existing)</span></label>
              <div className="relative">
                <input type={showSecret ? "text" : "password"} value={keySecret} onChange={e => setKeySecret(e.target.value)}
                  placeholder="••••••••••••••••••••••"
                  className="w-full px-3 py-2 rounded-lg text-sm pr-10"
                  style={{ border: "1px solid #CBD5E1", outline: "none", color: "#0F172A" }} />
                <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-2.5" style={{ color: "#94A3B8" }}>
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Stored server-side only — never exposed to the browser</p>
            </div>

            {/* Webhook Secret */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Webhook Secret <span style={{ color: "#94A3B8" }}>(leave blank to keep existing)</span></label>
              <div className="relative">
                <input type={showWebhook ? "text" : "password"} value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)}
                  placeholder="••••••••••••••••••••••"
                  className="w-full px-3 py-2 rounded-lg text-sm pr-10"
                  style={{ border: "1px solid #CBD5E1", outline: "none", color: "#0F172A" }} />
                <button type="button" onClick={() => setShowWebhook(!showWebhook)} className="absolute right-3 top-2.5" style={{ color: "#94A3B8" }}>
                  {showWebhook ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Stored server-side only — never exposed to the browser</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                style={{ background: saved ? "#10B981" : "#3B82F6" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saved ? "Saved!" : "Save Configuration"}
              </button>
              <button type="button" onClick={testConnection} disabled={testing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                style={{ background: "#F1F5F9", color: "#374151" }}>
                {testing ? <Loader2 size={14} className="animate-spin" /> : "🔌"}
                Test Connection
              </button>
            </div>
          </form>
        )}

        {testResult && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
            style={{ background: testResult.success ? "#D1FAE5" : "#FEE2E2", color: testResult.success ? "#059669" : "#DC2626" }}>
            {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
