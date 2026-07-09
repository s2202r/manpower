"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getSites, getRequests, type Site, type StaffingRequest } from "@/lib/api";
import { formatDate, getRequestStatusBg } from "@/lib/utils";
import { ArrowLeft, MapPin, ExternalLink, Users, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [requests, setRequests] = useState<StaffingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSites().catch(() => [] as Site[]),
      getRequests().catch(() => [] as StaffingRequest[]),
    ]).then(([sites, reqs]) => {
      setSite((sites as Site[]).find((s) => s.id === id) ?? null);
      setRequests((reqs as StaffingRequest[]).filter((r) => r.site_id === id));
      setLoading(false);
    });
  }, [id]);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header />
      <div className="px-6 py-5 max-w-4xl">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/dashboard/sites"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} />
            Sites
          </Link>
          {site && (
            <>
              <span style={{ color: "var(--border)" }}>/</span>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{site.name}</span>
            </>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        ) : site ? (
          <div className="space-y-5">
            {/* Site info card */}
            <div
              className="rounded-lg p-5"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    {site.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin size={12} style={{ color: "var(--text-muted)" }} />
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {site.address}
                      {(site as any).city && `, ${(site as any).city}`}
                    </span>
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1"
                  style={
                    site.active
                      ? { background: "#14532D22", color: "#22C55E" }
                      : { background: "var(--surface-overlay)", color: "var(--text-muted)" }
                  }
                >
                  {site.active ? <CheckCircle2 size={10} /> : null}
                  {site.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                <InfoItem label="Geo Radius" value={`${site.geofence?.radiusMeters ?? 150} m`} />
                <InfoItem label="Lat" value={site.geofence?.lat != null ? site.geofence.lat.toFixed(5) : "—"} />
                <InfoItem label="Lng" value={site.geofence?.lng != null ? site.geofence.lng.toFixed(5) : "—"} />
                <InfoItem label="Total Requests" value={String(requests.length)} />
              </div>

              {(site as any).mapsUrl && (
                <a
                  href={(site as any).mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: "var(--accent)" }}
                >
                  <ExternalLink size={12} /> View on Google Maps
                </a>
              )}
            </div>

            {/* Staffing requests */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}>
                  Staffing Requests
                </p>
              </div>
              {requests.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  No staffing requests for this site yet.
                </p>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border-muted)" }}>
                  {requests.map((req) => (
                    <Link
                      key={req.id}
                      href={`/dashboard/requests/${req.id}`}
                      className="flex items-center gap-4 px-4 py-3 transition-opacity hover:opacity-80"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded capitalize"
                            style={{ ...getStatusStyle(req.status) }}
                          >
                            {req.status}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {formatDate(req.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                            <Calendar size={10} /> {req.shift_start} – {req.shift_end}
                          </span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                            <Users size={10} /> {req.confirmed_count}/{req.headcount} filled
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                        {req.id.slice(0, 8)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>Site not found.</p>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function getStatusStyle(status: string) {
  if (status === "OPEN") return { background: "#EFF6FF", color: "#2563EB" };
  if (status === "FILLED") return { background: "#F0FDF4", color: "#16A34A" };
  if (status === "CANCELLED") return { background: "#FEF2F2", color: "#DC2626" };
  return { background: "var(--surface-overlay)", color: "var(--text-muted)" };
}
