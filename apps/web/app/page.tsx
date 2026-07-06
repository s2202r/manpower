"use client";

import Link from "next/link";
import { useState } from "react";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
    >
      {children}
    </span>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>{value}</p>
      <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [sent, setSent] = useState(false);

  return (
    <div style={{ background: "var(--surface)", color: "var(--text-primary)", fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--accent)" }}>W</div>
            <span className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>Work4.in</span>
          </a>
          <nav className="hidden md:flex items-center gap-6">
            {[["About", "#about"], ["Features", "#features"], ["How it works", "#how-it-works"], ["Policies", "#policies"], ["Contact", "#contact"]].map(([label, href]) => (
              <a key={href} href={href} className="text-sm transition-opacity hover:opacity-70" style={{ color: "var(--text-secondary)" }}>{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/worker/login" className="inline-flex items-center px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-80" style={{ border: "1px solid var(--border)", color: "var(--text-primary)", background: "var(--surface-raised)" }}>
              Worker
            </Link>
            <Link href="/auth/login" className="inline-flex items-center px-3 py-1.5 rounded text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: "var(--accent)" }}>
              Client
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <Badge>Now live in Delhi NCR · Gurgaon · Noida</Badge>
        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
          On-demand warehouse<br className="hidden sm:block" />
          <span style={{ color: "var(--accent)" }}> staffing, simplified.</span>
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-lg" style={{ color: "var(--text-secondary)" }}>
          Connect verified blue-collar workers to warehouse shifts in minutes. Real-time fill-rate tracking, geofenced check-ins, and GST-ready invoicing — all in one platform.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/login" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "var(--accent)" }}>
            Get started — it&apos;s free →
          </Link>
          <Link href="/worker/login" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-medium transition-opacity hover:opacity-80" style={{ border: "1px solid var(--border)", color: "var(--text-primary)", background: "var(--surface-raised)" }}>
            I&apos;m a worker — find shifts
          </Link>
        </div>
        <div className="mt-14 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
          <StatCard value="500+" label="Verified workers" />
          <StatCard value="94%" label="Average fill rate" />
          <StatCard value="2 min" label="Avg. time to confirm" />
          <StatCard value="₹0" label="Hidden fees" />
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20" style={{ background: "var(--surface-raised)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge>About Work4.in</Badge>
            <h2 className="mt-4 text-3xl font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
              Built for the logistics operators who keep India moving.
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Work4.in is a B2B staffing platform purpose-built for warehouses, distribution centres, and last-mile hubs in India. We bridge the gap between operations managers who need reliable manpower at short notice and workers who want steady, fairly-paid shifts.
            </p>
            <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Founded in Delhi NCR, we understand the chaos of last-minute absenteeism, the pain of calling ten contractors before a shift starts, and the compliance headaches that come with contract labour. Work4.in solves all three.
            </p>
            <ul className="mt-5 space-y-2">
              {["Verified, skill-tagged worker pool", "Geofenced attendance with selfie check-in", "GST-compliant invoicing with Razorpay integration", "ESIC / PF / CLRA compliance dashboard (coming soon)"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent)", marginTop: 2 }}>✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative hidden md:flex flex-col gap-4">
            <div className="rounded-xl p-5" style={{ background: "var(--surface-overlay)", border: "1px solid var(--border)", transform: "rotate(1.5deg)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>SHIFT REQUEST</p>
              <p className="mt-1 font-semibold" style={{ color: "var(--text-primary)" }}>Gurgaon Warehouse — 15 loaders</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Today · 08:00 – 16:00</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 rounded-full flex-1" style={{ background: "#22C55E22" }}>
                  <div className="h-2 rounded-full" style={{ background: "#22C55E", width: "94%" }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: "#22C55E" }}>94% filled</span>
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ background: "var(--accent)", transform: "rotate(-1deg)" }}>
              <p className="text-xs font-semibold text-blue-100">WORKER CHECK-IN</p>
              <p className="mt-1 font-semibold text-white">Rahul Sharma checked in ✓</p>
              <p className="text-sm mt-1 text-blue-100">Noida DC · 07:58 AM · Location verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <Badge>Features</Badge>
          <h2 className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Everything your ops team needs</h2>
          <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
            From shift creation to invoice download — manage your entire contract workforce without spreadsheets or phone calls.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard icon="📋" title="Staffing Requests" desc="Create shift requests with site, date, time window, headcount, and required skills. One form — done in 60 seconds." />
          <FeatureCard icon="📊" title="Live Fill-Rate Dashboard" desc="See requested → confirmed → checked-in counts in real time. Green / amber / red status so you know where to act." />
          <FeatureCard icon="📍" title="Geofenced Check-In" desc="Workers check in only when physically on-site. GPS + selfie timestamp creates a tamper-proof attendance record." />
          <FeatureCard icon="🧾" title="GST-Ready Invoicing" desc="Automatic per-shift line items, 18% GST, PDF download, and Razorpay payment link. Net-15 terms built in." />
          <FeatureCard icon="🔁" title="Smart Overbooking" desc="Our algorithm analyses no-show history and suggests how many extra workers to book so you always hit headcount." />
          <FeatureCard icon="⚡" title="Backfill Alerts" desc="Get alerted automatically when a shift is at risk. Backfill in one tap from your verified worker bench." />
          <FeatureCard icon="💬" title="WhatsApp Shift Offers" desc="Workers receive shift offers on WhatsApp and can accept or decline without installing anything." />
          <FeatureCard icon="⭐" title="Reliability Scores" desc="Every worker has a score based on attendance, punctuality, and completion rate. Book your best performers first." />
          <FeatureCard icon="🛡️" title="Compliance Ready" desc="ESIC / PF / CLRA compliance dashboard coming soon. KYC document capture built into onboarding." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ background: "var(--surface-raised)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <Badge>How it works</Badge>
            <h2 className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Up and running in minutes</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "var(--accent)" }}>FOR WAREHOUSE OPERATORS</p>
              {[
                { n: "1", title: "Create your account", desc: "Sign up, add your company profile and warehouse sites with geofence radius." },
                { n: "2", title: "Post a staffing request", desc: "Select site, date, shift window, headcount, and required skills. Submit in under a minute." },
                { n: "3", title: "We fill your shift", desc: "Workers are notified via WhatsApp and in-app. You see confirmed headcount rise in real time." },
                { n: "4", title: "Attendance runs itself", desc: "Workers check in with GPS + selfie. You see a live attendance board. No roll-call needed." },
                { n: "5", title: "Get your invoice", desc: "After the shift, a GST invoice is auto-generated. Pay online via Razorpay." },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 mb-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "var(--accent)" }}>{s.n}</div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{s.title}</p>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
              <Link href="/auth/login" className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "var(--accent)" }}>
                Start hiring →
              </Link>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#10B981" }}>FOR WORKERS</p>
              {[
                { n: "1", title: "Register with your phone", desc: "Enter your mobile number, verify with OTP. No app download required — works in any browser." },
                { n: "2", title: "Complete your profile", desc: "Add your skills (loading, forklift, packing, etc.), photo, and KYC documents." },
                { n: "3", title: "Receive shift offers", desc: "Get WhatsApp messages when shifts near you match your skills. Accept with one tap." },
                { n: "4", title: "Check in on-site", desc: "Arrive at the warehouse, tap Check In — your GPS location is verified automatically." },
                { n: "5", title: "Get paid", desc: "Hours are recorded automatically. Earnings show in your wallet. Instant pay coming soon." },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 mb-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "#10B981" }}>{s.n}</div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{s.title}</p>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
              <Link href="/worker/login" className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "#10B981" }}>
                Find shifts →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* POLICIES */}
      <section id="policies" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <Badge>Policies</Badge>
          <h2 className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Transparent. Fair. Compliant.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🔒", title: "Privacy Policy", points: [
                "We collect only data needed to operate — phone, location at check-in, and KYC documents.",
                "Location is captured only at check-in/check-out, never tracked in the background.",
                "Worker KYC documents are stored encrypted and used only for verification.",
                "We never sell personal data to third parties.",
                "Request account and data deletion anytime by contacting support.",
              ]
            },
            {
              icon: "📜", title: "Terms of Service", points: [
                "Work4.in is a technology platform connecting clients with workers. We are not an employer.",
                "Clients are responsible for safe working conditions as per applicable labour laws.",
                "Invoices are due within 15 days of shift completion (Net-15 terms).",
                "Workers must be 18+ and provide valid KYC documents.",
                "Fake check-ins or fraudulent claims result in immediate account suspension.",
              ]
            },
            {
              icon: "💳", title: "Payment & Refund Policy", points: [
                "Invoices are generated after shift completion based on verified attendance records.",
                "Payments are processed securely via Razorpay — UPI, net banking, and cards accepted.",
                "Disputed hours must be raised within 48 hours of shift completion.",
                "Refunds for cancelled shifts are processed within 5–7 business days.",
                "GST at 18% is applied on all invoices as per Indian tax regulations.",
              ]
            },
          ].map((pol) => (
            <div key={pol.title} className="rounded-xl p-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <p className="text-2xl mb-3">{pol.icon}</p>
              <h3 className="font-bold text-base mb-3" style={{ color: "var(--text-primary)" }}>{pol.title}</h3>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                {pol.points.map((p) => <li key={p}>• {p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* INSTALL APP */}
      <section id="install" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div
          className="rounded-2xl p-8 sm:p-12 text-center"
          style={{ background: "var(--accent)", position: "relative", overflow: "hidden" }}
        >
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)" }} />
          <p className="text-sm font-semibold text-blue-100 uppercase tracking-widest mb-3">Works on any device</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Install Work4.in as an app</h2>
          <p className="text-blue-100 text-base max-w-lg mx-auto mb-8">
            No app store needed. Add Work4.in to your home screen directly from your browser for a full native-app experience — offline support included.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="rounded-xl p-4 flex items-center gap-4 text-left" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <span className="text-3xl">📱</span>
              <div>
                <p className="font-semibold text-white text-sm">Android (Chrome)</p>
                <p className="text-blue-100 text-xs mt-0.5">Tap ⋮ → &quot;Add to Home Screen&quot;</p>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-center gap-4 text-left" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <span className="text-3xl">🍎</span>
              <div>
                <p className="font-semibold text-white text-sm">iPhone (Safari)</p>
                <p className="text-blue-100 text-xs mt-0.5">Tap Share → &quot;Add to Home Screen&quot;</p>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-center gap-4 text-left" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <span className="text-3xl">💻</span>
              <div>
                <p className="font-semibold text-white text-sm">Desktop (Chrome/Edge)</p>
                <p className="text-blue-100 text-xs mt-0.5">Click the install icon in the address bar</p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-blue-200 text-xs">Works offline · No app store · Instant updates · Zero storage bloat</p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background: "var(--surface-raised)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <Badge>Contact us</Badge>
            <h2 className="mt-4 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Questions? We&apos;re here.</h2>
            <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
              Whether you&apos;re a warehouse operator wanting a demo or a worker needing help, reach out — we respond within 2 hours on business days.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: "📧", label: "Email", value: "hello@work4.in" },
                { icon: "📱", label: "WhatsApp", value: "+91 98765 43210" },
                { icon: "📍", label: "Office", value: "Sector 44, Gurugram, Haryana 122003" },
                { icon: "🕐", label: "Hours", value: "Mon–Sat, 9 AM – 7 PM IST" },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{c.label}</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            {sent ? (
              <div className="rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-64" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="text-4xl">✅</span>
                <p className="mt-4 font-semibold text-lg" style={{ color: "var(--text-primary)" }}>Message sent!</p>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>We&apos;ll get back to you within 2 business hours.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="rounded-xl p-6 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                {[
                  { id: "name", label: "Your name", type: "text", placeholder: "Rajesh Sharma", key: "name" as const },
                  { id: "contact", label: "Email or WhatsApp number", type: "text", placeholder: "rajesh@company.com or +91 98765 43210", key: "contact" as const },
                ].map((f) => (
                  <div key={f.id}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{f.label}</label>
                    <input required type={f.type} value={form[f.key]} onChange={(e) => setForm((x) => ({ ...x, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Message</label>
                  <textarea required rows={4} value={form.message} onChange={(e) => setForm((x) => ({ ...x, message: e.target.value }))}
                    placeholder="I'm looking to staff a warehouse in Noida with 20 workers per shift..."
                    className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }} />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "var(--accent)" }}>
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <PwaInstallBanner />

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded text-white text-xs font-bold flex items-center justify-center" style={{ background: "var(--accent)" }}>W</div>
                <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Work4.in</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>On-demand warehouse staffing for logistics operators across India.</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Platform</p>
              <ul className="space-y-2">
                <li><Link href="/auth/login" className="text-xs hover:opacity-80" style={{ color: "var(--text-secondary)" }}>Client Dashboard</Link></li>
                <li><Link href="/worker/login" className="text-xs hover:opacity-80" style={{ color: "var(--text-secondary)" }}>Worker Portal</Link></li>
                <li><Link href="/ops" className="text-xs hover:opacity-80" style={{ color: "var(--text-secondary)" }}>Ops Console</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Company</p>
              <ul className="space-y-2">
                {[["About", "#about"], ["Features", "#features"], ["How it works", "#how-it-works"], ["Contact", "#contact"]].map(([label, href]) => (
                  <li key={label}><a href={href} className="text-xs hover:opacity-80" style={{ color: "var(--text-secondary)" }}>{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Legal</p>
              <ul className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Refund Policy"].map((l) => (
                  <li key={l}><a href="#policies" className="text-xs hover:opacity-80" style={{ color: "var(--text-secondary)" }}>{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>© 2026 Work4.in · Made in India 🇮🇳</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>GSTIN: 07AABCU9603R1ZX · CIN: U74999DL2024PTC123456</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
