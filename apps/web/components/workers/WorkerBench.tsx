"use client";

import { type Worker } from "@/lib/api";
import { ReliabilityBadge } from "./ReliabilityBadge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface WorkerBenchProps {
  workers: Worker[];
  loading?: boolean;
}

export function WorkerBench({ workers, loading }: WorkerBenchProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="overflow-table">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {[
                "Worker",
                "Skills",
                "Reliability",
                "Total Shifts",
                "No-shows",
                "Last Shift",
                "Status",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{
                    color: "var(--text-muted)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(6)].map((_, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--border-muted)" }}
                  >
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div
                          className="skeleton h-4 rounded"
                          style={{ width: j === 0 ? "120px" : "60px" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : workers.map((w) => (
                  <tr
                    key={w.id}
                    className="hover:opacity-80 transition-opacity"
                    style={{ borderBottom: "1px solid var(--border-muted)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{
                            background: "var(--surface-overlay)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {w.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p
                            className="font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {w.name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {w.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {w.skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              background: "var(--surface-overlay)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-muted)",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                        {w.skills.length > 3 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ color: "var(--text-muted)" }}
                          >
                            +{w.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ReliabilityBadge score={w.reliability_score} />
                    </td>
                    <td
                      className="px-4 py-3 tabular-nums"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {w.total_shifts}
                    </td>
                    <td
                      className="px-4 py-3 tabular-nums"
                      style={{
                        color: w.no_show_count > 3 ? "#EF4444" : "var(--text-secondary)",
                      }}
                    >
                      {w.no_show_count}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap tabular-nums"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {w.last_shift_date ? formatDate(w.last_shift_date) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded capitalize"
                        style={
                          w.status === "active"
                            ? { background: "#14532D22", color: "#22C55E" }
                            : w.status === "suspended"
                            ? { background: "#7F1D1D22", color: "#EF4444" }
                            : { background: "var(--surface-overlay)", color: "var(--text-muted)" }
                        }
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/ops/workers/${w.id}`}
                        className="text-xs hover:opacity-70"
                        style={{ color: "var(--accent)" }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
            {!loading && workers.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  No workers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
