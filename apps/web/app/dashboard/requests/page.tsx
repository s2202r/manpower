"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { getRequests, type StaffingRequest } from "@/lib/api";
import {
  formatDate,
  formatPercent,
  getFillStatus,
  getFillStatusColor,
  getRequestStatusBg,
} from "@/lib/utils";
import { Plus, Filter, Search } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  "all",
  "draft",
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<StaffingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
    setLoading(true);
    getRequests(params)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.site?.name?.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      r.skill_tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Staffing Requests" />

      <div className="px-6 py-5 max-w-6xl">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center gap-2 px-3 h-8 rounded flex-1 max-w-xs"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <Search size={13} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by site, date, skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm flex-1 outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          {/* Status tabs */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded"
            style={{ background: "var(--surface-overlay)" }}
          >
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors"
                style={
                  statusFilter === s
                    ? {
                        background: "var(--surface-raised)",
                        color: "var(--text-primary)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                      }
                    : { color: "var(--text-muted)" }
                }
              >
                {s}
              </button>
            ))}
          </div>

          <Link
            href="/dashboard/requests/new"
            className="flex items-center gap-1.5 px-3 h-8 rounded text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={13} />
            New Request
          </Link>
        </div>

        {/* Table */}
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
                    "Site",
                    "Date",
                    "Shift",
                    "Headcount",
                    "Confirmed",
                    "Checked In",
                    "Fill Rate",
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
                      <tr key={i} style={{ borderBottom: "1px solid var(--border-muted)" }}>
                        {[...Array(9)].map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="skeleton h-4 rounded" style={{ width: j === 0 ? "120px" : "60px" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.map((r) => {
                      const status = getFillStatus(r.fill_rate);
                      const fillColor = getFillStatusColor(status);
                      return (
                        <tr
                          key={r.id}
                          className="transition-colors hover:opacity-80"
                          style={{ borderBottom: "1px solid var(--border-muted)" }}
                        >
                          <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                            {r.site?.name ?? `Site ${r.site_id.slice(0, 6)}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            {formatDate(r.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            {r.shift_start}–{r.shift_end}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-center" style={{ color: "var(--text-secondary)" }}>
                            {r.headcount}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-center" style={{ color: "var(--text-secondary)" }}>
                            {r.confirmed_count}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-center" style={{ color: "var(--text-secondary)" }}>
                            {r.checked_in_count}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-semibold tabular-nums w-10"
                                style={{ color: fillColor }}
                              >
                                {formatPercent(r.fill_rate, 0)}
                              </span>
                              <div
                                className="flex-1 h-1.5 rounded-full overflow-hidden"
                                style={{ background: "var(--border)", width: "48px" }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${r.fill_rate}%`, background: fillColor }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${getRequestStatusBg(r.status)}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/requests/${r.id}`}
                              className="text-xs hover:opacity-70"
                              style={{ color: "var(--accent)" }}
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
