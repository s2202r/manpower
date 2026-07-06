// Enums
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  WORKER = 'WORKER',
  OPS_ADMIN = 'OPS_ADMIN',
}

export enum SkillTag {
  GENERAL_HELPER = 'GENERAL_HELPER',
  FORKLIFT_MHE = 'FORKLIFT_MHE',
  SCANNER_TRAINED = 'SCANNER_TRAINED',
  COLD_STORAGE = 'COLD_STORAGE',
}

export enum RequestStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  NO_SHOW = 'NO_SHOW',
}

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Fill rate thresholds
export const FILL_RATE_GREEN = 0.95;
export const FILL_RATE_AMBER = 0.70;

export type FillRateStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED';

export function getFillRateStatus(requested: number, confirmed: number): FillRateStatus {
  if (requested === 0) return 'ON_TRACK';
  const rate = confirmed / requested;
  if (rate >= FILL_RATE_GREEN) return 'ON_TRACK';
  if (rate >= FILL_RATE_AMBER) return 'AT_RISK';
  return 'BREACHED';
}

// Reliability score formula: completedShifts/acceptedShifts * 0.6 + (1 - noShows/offeredShifts) * 0.4 * 100
export function computeReliabilityScore(
  totalShiftsCompleted: number,
  totalShiftsAccepted: number,
  totalNoShows: number,
  totalShiftsOffered: number
): number {
  const completionRate = totalShiftsAccepted > 0 ? totalShiftsCompleted / totalShiftsAccepted : 1;
  const showUpRate = totalShiftsOffered > 0 ? 1 - totalNoShows / totalShiftsOffered : 1;
  return Math.min(100, Math.max(0, (completionRate * 0.6 + showUpRate * 0.4) * 100));
}

// Overbooking buffer suggestion
export function computeOverbookingBuffer(
  headcount: number,
  acceptRate: number,
  showUpRate: number
): number {
  const suggested = Math.ceil(headcount / (acceptRate * showUpRate));
  return suggested - headcount;
}

// Haversine distance in meters
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GST rate
export const GST_RATE = 0.18;
export const DEFAULT_HOURLY_RATE = 120; // INR
export const NET_PAYMENT_DAYS = 15;

// Skill labels (human readable)
export const SKILL_LABELS: Record<SkillTag, string> = {
  [SkillTag.GENERAL_HELPER]: 'General Helper',
  [SkillTag.FORKLIFT_MHE]: 'Forklift / MHE',
  [SkillTag.SCANNER_TRAINED]: 'Scanner Trained',
  [SkillTag.COLD_STORAGE]: 'Cold Storage',
};
