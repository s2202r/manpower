-- ============================================================
-- Manpower Platform — Initial Schema + RLS Policies
-- Supabase / PostgreSQL
-- ============================================================
-- Run order: this file is idempotent (uses IF NOT EXISTS / OR REPLACE)
-- Apply via: supabase db push  OR  psql -f 001_initial.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "UserRole"      AS ENUM ('CUSTOMER', 'WORKER', 'OPS_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SkillTag"      AS ENUM ('GENERAL_HELPER', 'FORKLIFT_MHE', 'SCANNER_TRAINED', 'COLD_STORAGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'OPEN', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OfferStatus"   AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'NO_SHOW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "KycStatus"     AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PayoutStatus"  AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- User (mirrors Supabase auth.users, linked by supabaseId)
CREATE TABLE IF NOT EXISTS "User" (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supabaseId" TEXT        UNIQUE NOT NULL,
  email        TEXT        UNIQUE,
  phone        TEXT        UNIQUE,
  role         "UserRole"  NOT NULL DEFAULT 'CUSTOMER',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company (one per CUSTOMER user)
CREATE TABLE IF NOT EXISTS "Company" (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"       TEXT        UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  "gstNumber"    TEXT,
  address        TEXT,
  "contactName"  TEXT,
  "contactPhone" TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site (warehouse location + geofence)
CREATE TABLE IF NOT EXISTS "Site" (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"    TEXT        NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  address        TEXT        NOT NULL,
  lat            DOUBLE PRECISION NOT NULL,
  lng            DOUBLE PRECISION NOT NULL,
  "radiusMeters" INTEGER     NOT NULL DEFAULT 200,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Worker
CREATE TABLE IF NOT EXISTS "Worker" (
  id                     TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"               TEXT             UNIQUE REFERENCES "User"(id) ON DELETE SET NULL,
  name                   TEXT             NOT NULL,
  phone                  TEXT             UNIQUE NOT NULL,
  "whatsappOptIn"        BOOLEAN          NOT NULL DEFAULT TRUE,
  "photoUrl"             TEXT,
  skills                 "SkillTag"[]     NOT NULL DEFAULT '{}',
  "kycStatus"            "KycStatus"      NOT NULL DEFAULT 'PENDING',
  "kycDocUrls"           TEXT[]           NOT NULL DEFAULT '{}',
  "isActive"             BOOLEAN          NOT NULL DEFAULT TRUE,
  "reliabilityScore"     DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  "totalShiftsOffered"   INTEGER          NOT NULL DEFAULT 0,
  "totalShiftsAccepted"  INTEGER          NOT NULL DEFAULT 0,
  "totalShiftsCompleted" INTEGER          NOT NULL DEFAULT 0,
  "totalNoShows"         INTEGER          NOT NULL DEFAULT 0,
  "avgPunctualityMins"   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "createdAt"            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Staffing request
CREATE TABLE IF NOT EXISTS "Request" (
  id                    TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"           TEXT             NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "siteId"              TEXT             NOT NULL REFERENCES "Site"(id),
  title                 TEXT             NOT NULL,
  date                  DATE             NOT NULL,
  "shiftStart"          TEXT             NOT NULL,
  "shiftEnd"            TEXT             NOT NULL,
  headcount             INTEGER          NOT NULL,
  "skillTags"           "SkillTag"[]     NOT NULL DEFAULT '{}',
  status                "RequestStatus"  NOT NULL DEFAULT 'OPEN',
  "isRecurring"         BOOLEAN          NOT NULL DEFAULT FALSE,
  "recurringDays"       INTEGER[]        NOT NULL DEFAULT '{}',
  notes                 TEXT,
  "targetHeadcount"     INTEGER          NOT NULL,
  "offerBuffer"         INTEGER          NOT NULL DEFAULT 0,
  "fillRateThreshold"   DOUBLE PRECISION NOT NULL DEFAULT 0.95,
  "guaranteedHeadcount" INTEGER          NOT NULL,
  "bookedHeadcount"     INTEGER          NOT NULL DEFAULT 0,
  "createdAt"           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Shift offer (worker x request)
CREATE TABLE IF NOT EXISTS "ShiftOffer" (
  id              TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "requestId"     TEXT          NOT NULL REFERENCES "Request"(id) ON DELETE CASCADE,
  "workerId"      TEXT          NOT NULL REFERENCES "Worker"(id),
  status          "OfferStatus" NOT NULL DEFAULT 'PENDING',
  "offeredAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "respondedAt"   TIMESTAMPTZ,
  "whatsappMsgId" TEXT,
  "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE ("requestId", "workerId")
);

-- Check-in / check-out
CREATE TABLE IF NOT EXISTS "CheckIn" (
  id                 TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "workerId"         TEXT             NOT NULL REFERENCES "Worker"(id),
  "requestId"        TEXT             NOT NULL REFERENCES "Request"(id),
  "siteId"           TEXT             NOT NULL REFERENCES "Site"(id),
  "checkInAt"        TIMESTAMPTZ      NOT NULL,
  "checkInLat"       DOUBLE PRECISION NOT NULL,
  "checkInLng"       DOUBLE PRECISION NOT NULL,
  "checkInSelfieUrl" TEXT,
  "checkOutAt"       TIMESTAMPTZ,
  "checkOutLat"      DOUBLE PRECISION,
  "checkOutLng"      DOUBLE PRECISION,
  "hoursWorked"      DOUBLE PRECISION,
  "isVerified"       BOOLEAN          NOT NULL DEFAULT FALSE,
  "punctualityMins"  INTEGER          NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Invoice
CREATE TABLE IF NOT EXISTS "Invoice" (
  id                       TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"              TEXT             NOT NULL REFERENCES "Company"(id),
  "requestId"              TEXT             NOT NULL REFERENCES "Request"(id),
  "invoiceNumber"          TEXT             UNIQUE NOT NULL,
  status                   "InvoiceStatus"  NOT NULL DEFAULT 'DRAFT',
  "issuedAt"               TIMESTAMPTZ,
  "dueAt"                  TIMESTAMPTZ,
  subtotal                 DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gstAmount"              DOUBLE PRECISION NOT NULL DEFAULT 0,
  total                    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gstRate"                DOUBLE PRECISION NOT NULL DEFAULT 0.18,
  "hourlyRate"             DOUBLE PRECISION NOT NULL,
  "razorpayPaymentLinkId"  TEXT,
  "razorpayPaymentLinkUrl" TEXT,
  "pdfUrl"                 TEXT,
  "bookedHeadcount"        INTEGER          NOT NULL DEFAULT 0,
  "billedHeadcount"        INTEGER          NOT NULL DEFAULT 0,
  "bookedHours"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "billedHours"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"              TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Invoice line item
CREATE TABLE IF NOT EXISTS "InvoiceLineItem" (
  id           TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "invoiceId"  TEXT             NOT NULL REFERENCES "Invoice"(id) ON DELETE CASCADE,
  "checkInId"  TEXT             NOT NULL REFERENCES "CheckIn"(id),
  "workerName" TEXT             NOT NULL,
  "skillTag"   "SkillTag"       NOT NULL,
  hours        DOUBLE PRECISION NOT NULL,
  "hourlyRate" DOUBLE PRECISION NOT NULL,
  amount       DOUBLE PRECISION NOT NULL,
  date         DATE             NOT NULL,
  "createdAt"  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Worker payout
CREATE TABLE IF NOT EXISTS "Payout" (
  id                TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "workerId"        TEXT             NOT NULL REFERENCES "Worker"(id),
  amount            DOUBLE PRECISION NOT NULL,
  "hoursWorked"     DOUBLE PRECISION NOT NULL,
  "hourlyRate"      DOUBLE PRECISION NOT NULL,
  "shiftDate"       DATE             NOT NULL,
  status            "PayoutStatus"   NOT NULL DEFAULT 'PENDING',
  "razorpayPayoutId" TEXT,
  "processedAt"     TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_supabase_id ON "User"("supabaseId");
CREATE INDEX IF NOT EXISTS idx_company_user     ON "Company"("userId");
CREATE INDEX IF NOT EXISTS idx_site_company     ON "Site"("companyId");
CREATE INDEX IF NOT EXISTS idx_request_company  ON "Request"("companyId");
CREATE INDEX IF NOT EXISTS idx_request_site     ON "Request"("siteId");
CREATE INDEX IF NOT EXISTS idx_request_date     ON "Request"(date);
CREATE INDEX IF NOT EXISTS idx_request_status   ON "Request"(status);
CREATE INDEX IF NOT EXISTS idx_offer_request    ON "ShiftOffer"("requestId");
CREATE INDEX IF NOT EXISTS idx_offer_worker     ON "ShiftOffer"("workerId");
CREATE INDEX IF NOT EXISTS idx_offer_status     ON "ShiftOffer"(status);
CREATE INDEX IF NOT EXISTS idx_checkin_worker   ON "CheckIn"("workerId");
CREATE INDEX IF NOT EXISTS idx_checkin_request  ON "CheckIn"("requestId");
CREATE INDEX IF NOT EXISTS idx_checkin_verified ON "CheckIn"("isVerified");
CREATE INDEX IF NOT EXISTS idx_invoice_company  ON "Invoice"("companyId");
CREATE INDEX IF NOT EXISTS idx_invoice_status   ON "Invoice"(status);
CREATE INDEX IF NOT EXISTS idx_payout_worker    ON "Payout"("workerId");
CREATE INDEX IF NOT EXISTS idx_payout_status    ON "Payout"(status);

-- ============================================================
-- HELPER FUNCTIONS (used in RLS policies)
-- ============================================================

-- Resolves the logged-in Supabase auth UID to the internal User.id
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text LIMIT 1;
$$;

-- Resolves the logged-in Supabase auth UID to the UserRole
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS "UserRole" LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM "User" WHERE "supabaseId" = auth.uid()::text LIMIT 1;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- The NestJS API uses SUPABASE_SERVICE_ROLE_KEY and bypasses RLS.
-- These policies protect direct client (anon / authenticated) access,
-- e.g. from the Expo worker app using the Supabase JS client.
-- ============================================================

ALTER TABLE "User"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Site"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Worker"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Request"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShiftOffer"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckIn"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceLineItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payout"          ENABLE ROW LEVEL SECURITY;

-- -------------------- User --------------------

DROP POLICY IF EXISTS "user: read own row"       ON "User";
DROP POLICY IF EXISTS "user: ops admin read all" ON "User";

CREATE POLICY "user: read own row"
  ON "User" FOR SELECT
  USING ("supabaseId" = auth.uid()::text);

CREATE POLICY "user: ops admin read all"
  ON "User" FOR SELECT
  USING (auth_user_role() = 'OPS_ADMIN');

-- -------------------- Company --------------------

DROP POLICY IF EXISTS "company: customer reads own"   ON "Company";
DROP POLICY IF EXISTS "company: ops admin reads all"  ON "Company";
DROP POLICY IF EXISTS "company: customer inserts own" ON "Company";
DROP POLICY IF EXISTS "company: customer updates own" ON "Company";

CREATE POLICY "company: customer reads own"
  ON "Company" FOR SELECT
  USING ("userId" = auth_user_id());

CREATE POLICY "company: ops admin reads all"
  ON "Company" FOR SELECT
  USING (auth_user_role() = 'OPS_ADMIN');

CREATE POLICY "company: customer inserts own"
  ON "Company" FOR INSERT
  WITH CHECK ("userId" = auth_user_id());

CREATE POLICY "company: customer updates own"
  ON "Company" FOR UPDATE
  USING ("userId" = auth_user_id());

-- -------------------- Site --------------------

DROP POLICY IF EXISTS "site: customer reads own company sites" ON "Site";
DROP POLICY IF EXISTS "site: ops admin reads all"             ON "Site";
DROP POLICY IF EXISTS "site: customer manages own"            ON "Site";

CREATE POLICY "site: customer reads own company sites"
  ON "Site" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Company" c
      WHERE c.id = "Site"."companyId" AND c."userId" = auth_user_id()
    )
  );

CREATE POLICY "site: ops admin reads all"
  ON "Site" FOR SELECT
  USING (auth_user_role() = 'OPS_ADMIN');

CREATE POLICY "site: customer manages own"
  ON "Site" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Company" c
      WHERE c.id = "Site"."companyId" AND c."userId" = auth_user_id()
    )
  );

-- -------------------- Worker --------------------

DROP POLICY IF EXISTS "worker: read own"                    ON "Worker";
DROP POLICY IF EXISTS "worker: update own"                  ON "Worker";
DROP POLICY IF EXISTS "worker: ops admin full access"       ON "Worker";
DROP POLICY IF EXISTS "worker: customer sees assigned workers" ON "Worker";

CREATE POLICY "worker: read own"
  ON "Worker" FOR SELECT
  USING ("userId" = auth_user_id());

CREATE POLICY "worker: update own"
  ON "Worker" FOR UPDATE
  USING ("userId" = auth_user_id());

CREATE POLICY "worker: ops admin full access"
  ON "Worker" FOR ALL
  USING (auth_user_role() = 'OPS_ADMIN');

-- Customers see only basic info for workers assigned to their requests
CREATE POLICY "worker: customer sees assigned workers"
  ON "Worker" FOR SELECT
  USING (
    auth_user_role() = 'CUSTOMER'
    AND EXISTS (
      SELECT 1 FROM "ShiftOffer" so
      JOIN "Request" r ON r.id = so."requestId"
      JOIN "Company" c ON c.id = r."companyId"
      WHERE so."workerId" = "Worker".id AND c."userId" = auth_user_id()
    )
  );

-- -------------------- Request --------------------

DROP POLICY IF EXISTS "request: customer reads own"         ON "Request";
DROP POLICY IF EXISTS "request: ops admin reads all"        ON "Request";
DROP POLICY IF EXISTS "request: customer manages own"       ON "Request";
DROP POLICY IF EXISTS "request: worker sees offered requests" ON "Request";

CREATE POLICY "request: customer reads own"
  ON "Request" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Company" c
      WHERE c.id = "Request"."companyId" AND c."userId" = auth_user_id()
    )
  );

CREATE POLICY "request: ops admin reads all"
  ON "Request" FOR SELECT
  USING (auth_user_role() = 'OPS_ADMIN');

CREATE POLICY "request: customer manages own"
  ON "Request" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Company" c
      WHERE c.id = "Request"."companyId" AND c."userId" = auth_user_id()
    )
  );

CREATE POLICY "request: worker sees offered requests"
  ON "Request" FOR SELECT
  USING (
    auth_user_role() = 'WORKER'
    AND EXISTS (
      SELECT 1 FROM "ShiftOffer" so
      JOIN "Worker" w ON w.id = so."workerId"
      WHERE so."requestId" = "Request".id AND w."userId" = auth_user_id()
    )
  );

-- -------------------- ShiftOffer --------------------

DROP POLICY IF EXISTS "offer: worker reads own"                    ON "ShiftOffer";
DROP POLICY IF EXISTS "offer: worker updates own (accept/decline)" ON "ShiftOffer";
DROP POLICY IF EXISTS "offer: customer reads offers for own requests" ON "ShiftOffer";
DROP POLICY IF EXISTS "offer: ops admin full access"               ON "ShiftOffer";

CREATE POLICY "offer: worker reads own"
  ON "ShiftOffer" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Worker" w
      WHERE w.id = "ShiftOffer"."workerId" AND w."userId" = auth_user_id()
    )
  );

