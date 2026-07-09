-- Add Google Maps URL and city fields to Site
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "mapsUrl" TEXT;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "city"    TEXT NOT NULL DEFAULT '';
