-- Client rating of a worker after a shift
CREATE TABLE IF NOT EXISTS "WorkerRating" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "workerId"    TEXT NOT NULL REFERENCES "Worker"(id) ON DELETE CASCADE,
  "requestId"   TEXT NOT NULL REFERENCES "Request"(id) ON DELETE CASCADE,
  "companyId"   TEXT NOT NULL REFERENCES "Company"(id),
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  notes         TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("workerId", "requestId")
);

-- Check-in client approval: client must confirm attendance; approval time = official check-in time
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "clientApprovedAt"  TIMESTAMPTZ;
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "clientApprovedBy"  TEXT;
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "isVerified"        BOOLEAN NOT NULL DEFAULT FALSE;

-- Reliability score components on Worker
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "clientRatingAvg"   DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "clientRatingCount" INTEGER          NOT NULL DEFAULT 0;