CREATE POLICY "offer: worker updates own (accept/decline)"
  ON "ShiftOffer" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Worker" w
      WHERE w.id = "ShiftOffer"."workerId" AND w."userId" = auth_user_id()
    )
  );

CREATE POLICY "offer: customer reads offers for own requests"
  ON "ShiftOffer" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Request" r
      JOIN "Company" c ON c.id = r."companyId"
      WHERE r.id = "ShiftOffer"."requestId" AND c."userId" = auth_user_id()
    )
  );

CREATE POLICY "offer: ops admin full access"
  ON "ShiftOffer" FOR ALL
  USING (auth_user_role() = 'OPS_ADMIN');

-- -------------------- CheckIn --------------------

DROP POLICY IF EXISTS "checkin: worker reads own"          ON "CheckIn";
DROP POLICY IF EXISTS "checkin: worker inserts own"        ON "CheckIn";
DROP POLICY IF EXISTS "checkin: worker updates own"        ON "CheckIn";
DROP POLICY IF EXISTS "checkin: customer reads for own requests" ON "CheckIn";
DROP POLICY IF EXISTS "checkin: ops admin full access"     ON "CheckIn";

CREATE POLICY "checkin: worker reads own"
  ON "CheckIn" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Worker" w
      WHERE w.id = "CheckIn"."workerId" AND w."userId" = auth_user_id()
    )
  );

