import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Fill rate status ──────────────────────────────────────────────────────────

export type FillStatus = "on-track" | "at-risk" | "breached";

export function getFillStatus(fillRate: number): FillStatus {
  if (fillRate >= 95) return "on-track";
  if (fillRate >= 70) return "at-risk";
  return "breached";
}

export function getFillStatusLabel(status: FillStatus): string {
  return { "on-track": "On Track", "at-risk": "At Risk", breached: "Breached" }[status];
}

export function getFillStatusColor(status: FillStatus): string {
  return {
    "on-track": "#22C55E",
    "at-risk": "#F59E0B",
    breached: "#EF4444",
  }[status];
}

export function getFillStatusBg(status: FillStatus): string {
  return {
    "on-track": "status-bg-on-track",
    "at-risk": "status-bg-at-risk",
    breached: "status-bg-breached",
  }[status];
}

// ── Reliability score ─────────────────────────────────────────────────────────

export type ReliabilityTier = "excellent" | "good" | "fair" | "poor";

export function getReliabilityTier(score: number): ReliabilityTier {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "fair";
  return "poor";
}

export function getReliabilityColor(score: number): string {
  const tier = getReliabilityTier(score);
  return {
    excellent: "#22C55E",
    good: "#3B82F6",
    fair: "#F59E0B",
    poor: "#EF4444",
  }[tier];
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string, fmt = "dd MMM yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd MMM yyyy, HH:mm");
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ── Geofence helpers ──────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Geofence {
  center: Coordinates;
  radiusMeters: number;
}

export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const chord =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

export function isInsideGeofence(point: Coordinates, fence: Geofence): boolean {
  return distanceMeters(point, fence.center) <= fence.radiusMeters;
}

// ── Request status ────────────────────────────────────────────────────────────

export type RequestStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled";

export function getRequestStatusColor(status: RequestStatus): string {
  return {
    draft: "#6B7494",
    pending: "#F59E0B",
    confirmed: "#3B82F6",
    active: "#22C55E",
    completed: "#6B7494",
    cancelled: "#EF4444",
  }[status] ?? "#6B7494";
}

export function getRequestStatusBg(status: RequestStatus): string {
  return {
    draft: "bg-[#6B749422] text-[#9BA3B8]",
    pending: "bg-[#F59E0B22] text-[#F59E0B]",
    confirmed: "bg-[#3B82F622] text-[#3B82F6]",
    active: "bg-[#22C55E22] text-[#22C55E]",
    completed: "bg-[#6B749422] text-[#9BA3B8]",
    cancelled: "bg-[#EF444422] text-[#EF4444]",
  }[status] ?? "bg-[#6B749422] text-[#9BA3B8]";
}

// ── Invoice status ────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "disputed";

export function getInvoiceStatusBg(status: InvoiceStatus): string {
  return {
    draft: "bg-[#6B749422] text-[#9BA3B8]",
    sent: "bg-[#3B82F622] text-[#3B82F6]",
    paid: "bg-[#22C55E22] text-[#22C55E]",
    overdue: "bg-[#EF444422] text-[#EF4444]",
    disputed: "bg-[#F59E0B22] text-[#F59E0B]",
  }[status] ?? "bg-[#6B749422] text-[#9BA3B8]";
}
