"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [fillRateAlerts, setFillRateAlerts] = useState(true);
  const [invoiceReminders, setInvoiceReminders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setDisplayName(user.user_metadata?.full_name ?? "");
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    alert("Saved");
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const inputStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    outline: "none",
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--surface)", color: "var(--text-primary)" }}
    >
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>

        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Settings
        </h1>

        {/* Account section */}
        <section
          className="rounded-lg"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
            >
              Account
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-3 py-2 rounded text-sm opacity-60 cursor-not-allowed"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded text-sm"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </div>
        </section>

        {/* Company section */}
        <section
          className="rounded-lg"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
            >
              Company
            </p>
          </div>
          <form onSubmit={handleSave} className="p-4 space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Logistics Pvt. Ltd."
                className="w-full px-3 py-2 rounded text-sm"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Address line
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Warehouse Road"
                className="w-full px-3 py-2 rounded text-sm"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full px-3 py-2 rounded text-sm"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="MH"
                  className="w-full px-3 py-2 rounded text-sm"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Pincode
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="400001"
                  className="w-full px-3 py-2 rounded text-sm"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity disabled:opacity-60"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </section>

        {/* Notifications section */}
        <section
          className="rounded-lg"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
            >
              Notifications
            </p>
          </div>
          <div className="p-4 space-y-4">
            {[
              {
                label: "Fill-rate alerts via email",
                sub: "Get emailed when a request drops below 80% fill rate",
                value: fillRateAlerts,
                set: setFillRateAlerts,
              },
              {
                label: "Invoice reminders",
                sub: "Remind me 3 days before invoices are due",
                value: invoiceReminders,
                set: setInvoiceReminders,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {item.sub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => item.set(!item.value)}
                  className="relative shrink-0 w-10 h-5 rounded-full transition-colors"
                  style={{
                    background: item.value ? "var(--accent)" : "var(--border)",
                  }}
                  aria-checked={item.value}
                  role="switch"
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: item.value ? "translateX(21px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section
          className="rounded-lg"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid #EF444433",
          }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid #EF444422" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#EF4444", letterSpacing: "0.07em" }}
            >
              Danger zone
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Sign out
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  You will be redirected to the login page
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity disabled:opacity-60"
                style={{
                  background: "#EF444422",
                  color: "#EF4444",
                  border: "1px solid #EF444433",
                }}
              >
                {signingOut && <Loader2 size={13} className="animate-spin" />}
                Sign out
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