CREATE POLICY "checkin: worker inserts own"
  ON "CheckIn" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Worker" w
      WHERE w.id = "CheckIn"."workerId" AND w."userId" = auth_user_id()
    )
  );

CREATE POLICY "checkin: worker updates own"
  ON "CheckIn" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Worker" w
      WHERE w.id = "CheckIn"."workerId" AND w."userId" = auth_user_id()
    )
  );

CREATE POLICY "checkin: customer reads for own requests"
  ON "CheckIn" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Request" r
      JOIN "Company" c ON c.id = r."companyId"
      WHERE r.id = "CheckIn"."requestId" AND c."userId" = auth_user_id()
    )
  );

CREATE POLICY "checkin: ops admin full access"
  ON "CheckIn" FOR ALL
  USING (auth_user_role() = 'OPS_ADMIN');

-- -------------------- Invoice --------------------

DROP POLICY IF EXISTS "invoice: customer reads own"    ON "Invoice";
DROP POLICY IF EXISTS "invoice: ops admin full access" ON "Invoice";

CREATE POLICY "invoice: customer reads own"
  ON "Invoice" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Company" c
      WHERE c.id = "Invoice"."companyId" AND c."userId" = auth_user_id()
    )
  );

CREATE POLICY "invoice: ops admin full access"
  ON "Invoice" FOR ALL
  USING (auth_user_role() = 'OPS_ADMIN');

