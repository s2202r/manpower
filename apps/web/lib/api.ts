import { supabase } from "./supabase";

// Empty string = use relative /api/* paths (works on Vercel and local Next.js dev)
// Set NEXT_PUBLIC_API_URL to point to a separate NestJS server if needed
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  geofence: { lat: number; lng: number; radiusMeters: number } | null;
  active: boolean;
  created_at: string;
}

export interface SkillTag {
  id: string;
  label: string;
}

export interface StaffingRequest {
  id: string;
  site_id: string;
  site?: Site;
  date: string;
  shift_start: string;
  shift_end: string;
  headcount: number;
  skill_tags: string[];
  recurring: boolean;
  recurrence_rule?: string;
  status: "draft" | "pending" | "confirmed" | "active" | "completed" | "cancelled";
  requested_count: number;
  confirmed_count: number;
  checked_in_count: number;
  fill_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  email?: string;
  skills: string[];
  reliability_score: number;
  last_shift_date?: string;
  total_shifts: number;
  no_show_count: number;
  late_count: number;
  status: "active" | "inactive" | "suspended";
  selfie_url?: string;
}

export interface AttendanceRecord {
  id: string;
  worker_id: string;
  worker?: Worker;
  request_id: string;
  check_in_time: string;
  check_out_time?: string;
  hours_accrued: number;
  selfie_url?: string;
  location_verified: boolean;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  workers: number;
  hours: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  period_start: string;
  period_end: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  booked_amount: number;
  billed_amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "disputed";
  due_date: string;
  razorpay_payment_link?: string;
  pdf_url?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  type: "no_show" | "at_risk" | "breached" | "overbooking" | "backfill";
  severity: "info" | "warning" | "critical";
  message: string;
  request_id?: string;
  worker_id?: string;
  created_at: string;
  resolved: boolean;
}

export interface DashboardSummary {
  active_requests: number;
  fill_rate_avg: number;
  on_track_count: number;
  at_risk_count: number;
  breached_count: number;
  workers_checked_in_today: number;
  pending_invoices: number;
  pending_invoice_amount: number;
}

export interface OverbookingSuggestion {
  request_id: string;
  request?: StaffingRequest;
  suggested_extra: number;
  reason: string;
  estimated_no_show_rate: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboardSummary = () =>
  apiFetch<DashboardSummary>("/api/dashboard/summary");

export const getAlerts = (resolved = false) =>
  apiFetch<Alert[]>(`/api/alerts?resolved=${resolved}`);

// ── Requests ──────────────────────────────────────────────────────────────────

export const getRequests = (params?: {
  status?: string;
  site_id?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return apiFetch<StaffingRequest[]>(`/api/requests${qs}`);
};

export const getRequest = (id: string) =>
  apiFetch<StaffingRequest>(`/api/requests/${id}`);

export const createRequest = (body: Partial<StaffingRequest>) =>
  apiFetch<StaffingRequest>("/api/requests", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateRequest = (id: string, body: Partial<StaffingRequest>) =>
  apiFetch<StaffingRequest>(`/api/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const getRequestAttendance = (id: string) =>
  apiFetch<AttendanceRecord[]>(`/api/requests/${id}/attendance`);

// ── Workers ───────────────────────────────────────────────────────────────────

export const getWorkers = (params?: {
  status?: string;
  skill?: string;
  min_reliability?: number;
}) => {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return apiFetch<Worker[]>(`/api/workers${qs}`);
};

export const getWorker = (id: string) =>
  apiFetch<Worker>(`/api/workers/${id}`);

export const getWorkerAttendance = (id: string) =>
  apiFetch<AttendanceRecord[]>(`/api/workers/${id}/attendance`);

// ── Sites ─────────────────────────────────────────────────────────────────────

export const getSites = () => apiFetch<Site[]>("/api/sites");

export const getSite = (id: string) => apiFetch<Site>(`/api/sites/${id}`);

export const createSite = (body: Partial<Site>) =>
  apiFetch<Site>("/api/sites", { method: "POST", body: JSON.stringify(body) });

export const updateSite = (id: string, body: Partial<Site>) =>
  apiFetch<Site>(`/api/sites/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

// ── Invoices ──────────────────────────────────────────────────────────────────

export const getInvoices = (params?: { status?: string }) => {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return apiFetch<Invoice[]>(`/api/invoices${qs}`);
};

export const getInvoice = (id: string) =>
  apiFetch<Invoice>(`/api/invoices/${id}`);

export const getInvoicePdfUrl = (id: string) =>
  `${API_URL}/api/invoices/${id}/pdf`;

// ── Ops / Analytics ───────────────────────────────────────────────────────────

export const getOverbookingSuggestions = () =>
  apiFetch<OverbookingSuggestion[]>("/api/ops/overbooking-suggestions");

export const getBackfillAlerts = () =>
  apiFetch<Alert[]>("/api/ops/backfill-alerts");

export interface FillRateDataPoint {
  date: string;
  requested: number;
  confirmed: number;
  checked_in: number;
  fill_rate: number;
}

export const getFillRateAnalytics = (days = 30) =>
  apiFetch<FillRateDataPoint[]>(`/api/ops/fill-rate-analytics?days=${days}`);

export interface SkillDemandPoint {
  skill: string;
  demand: number;
  supply: number;
}

export const getSkillDemand = () =>
  apiFetch<SkillDemandPoint[]>("/api/ops/skill-demand");

// ── Skill tags ────────────────────────────────────────────────────────────────

export const getSkillTags = () => apiFetch<SkillTag[]>("/api/skill-tags");
