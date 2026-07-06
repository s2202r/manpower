"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, CheckCircle2, AlertCircle, Camera, FileText, Building2 } from "lucide-react";

interface WorkerKyc {
  id: string;
  kycStatus: string | null;
  kycDocUrls: string[];
  photoUrl: string | null;
  kycSubmittedAt: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankAccountName: string | null;
  bankVerified: boolean;
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    APPROVED:  { bg: "#F0FDF4", color: "#16A34A", label: "Approved" },
    SUBMITTED: { bg: "#EFF6FF", color: "#1D4ED8", label: "Under Review" },
    PENDING:   { bg: "#FFFBEB", color: "#D97706", label: "Pending" },
    REJECTED:  { bg: "#FEF2F2", color: "#DC2626", label: "Rejected" },
  };
  const s = status ?? "PENDING";
  const { bg, color, label } = map[s] ?? map.PENDING;
  return <span style={{ background: bg, color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>{label}</span>;
}

function FileUploadButton({ label, accept, type, workerId, onDone }: { label: string; accept: string; type: string; workerId: string; onDone: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr("");
    const token = await getToken();
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    const res = await fetch("/api/worker/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (res.ok) { setDone(true); onDone(); }
    else { const d = await res.json(); setErr(d.error ?? "Upload failed"); }
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div>
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: "1px dashed #CBD5E1", background: done ? "#F0FDF4" : "#F8FAFC", color: done ? "#16A34A" : "#475569", cursor: uploading ? "not-allowed" : "pointer", width: "100%", fontSize: 13, fontWeight: 500 }}>
        {uploading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : done ? <CheckCircle2 size={14} /> : <Upload size={14} />}
        {uploading ? "Uploading…" : done ? `${label} uploaded` : `Upload ${label}`}
      </button>
      {err && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>{err}</p>}
      <input ref={ref} type="file" accept={accept} onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

export default function WorkerKycPage() {
  const [worker, setWorker] = useState<WorkerKyc | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  // Bank form
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankError, setBankError] = useState("");

  async function load() {
    const token = await getToken();
    const res = await fetch("/api/worker/profile", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const d = await res.json();
      setWorker(d);
      setBankName(d.bankAccountName ?? "");
      setBankAccount(d.bankAccountNumber ?? "");
      setBankIfsc(d.bankIfsc ?? "");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submitKyc() {
    setSubmitting(true);
    const token = await getToken();
    const res = await fetch("/api/worker/kyc", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) { setSubmitDone(true); await load(); }
    setSubmitting(false);
  }

  async function saveBank(e: React.FormEvent) {
    e.preventDefault();
    setSavingBank(true); setBankError(""); setBankSaved(false);
    const token = await getToken();
    const res = await fetch("/api/worker/bank", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ accountNumber: bankAccount, ifsc: bankIfsc, accountName: bankName }),
    });
    if (res.ok) { setBankSaved(true); await load(); }
    else { const d = await res.json(); setBankError(d.error ?? "Failed"); }
    setSavingBank(false);
  }

  if (loading) return (
    <div style={{ padding: 24, display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <Loader2 size={24} style={{ color: "#1D4ED8", animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!worker) return <p style={{ padding: 24, color: "#64748B" }}>Unable to load KYC info.</p>;

  const canSubmit = (worker.kycDocUrls?.length ?? 0) >= 1 && worker.kycStatus !== "SUBMITTED" && worker.kycStatus !== "APPROVED";

  return (
    <div style={{ padding: "20px 16px", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>KYC & Verification</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Complete your identity verification to unlock payouts</p>

      {/* Status card */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: 0 }}>Verification Status</p>
          {worker.kycSubmittedAt && (
            <p style={{ fontSize: 11, color: "#94A3B8", margin: "3px 0 0" }}>
              Submitted {new Date(worker.kycSubmittedAt).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>
        <StatusBadge status={worker.kycStatus} />
      </div>

      {submitDone && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <CheckCircle2 size={14} color="#16A34A" />
          <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 500 }}>KYC submitted for review.</span>
        </div>
      )}

      {worker.kycStatus === "REJECTED" && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={14} color="#DC2626" style={{ marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "#DC2626" }}>Your KYC was rejected. Please re-upload your documents and resubmit.</span>
        </div>
      )}

      {/* Photo */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Camera size={15} color="#64748B" />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>Profile Photo</p>
          {worker.photoUrl && <CheckCircle2 size={13} color="#16A34A" />}
        </div>
        {worker.photoUrl && (
          <img src={worker.photoUrl} alt="Profile" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", marginBottom: 10, border: "2px solid #E2E8F0" }} />
        )}
        <FileUploadButton label="Profile photo" accept="image/*" type="photo" workerId={worker.id} onDone={load} />
      </div>

      {/* KYC Documents */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <FileText size={15} color="#64748B" />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>Identity Documents</p>
          {(worker.kycDocUrls?.length ?? 0) > 0 && (
            <span style={{ background: "#EFF6FF", color: "#1D4ED8", borderRadius: 10, padding: "0 6px", fontSize: 11, fontWeight: 600 }}>
              {worker.kycDocUrls.length} uploaded
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 10px" }}>Aadhar card, PAN card, or any govt-issued ID</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FileUploadButton label="ID document (front)" accept="image/*,.pdf" type="kyc_doc" workerId={worker.id} onDone={load} />
          <FileUploadButton label="ID document (back)" accept="image/*,.pdf" type="kyc_doc" workerId={worker.id} onDone={load} />
        </div>
      </div>

      {/* Submit KYC */}
      {worker.kycStatus !== "APPROVED" && (
        <button onClick={submitKyc} disabled={!canSubmit || submitting}
          style={{ width: "100%", padding: 14, marginBottom: 20, borderRadius: 10, border: "none", background: canSubmit && !submitting ? "#1D4ED8" : "#E2E8F0", color: canSubmit && !submitting ? "#FFFFFF" : "#94A3B8", fontSize: 14, fontWeight: 600, cursor: canSubmit && !submitting ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {submitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          {worker.kycStatus === "SUBMITTED" ? "KYC Under Review" : "Submit for Verification"}
        </button>
      )}

      {/* Bank Details */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={15} color="#64748B" />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>Bank Account</p>
          </div>
          {worker.bankVerified
            ? <span style={{ background: "#F0FDF4", color: "#16A34A", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>Verified</span>
            : worker.bankAccountNumber
              ? <span style={{ background: "#FFFBEB", color: "#D97706", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>Pending</span>
              : null}
        </div>

        {bankSaved && (
          <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", gap: 6, alignItems: "center" }}>
            <CheckCircle2 size={13} color="#16A34A" />
            <span style={{ fontSize: 12, color: "#16A34A" }}>Bank details saved. Verification pending.</span>
          </div>
        )}
        {bankError && <p style={{ fontSize: 12, color: "#DC2626", marginBottom: 8 }}>{bankError}</p>}

        <form onSubmit={saveBank} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Account holder name", value: bankName, setter: setBankName, placeholder: "As per bank records" },
            { label: "Account number", value: bankAccount, setter: setBankAccount, placeholder: "e.g. 1234567890" },
            { label: "IFSC code", value: bankIfsc, setter: setBankIfsc, placeholder: "e.g. HDFC0001234" },
          ].map(field => (
            <div key={field.label}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>{field.label}</label>
              <input value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, color: "#0F172A", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <button type="submit" disabled={savingBank || !bankName || !bankAccount || !bankIfsc}
            style={{ padding: 12, borderRadius: 10, border: "none", background: bankName && bankAccount && bankIfsc && !savingBank ? "#0F172A" : "#E2E8F0", color: bankName && bankAccount && bankIfsc && !savingBank ? "#FFFFFF" : "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {savingBank && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Save Bank Details
          </button>
        </form>
      </div>
    </div>
  );
}