-- -------------------- InvoiceLineItem --------------------

DROP POLICY IF EXISTS "line_item: customer reads via invoice" ON "InvoiceLineItem";
DROP POLICY IF EXISTS "line_item: ops admin full access"      ON "InvoiceLineItem";

CREATE POLICY "line_item: customer reads via invoice"
  ON "InvoiceLineItem" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Invoice" i
      JOIN "Company" c ON c.id = i."companyId"
      WHERE i.id = "InvoiceLineItem"."invoiceId" AND c."userId" = auth_user_id()
    )
  );

CREATE POLICY "line_item: ops admin full access"
  ON "InvoiceLineItem" FOR ALL
  USING (auth_user_role() = 'OPS_ADMIN');

-- -------------------- Payout --------------------

DROP POLICY IF EXISTS "payout: worker reads own"       ON "Payout";
DROP POLICY IF EXISTS "payout: ops admin full access"  ON "Payout";

CREATE POLICY "payout: worker reads own"
  ON "Payout" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Worker" w
      WHERE w.id = "Payout"."workerId" AND w."userId" = auth_user_id()
    )
  );

CREATE POLICY "payout: ops admin full access"
  ON "Payout" FOR ALL
  USING (auth_user_role() = 'OPS_ADMIN');

-- ============================================================
-- TRIGGER: auto-update updatedAt on all tables
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User','Company','Site','Worker','Request',
    'ShiftOffer','CheckIn','Invoice','Payout'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON "%s";
       CREATE TRIGGER trg_updated_at
         BEFORE UPDATE ON "%s"
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- TRIGGER: sync Supabase auth.users -> User on signup
-- ============================================================
-- In Supabase cloud: configure as a Database Webhook on INSERT to auth.users.
-- In local dev (supabase CLI), uncomment the CREATE TRIGGER below.

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO "User" ("supabaseId", email, phone, role)
  VALUES (
    NEW.id::text,
    NEW.email,
    NEW.phone,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::"UserRole",
      'CUSTOMER'::"UserRole"
    )
  )
  ON CONFLICT ("supabaseId") DO NOTHING;
  RETURN NEW;
END;
$$;

-- Uncomment for local supabase CLI dev:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
