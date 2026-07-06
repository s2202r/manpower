-- Skill categories
CREATE TABLE IF NOT EXISTS "SkillCategory" (
  id    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name  TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Link skills to categories
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "categoryId" TEXT REFERENCES "SkillCategory"(id) ON DELETE SET NULL;

-- Seed categories
INSERT INTO "SkillCategory" (id, name) VALUES
  ('cat-warehouse',  'Warehouse'),
  ('cat-logistics',  'Logistics'),
  ('cat-cold-chain', 'Cold Chain'),
  ('cat-general',    'General Labour')
ON CONFLICT (id) DO NOTHING;

-- Assign existing skills to categories
UPDATE "Skill" SET "categoryId" = 'cat-warehouse'  WHERE label IN ('FORKLIFT_MHE','SCANNER_TRAINED','LOADING_UNLOADING','PACKING','INVENTORY');
UPDATE "Skill" SET "categoryId" = 'cat-cold-chain' WHERE label IN ('COLD_STORAGE');
UPDATE "Skill" SET "categoryId" = 'cat-general'    WHERE label IN ('GENERAL_HELPER');
