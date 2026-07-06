-- Bank account details for workers
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "bankIfsc"          TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "bankAccountName"   TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "bankVerified"      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "kycSubmittedAt"    TIMESTAMPTZ;

-- Supabase Storage bucket (run separately in dashboard or via CLI):
-- Create a private bucket named "worker-docs" with file size limit 10MB
