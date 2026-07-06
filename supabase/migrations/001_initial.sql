-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'WORKER', 'OPS_ADMIN');
CREATE TYPE "SkillTag" AS ENUM ('GENERAL_HELPER', 'FORKLIFT_MHE', 'SCANNER_TRAINED', 'COLD_STORAGE');
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'NO_SHOW');
CREATE TYPE "KycStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Users table (mirrors Supabase auth.users)
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "supabaseId" TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  role "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Companies
CREATE TABLE "Company" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "gstNumber" TEXT,
  address TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sites (warehouse locations with geofence)
CREATE TABLE "Site" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  "radiusMeters" INTEGER NOT NULL DEFAULT 200,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workers
CREATE TABLE "Worker" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "supabaseId" TEXT UNIQUE,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  "profilePhotoUrl" TEXT,
  skills "SkillTag"[] NOT NULL DEFAULT '{}',
  "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  "kycDocumentUrl" TEXT,
  "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "totalShiftsOffered" INTEGER NOT NULL DEFAULT 0,
  "totalShiftsAccepted" INTEGER NOT NULL DEFAULT 0,
  "totalShiftsCompleted" INTEGER NOT NULL DEFAULT 0,
  "totalNoShows" INTEGER NOT NULL DEFAULT 0,
  "avgPunctualityMins" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staffing requests
CREATE TABLE "Request" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "siteId" UUID NOT NULL REFERENCES "Site"(id),
  date DATE NOT NULL,
  "shiftStart" TEXT NOT NULL,
  "shiftEnd" TEXT NOT NULL,
  headcount INTEGER NOT NULL,
  "skillTags" "SkillTag"[] NOT NULL DEFAULT '{}',
  notes TEXT,
  status "RequestStatus" NOT NULL DEFAULT 'DRAFT',
  "isRecurring" BOOLEAN NOT NULL DEFAULT FALSE,
  "recurringDays" TEXT[] DEFAULT '{}',
  "targetHeadcount" INTEGER NOT NULL DEFAULT 0,
  "offerBuffer" INTEGER NOT NULL DEFAULT 0,
  "fillRateThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
  "guaranteedHeadcount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shift offers sent to workers
CREATE TABLE "ShiftOffer" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "requestId" UUID NOT NULL REFERENCES "Request"(id) ON DELETE CASCADE,
  "workerId" UUID NOT NULL REFERENCES "Worker"(id),
  status "OfferStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "respondedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("requestId", "workerId")
);

-- Check-ins
CREATE TABLE "CheckIn" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workerId" UUID NOT NULL REFERENCES "Worker"(id),
  "requestId" UUID NOT NULL REFERENCES "Request"(id),
  "siteId" UUID NOT NULL REFERENCES "Site"(id),
  "checkInAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "checkInLat" DOUBLE PRECISION NOT NULL,
  "checkInLng" DOUBLE PRECISION NOT NULL,
  "checkInSelfieUrl" TEXT,
  "checkOutAt" TIMESTAMPTZ,
  "checkOutLat" DOUBLE PRECISION,
  "checkOutLng" DOUBLE PRECISION,
  "hoursWorked" DOUBLE PRECISION,
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "punctualityMins" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
CREATE TABLE "Invoice" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id),
  "requestId" UUID REFERENCES "Request"(id),
  "invoiceNumber" TEXT UNIQUE NOT NULL,
  status "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  total DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 0.18,
  "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 120,
  "bookedHeadcount" INTEGER NOT NULL DEFAULT 0,
  "billedHeadcount" INTEGER NOT NULL DEFAULT 0,
  "bookedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "billedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dueDate" DATE,
  "razorpayPaymentLink" TEXT,
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE "InvoiceLineItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "invoiceId" UUID NOT NULL REFERENCES "Invoice"(id) ON DELETE CASCADE,
  "checkInId" UUID REFERENCES "CheckIn"(id),
  "workerName" TEXT NOT NULL,
  "skillTag" "SkillTag" NOT NULL,
  hours DOUBLE PRECISION NOT NULL,
  "hourlyRate" DOUBLE PRECISION NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  date DATE NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Worker payouts
CREATE TABLE "Payout" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workerId" UUID NOT NULL REFERENCES "Worker"(id),
  amount DOUBLE PRECISION NOT NULL,
  "hoursWorked" DOUBLE PRECISION NOT NULL,
  "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 120,
  "shiftDate" DATE NOT NULL,
  status "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "razorpayPayoutId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_request_company ON "Request"("companyId");
CREATE INDEX idx_request_site ON "Request"("siteId");
CREATE INDEX idx_request_date ON "Request"(date);
CREATE INDEX idx_shift_offer_worker ON "ShiftOffer"("workerId");
CREATE INDEX idx_shift_offer_request ON "ShiftOffer"("requestId");
CREATE INDEX idx_checkin_worker ON "CheckIn"("workerId");
CREATE INDEX idx_checkin_request ON "CheckIn"("requestId");
CREATE INDEX idx_invoice_company ON "Invoice"("companyId");
