"use client";

import { type Invoice } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusBg,
} from "@/lib/utils";
import Link from "next/link";

interface InvoiceTableProps {
  invoices: Invoice[];
  loading?: boolean;
}

export function InvoiceTable({ invoices, loading }: InvoiceTableProps) {
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
                "Invoice #",
                "Period",
                "Subtotal",
                "GST",
                "Total",
                "Due Date",
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
              ? [...Array(5)].map((_, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--border-muted)" }}
                  >
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div
                          className="skeleton h-4 rounded"
                          style={{ width: j === 0 ? "100px" : "70px" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:opacity-80 transition-opacity"
                    style={{ borderBottom: "1px solid var(--border-muted)" }}
                  >
                    <td
                      className="px-4 py-3 font-mono font-medium"
                      style={{ color: "var(--text-primary)", fontFamily: "monospace" }}
                    >
                      {inv.invoice_number}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatDate(inv.period_start, "dd MMM")}–
                      {formatDate(inv.period_end, "dd MMM yyyy")}
                    </td>
                    <td
                      className="px-4 py-3 tabular-nums"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td
                      className="px-4 py-3 tabular-nums"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatCurrency(inv.gst_amount)}
                    </td>
                    <td
                      className="px-4 py-3 tabular-nums font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatCurrency(inv.total)}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap tabular-nums"
                      style={{
                        color:
                          inv.status === "overdue"
                            ? "#EF4444"
                            : "var(--text-secondary)",
                      }}
                    >
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${getInvoiceStatusBg(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="text-xs hover:opacity-70"
                        style={{ color: "var(--accent)" }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
            {!loading && invoices.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
