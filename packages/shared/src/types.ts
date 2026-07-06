/**
 * @manpower/shared — API response types and domain interfaces
 *
 * These types mirror the Prisma schema and are consumed by:
 *   - apps/web   (Next.js customer dashboard)
 *   - apps/worker-app (Expo worker mobile app)
 *   - apps/api   (NestJS backend, as return-type contracts)
 *
 * Import enums and utilities from ./index.ts
 */

import type {
  UserRole,
  SkillTag,
  RequestStatus,
  OfferStatus,
  KycStatus,
  InvoiceStatus,
  PayoutStatus,
  FillRateStatus,
} from './index';

// ---------------------------------------------------------------------------
// Primitive domain objects
// ---------------------------------------------------------------------------

export interface ApiUser {
  id: string;
  supabaseId: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface ApiCompany {
  id: string;
  userId: string;
  name: string;
  gstNumber: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSite {
  id: string;
  companyId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiWorker {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  whatsappOptIn: boolean;
  photoUrl: string | null;
  skills: SkillTag[];
  kycStatus: KycStatus;
  kycDocUrls: string[];
  isActive: boolean;

  // Reliability stats
  reliabilityScore: number;          // 0–100
  totalShiftsOffered: number;
  totalShiftsAccepted: number;
  totalShiftsCompleted: number;
  totalNoShows: number;
  avgPunctualityMins: number;        // negative = early, positive = late

  createdAt: string;
  updatedAt: string;
}

export interface ApiRequest {
  id: string;
  companyId: string;
  siteId: string;
  title: string;
  date: string;           // ISO date "YYYY-MM-DD"
  shiftStart: string;     // "HH:MM" 24h
  shiftEnd: string;       // "HH:MM" 24h
  headcount: number;
  skillTags: SkillTag[];
  status: RequestStatus;
  isRecurring: boolean;
  recurringDays: number[]; // 0=Sun … 6=Sat
  notes: string | null;

  // Fill-rate tracking
  targetHeadcount: number;
  offerBuffer: number;
  fillRateThreshold: number;
  guaranteedHeadcount: number;
  bookedHeadcount: number;

  createdAt: string;
  updatedAt: string;

  // Optional populated relations
  site?: ApiSite;
  company?: ApiCompany;
  offers?: ApiShiftOffer[];
  checkIns?: ApiCheckIn[];
}

export interface ApiShiftOffer {
  id: string;
  requestId: string;
  workerId: string;
  status: OfferStatus;
  offeredAt: string;
  respondedAt: string | null;
  whatsappMsgId: string | null;
  createdAt: string;
  updatedAt: string;

  worker?: ApiWorker;
  request?: ApiRequest;
}

export interface ApiCheckIn {
  id: string;
  workerId: string;
  requestId: string;
  siteId: string;
  checkInAt: string;
  checkInLat: number;
  checkInLng: number;
  checkInSelfieUrl: string | null;
  checkOutAt: string | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
  hoursWorked: number | null;
  isVerified: boolean;
  punctualityMins: number;           // minutes relative to shift start
  createdAt: string;
  updatedAt: string;

  worker?: ApiWorker;
  request?: ApiRequest;
  site?: ApiSite;
}

export interface ApiInvoiceLineItem {
  id: string;
  invoiceId: string;
  checkInId: string;
  workerName: string;
  skillTag: SkillTag;
  hours: number;
  hourlyRate: number;
  amount: number;
  date: string;
  createdAt: string;

  checkIn?: ApiCheckIn;
}

export interface ApiInvoice {
  id: string;
  companyId: string;
  requestId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issuedAt: string | null;
  dueAt: string | null;
  subtotal: number;
  gstAmount: number;
  total: number;
  gstRate: number;
  hourlyRate: number;
  razorpayPaymentLinkId: string | null;
  razorpayPaymentLinkUrl: string | null;
  pdfUrl: string | null;

  // The ROI story fields — booked vs actually billed
  bookedHeadcount: number;
  billedHeadcount: number;
  bookedHours: number;
  billedHours: number;

  createdAt: string;
  updatedAt: string;

  lineItems?: ApiInvoiceLineItem[];
  company?: ApiCompany;
  request?: ApiRequest;
}

export interface ApiPayout {
  id: string;
  workerId: string;
  amount: number;
  hoursWorked: number;
  hourlyRate: number;
  shiftDate: string;
  status: PayoutStatus;
  razorpayPayoutId: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;

  worker?: ApiWorker;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

/** Standard paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Standard single-item response */
export interface ItemResponse<T> {
  data: T;
}

/** Standard error response */
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Analytics / computed response shapes
// ---------------------------------------------------------------------------

/** Returned by GET /analytics/fill-rates */
export interface FillRateAnalytics {
  period: { from: string; to: string };
  overall: {
    totalRequests: number;
    totalHeadcountRequested: number;
    totalHeadcountFilled: number;
    fillRate: number;        // 0–1
    status: FillRateStatus;
  };
  byDate: Array<{
    date: string;
    requested: number;
    filled: number;
    fillRate: number;
    status: FillRateStatus;
  }>;
  bySite: Array<{
    siteId: string;
    siteName: string;
    requested: number;
    filled: number;
    fillRate: number;
  }>;
}

/** Returned by GET /analytics/ops-console */
export interface OpsConsoleData {
  date: string;
  activeRequests: Array<{
    requestId: string;
    title: string;
    siteName: string;
    shiftStart: string;
    shiftEnd: string;
    headcount: number;
    confirmedCount: number;
    checkedInCount: number;
    fillRate: number;
    fillRateStatus: FillRateStatus;
  }>;
  workerStats: {
    totalActive: number;
    avgReliabilityScore: number;
    highTier: number;    // score >= 85
    mediumTier: number;  // score 60–84
    lowTier: number;     // score < 60
  };
  todayAlerts: Array<{
    requestId: string;
    alertType: 'FILL_RISK' | 'NO_SHOW' | 'LATE_CHECKIN';
    message: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
  }>;
}

/** Returned by GET /analytics/revenue */
export interface RevenueAnalytics {
  period: { from: string; to: string };
  totalBilled: number;    // INR
  totalBooked: number;    // INR (what would have been invoiced at booked headcount)
  savings: number;        // totalBooked - totalBilled — the "you saved X" story
  invoiceCount: number;
  byMonth: Array<{
    month: string;        // "YYYY-MM"
    billed: number;
    booked: number;
  }>;
}

/** Returned by GET /analytics/workers */
export interface WorkerAnalytics {
  total: number;
  byKycStatus: Record<KycStatus, number>;
  bySkill: Record<SkillTag, number>;
  reliabilityDistribution: {
    high: number;         // >= 85
    medium: number;       // 60–84
    low: number;          // < 60
  };
  topWorkers: Array<Pick<ApiWorker, 'id' | 'name' | 'reliabilityScore' | 'skills' | 'totalShiftsCompleted'>>;
  bottomWorkers: Array<Pick<ApiWorker, 'id' | 'name' | 'reliabilityScore' | 'totalNoShows'>>;
}

// ---------------------------------------------------------------------------
// Fill-rate / overbooking response shapes (also returned by requests service)
// ---------------------------------------------------------------------------

export interface OverbookingSuggestion {
  recommendedBuffer: number;
  recommendedTotalOffers: number;
  breakdown: {
    headcount: number;
    avgAcceptRate: number;
    avgShowUpRate: number;
    formula: string;
  };
}

export interface FillRiskAlert {
  status: 'OK' | 'AT_RISK' | 'BREACHED';
  confirmedCount: number;
  guaranteedHeadcount: number;
  headcount: number;
  hoursToShift: number;
}

// ---------------------------------------------------------------------------
// Request / mutation DTOs (mirror NestJS DTOs for front-end form validation)
// ---------------------------------------------------------------------------

export interface CreateRequestPayload {
  siteId: string;
  title: string;
  date: string;           // "YYYY-MM-DD"
  shiftStart: string;     // "HH:MM"
  shiftEnd: string;
  headcount: number;
  skillTags?: SkillTag[];
  isRecurring?: boolean;
  recurringDays?: number[];
  notes?: string;
  fillRateThreshold?: number;
  guaranteedHeadcount?: number;
}

export interface UpdateRequestPayload {
  title?: string;
  date?: string;
  shiftStart?: string;
  shiftEnd?: string;
  headcount?: number;
  skillTags?: SkillTag[];
  status?: RequestStatus;
  notes?: string;
}

export interface CheckInPayload {
  workerId: string;
  requestId: string;
  lat: number;
  lng: number;
  selfieUrl?: string;
}

export interface CheckOutPayload {
  lat: number;
  lng: number;
}

export interface GenerateInvoicePayload {
  requestId: string;
  hourlyRate: number;
  gstRate?: number;
  dueInDays?: number;
}

// ---------------------------------------------------------------------------
// Worker-facing types (Expo app)
// ---------------------------------------------------------------------------

/** Condensed view of an open offer surfaced to a worker in the app */
export interface WorkerOfferCard {
  offerId: string;
  requestId: string;
  companyName: string;
  siteName: string;
  siteAddress: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  skills: SkillTag[];
  estimatedPay: number;    // INR, approximate
  expiresAt: string | null;
}

/** Worker earnings summary */
export interface WorkerEarningsSummary {
  thisMonth: number;
  lastMonth: number;
  pending: number;
  totalLifetime: number;
  shiftsThisMonth: number;
}
