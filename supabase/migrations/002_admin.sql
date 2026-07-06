-- SkillTag table (admin-managed skills, separate from the legacy enum type)
CREATE TABLE IF NOT EXISTS "SkillTag" (
  id   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  label TEXT UNIQUE NOT NULL
);

-- Seed default skills
INSERT INTO "SkillTag" (label) VALUES
  ('GENERAL_HELPER'),
  ('FORKLIFT_MHE'),
  ('SCANNER_TRAINED'),
  ('COLD_STORAGE'),
  ('LOADING_UNLOADING'),
  ('PACKING'),
  ('INVENTORY')
ON CONFLICT (label) DO NOTHING;

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

-- Add email column to Worker (for email-based auth / demo accounts)
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS email TEXT;

-- Link demo worker email accounts (run after creating Supabase auth users)
UPDATE "Worker" SET email = 'worker1@work4.in' WHERE id = 'worker-001';
UPDATE "Worker" SET email = 'worker2@work4.in' WHERE id = 'worker-002';
