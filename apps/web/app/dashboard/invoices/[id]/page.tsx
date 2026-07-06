"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getInvoice, getInvoicePdfUrl, type Invoice } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusBg,
} from "@/lib/utils";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvoice(id)
      .then(setInvoice)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const pdfUrl = getInvoicePdfUrl(id);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header />

      <div className="px-6 py-5 max-w-3xl">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} />
            Invoices
          </Link>
          {invoice && (
            <>
              <span style={{ color: "var(--border)" }}>/</span>
              <span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                {invoice.invoice_number}
              </span>
              <span
                className={`ml-1 text-xs font-medium px-2 py-0.5 rounded capitalize ${getInvoiceStatusBg(invoice.status)}`}
              >
                {invoice.status}
              </span>
            </>
          )}

          {invoice && (
            <div className="ml-auto flex items-center gap-2">
              <a
                href={pdfUrl}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-70"
                style={{
                  background: "var(--surface-overlay)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <Download size={12} />
                Download PDF
              </a>
              {invoice.razorpay_payment_link && (
                <a
                  href={invoice.razorpay_payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white"
                  style={{ background: "#2563EB" }}
                >
                  <ExternalLink size={12} />
                  Pay via Razorpay
                </a>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : invoice ? (
          <div className="space-y-5">
            {/* Header */}
            <div
              className="rounded-lg p-5"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={16} style={{ color: "var(--accent)" }} />
                    <span
                      className="text-base font-semibold font-mono"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {invoice.invoice_number}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Period: {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Due {formatDate(invoice.due_date)}
                  </p>
                  <p
                    className="text-2xl font-bold tabular-nums mt-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatCurrency(invoice.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="px-4 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
                >
                  Line Items
                </p>
              </div>
              <div className="overflow-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-muted)" }}>
                      {["Description", "Workers", "Hours", "Rate/hr", "Amount"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
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
                    {invoice.line_items.map((item) => (
                      <tr
                        key={item.id}
                        style={{ borderBottom: "1px solid var(--border-muted)" }}
                      >
                        <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                          {item.description}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          {item.workers}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          {item.hours}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          {formatCurrency(item.rate)}
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div
                className="px-4 py-3 space-y-1.5"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <TotalRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
                <TotalRow
                  label={`GST (${(invoice.gst_rate * 100).toFixed(0)}%)`}
                  value={formatCurrency(invoice.gst_amount)}
                  muted
                />
                <div
                  className="h-px"
                  style={{ background: "var(--border)", margin: "6px 0" }}
                />
                <TotalRow
                  label="Total"
                  value={formatCurrency(invoice.total)}
                  bold
                />
              </div>
            </div>

            {/* Booked vs billed callout */}
            {invoice.booked_amount !== invoice.billed_amount && (
              <div
                className="rounded-lg p-4 flex items-start gap-3"
                style={{
                  background: "#78350F18",
                  border: "1px solid #F59E0B44",
                }}
              >
                <span style={{ color: "#F59E0B", marginTop: 2 }}>⚠</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F59E0B" }}>
                    Booked vs Billed discrepancy
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Booked: {formatCurrency(invoice.booked_amount)} · Billed:{" "}
                    {formatCurrency(invoice.billed_amount)} · Delta:{" "}
                    {formatCurrency(invoice.billed_amount - invoice.booked_amount)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>Invoice not found.</p>
        )}
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="text-sm"
        style={{ color: muted ? "var(--text-muted)" : "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="text-sm tabular-nums"
        style={{
          color: "var(--text-primary)",
          fontWeight: bold ? 700 : 400,
          fontSize: bold ? "1rem" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
