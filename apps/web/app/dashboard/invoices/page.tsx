"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { getInvoices, type Invoice } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const STATUS_OPTIONS = ["all", "draft", "sent", "paid", "overdue", "disputed"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
    getInvoices(params)
      .then(setInvoices)
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Invoices" />

      <div className="px-6 py-5 max-w-6xl space-y-5">
        {/* Summary strip */}
        {!loading && (
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Outstanding</p>
              <p className="text-xl font-semibold tabular-nums" style={{ color: "#F59E0B" }}>
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Overdue</p>
              <p className="text-xl font-semibold tabular-nums" style={{ color: "#EF4444" }}>
                {invoices.filter((i) => i.status === "overdue").length}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Paid (this period)</p>
              <p className="text-xl font-semibold tabular-nums" style={{ color: "#22C55E" }}>
                {formatCurrency(invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0))}
              </p>
            </div>
          </div>
        )}

        {/* Status filter */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded w-fit"
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

        <InvoiceTable invoices={invoices} loading={loading} />
      </div>
    </div>
  );
}
