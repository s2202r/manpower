import { Header } from "@/components/layout/Header";
import { ShieldCheck, Clock } from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Compliance" />

      <div className="px-6 py-5 max-w-3xl">
        <div
          className="flex flex-col items-center justify-center rounded-lg py-20 px-6 text-center"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full mb-5"
            style={{ background: "var(--surface-overlay)" }}
          >
            <ShieldCheck size={24} style={{ color: "var(--accent)" }} />
          </div>

          <div
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-3 px-2.5 py-1 rounded"
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              letterSpacing: "0.1em",
            }}
          >
            <Clock size={11} />
            Roadmap
          </div>

          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--text-primary)", textWrap: "balance" } as React.CSSProperties}
          >
            Compliance Dashboard
          </h2>
          <p
            className="text-sm max-w-md"
            style={{ color: "var(--text-muted)" }}
          >
            Labour law compliance monitoring, PF/ESI contribution tracking,
            contractor licence management, and audit-ready documentation — coming
            in a future release.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
            {[
              { label: "Labour Law Monitoring", eta: "Q3 2025" },
              { label: "PF / ESI Tracker", eta: "Q3 2025" },
              { label: "Audit Export", eta: "Q4 2025" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded p-3 text-left"
                style={{
                  background: "var(--surface-overlay)",
                  border: "1px solid var(--border)",
                }}
              >
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {item.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  ETA {item.eta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
