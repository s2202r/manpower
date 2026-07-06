"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { getWorkers, type Worker } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function OpsWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getWorkers()
      .catch(() => [])
      .then((w) => {
        setWorkers(w as Worker[]);
        setLoading(false);
      });
  }, []);

  const filtered = workers.filter((w) => {
    const q = search.toLowerCase();
    return (
      !q ||
      w.name.toLowerCase().includes(q) ||
      w.phone?.toLowerCase().includes(q) ||
      w.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <Header />
      <div className="px-6 py-5 max-w-4xl">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/ops"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} />
            Ops Console
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>Workers</span>
        </div>

        <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Worker Roster
        </h1>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by name, phone, or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: "var(--text-muted)" }}>
            No workers found.
          </p>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
          >
            {filtered.map((w, i) => (
              <Link
                key={w.id}
                href={`/ops/workers/${w.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:opacity-80 transition-opacity"
                style={{
                  borderTop: i > 0 ? "1px solid var(--border-muted)" : undefined,
                  display: "flex",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: "var(--surface-overlay)", color: "var(--text-secondary)" }}
                >
                  {w.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {w.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {w.phone} · {w.skills.slice(0, 2).join(", ") || "No skills"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded"
                    style={{
                      background:
                        w.reliability_score >= 80
                          ? "#14532D22"
                          : w.reliability_score >= 60
                          ? "#78350F22"
                          : "#7F1D1D22",
                      color:
                        w.reliability_score >= 80
                          ? "#22C55E"
                          : w.reliability_score >= 60
                          ? "#F59E0B"
                          : "#EF4444",
                    }}
                  >
                    {w.reliability_score}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
