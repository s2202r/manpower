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
