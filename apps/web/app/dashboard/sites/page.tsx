"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { getSites, createSite, updateSite, type Site } from "@/lib/api";
import { Plus, MapPin, CheckCircle2, XCircle, Edit2, Loader2 } from "lucide-react";

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("150");

  useEffect(() => {
    getSites()
      .then(setSites)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openNewForm() {
    setEditSite(null);
    setName(""); setAddress(""); setCity(""); setLat(""); setLng(""); setRadius("150");
    setShowForm(true);
  }

  function openEditForm(site: Site) {
    setEditSite(site);
    setName(site.name);
    setAddress(site.address);
    setCity(site.city);
    setLat(site.geofence?.lat?.toString() ?? "");
    setLng(site.geofence?.lng?.toString() ?? "");
    setRadius(site.geofence?.radiusMeters?.toString() ?? "150");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: Partial<Site> = {
      name, address, city,
      geofence: lat && lng
        ? { lat: parseFloat(lat), lng: parseFloat(lng), radiusMeters: parseInt(radius) }
        : null,
    };
    try {
      if (editSite) {
        const updated = await updateSite(editSite.id, body);
        setSites((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      } else {
        const created = await createSite(body);
        setSites((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  const fieldStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    outline: "none",
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Sites" />

      <div className="px-6 py-5 max-w-4xl space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {sites.length} site{sites.length !== 1 ? "s" : ""} configured
          </p>
          <button
            onClick={openNewForm}
            className="flex items-center gap-1.5 px-3 h-8 rounded text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={13} />
            Add Site
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div
            className="rounded-lg p-5"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              {editSite ? "Edit Site" : "New Site"}
            </p>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Site Name *
                  </label>
                  <input required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm" style={fieldStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    City *
                  </label>
                  <input required value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm" style={fieldStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Address
                </label>
                <input value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded text-sm" style={fieldStyle} />
              </div>
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Geofence (optional)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Latitude</label>
                    <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)}
                      placeholder="28.6139" className="w-full px-3 py-2 rounded text-sm" style={fieldStyle} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Longitude</label>
                    <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)}
                      placeholder="77.2090" className="w-full px-3 py-2 rounded text-sm" style={fieldStyle} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Radius (m)</label>
                    <input type="number" min="50" max="2000" value={radius} onChange={(e) => setRadius(e.target.value)}
                      className="w-full px-3 py-2 rounded text-sm tabular-nums" style={fieldStyle} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "var(--accent)" }}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {editSite ? "Save Changes" : "Create Site"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ background: "var(--surface-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sites list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {sites.map((site) => (
              <div
                key={site.id}
                className="flex items-center gap-4 rounded-lg px-4 py-3.5"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded shrink-0"
                  style={{ background: "var(--surface-overlay)" }}
                >
                  <MapPin size={14} style={{ color: "var(--accent)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {site.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {site.city}{site.address ? ` — ${site.address}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {site.geofence ? (
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                      style={{ background: "#14532D22", color: "#22C55E" }}
                    >
                      <CheckCircle2 size={10} /> Geofence {site.geofence.radiusMeters}m
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                      style={{ background: "var(--surface-overlay)", color: "var(--text-muted)" }}
                    >
                      <XCircle size={10} /> No geofence
                    </span>
                  )}
                  {site.active ? (
                    <span className="text-xs" style={{ color: "#22C55E" }}>Active</span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Inactive</span>
                  )}
                  <button
                    onClick={() => openEditForm(site)}
                    className="p-1.5 rounded transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {sites.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                No sites configured yet. Add your first site.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
