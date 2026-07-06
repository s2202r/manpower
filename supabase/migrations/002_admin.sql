-- PlatformConfig table
CREATE TABLE IF NOT EXISTS "PlatformConfig" (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default config
INSERT INTO "PlatformConfig" (key, value) VALUES
  ('commission_rate', '12'),
  ('razorpay_mode', 'test'),
  ('razorpay_key_id', '')
ON CONFLICT (key) DO NOTHING;

-- Add verificationStatus to Company if not exists
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT DEFAULT 'PENDING';
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT DEFAULT 'PENDING';

-- Mark existing seed data as verified
UPDATE "Company" SET "verificationStatus" = 'VERIFIED' WHERE "verificationStatus" = 'PENDING';
UPDATE "Worker" SET "verificationStatus" = 'VERIFIED' WHERE "verificationStatus" = 'PENDING';

-- Demo worker email accounts (link email to worker-001 and worker-002)
-- Run after creating Supabase auth users worker1@work4.in and worker2@work4.in
UPDATE "Worker" SET email = 'worker1@work4.in' WHERE id = 'worker-001';
UPDATE "Worker" SET email = 'worker2@work4.in' WHERE id = 'worker-002';
