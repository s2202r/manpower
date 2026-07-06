-- ============================================================
-- Manpower Platform — Demo Seed Data
-- Paste into Supabase SQL Editor and click Run
-- Safe to re-run: deletes existing demo data first
-- ============================================================

-- Clean up in FK order
DELETE FROM "InvoiceLineItem";
DELETE FROM "Invoice";
DELETE FROM "CheckIn";
DELETE FROM "ShiftOffer";
DELETE FROM "Request";
DELETE FROM "Payout";
DELETE FROM "Worker";
DELETE FROM "Site";
DELETE FROM "Company";
DELETE FROM "User";

-- ============================================================
-- 1. Demo company user
-- ============================================================
INSERT INTO "User" (id, "supabaseId", email, role, "createdAt", "updatedAt")
VALUES (
  'user-demo-company-001',
  'demo-supabase-id-company-001',
  'demo@delhilogistics.com',
  'CUSTOMER',
  NOW(), NOW()
);

INSERT INTO "Company" (id, "userId", name, "gstNumber", address, "contactName", "contactPhone", "createdAt", "updatedAt")
VALUES (
  'company-demo-001',
  'user-demo-company-001',
  'Delhi Logistics Co.',
  '07AADCD1234F1Z5',
  'Plot 45, Sector 18, Gurugram, Haryana 122015',
  'Vikram Malhotra',
  '919811234567',
  NOW(), NOW()
);

-- ============================================================
-- 2. Sites
-- ============================================================
INSERT INTO "Site" (id, "companyId", name, address, lat, lng, "radiusMeters", "createdAt", "updatedAt")
VALUES
  ('site-gurgaon-001', 'company-demo-001', 'Gurgaon Warehouse',
   'Plot 12A, IMT Manesar, Gurugram, Haryana 122050',
   28.4595, 77.0266, 300, NOW(), NOW()),
  ('site-noida-001', 'company-demo-001', 'Noida Distribution Center',
   'A-45, Sector 63, Noida, Uttar Pradesh 201301',
   28.5355, 77.3910, 250, NOW(), NOW());

-- ============================================================
-- 3. Workers (30 workers across 3 reliability tiers)
--    High tier: offered=20, accepted=18, completed=17, noShows=0  → score ~97
--    Moderate:  offered=15, accepted=11, completed=9,  noShows=2  → score ~71
--    Low:       offered=12, accepted=7,  completed=4,  noShows=4  → score ~37
-- ============================================================
INSERT INTO "Worker" (id, name, phone, skills, "kycStatus", "isActive", "whatsappOptIn",
  "reliabilityScore", "totalShiftsOffered", "totalShiftsAccepted", "totalShiftsCompleted",
  "totalNoShows", "avgPunctualityMins", "createdAt", "updatedAt")
VALUES
  -- High reliability (score ~97)
  ('worker-001','Ravi Kumar',    '919876543201', ARRAY['GENERAL_HELPER','FORKLIFT_MHE']::"SkillTag"[],  'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),
  ('worker-002','Amit Sharma',   '919876543202', ARRAY['SCANNER_TRAINED']::"SkillTag"[],                'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),
  ('worker-003','Suresh Yadav',  '919876543203', ARRAY['GENERAL_HELPER']::"SkillTag"[],                 'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),
  ('worker-004','Vikram Singh',  '919876543204', ARRAY['FORKLIFT_MHE']::"SkillTag"[],                   'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),
  ('worker-005','Deepak Gupta',  '919876543205', ARRAY['COLD_STORAGE','SCANNER_TRAINED']::"SkillTag"[], 'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),
  ('worker-006','Manish Tiwari', '919876543206', ARRAY['GENERAL_HELPER','FORKLIFT_MHE']::"SkillTag"[],  'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),
  ('worker-007','Rajesh Patel',  '919876543207', ARRAY['SCANNER_TRAINED']::"SkillTag"[],                'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),
  ('worker-008','Ankit Verma',   '919876543208', ARRAY['GENERAL_HELPER']::"SkillTag"[],                 'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),
  ('worker-009','Sanjay Mishra', '919876543209', ARRAY['FORKLIFT_MHE','COLD_STORAGE']::"SkillTag"[],    'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),
  ('worker-010','Pradeep Joshi', '919876543210', ARRAY['GENERAL_HELPER','SCANNER_TRAINED']::"SkillTag"[],'APPROVED', true, true, 97.0, 20,18,17,0, -3, NOW(), NOW()),

  -- Moderate reliability (score ~71)
  ('worker-011','Rahul Chauhan',   '919876543211', ARRAY['GENERAL_HELPER']::"SkillTag"[],                  'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),
  ('worker-012','Naresh Thakur',   '919876543212', ARRAY['SCANNER_TRAINED']::"SkillTag"[],                 'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),
  ('worker-013','Hemant Dubey',    '919876543213', ARRAY['FORKLIFT_MHE']::"SkillTag"[],                    'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),
  ('worker-014','Santosh Rawat',   '919876543214', ARRAY['GENERAL_HELPER','COLD_STORAGE']::"SkillTag"[],   'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),
  ('worker-015','Arun Bajpai',     '919876543215', ARRAY['GENERAL_HELPER']::"SkillTag"[],                  'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),
  ('worker-016','Manoj Pandey',    '919876543216', ARRAY['SCANNER_TRAINED','FORKLIFT_MHE']::"SkillTag"[],  'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),
  ('worker-017','Dinesh Kaur',     '919876543217', ARRAY['GENERAL_HELPER']::"SkillTag"[],                  'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),
  ('worker-018','Nitin Saxena',    '919876543218', ARRAY['COLD_STORAGE']::"SkillTag"[],                    'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),
  ('worker-019','Ajay Dixit',      '919876543219', ARRAY['GENERAL_HELPER','SCANNER_TRAINED']::"SkillTag"[],'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),
  ('worker-020','Vivek Srivastava','919876543220', ARRAY['FORKLIFT_MHE']::"SkillTag"[],                    'APPROVED', true, true, 71.0, 15,11, 9,2,  5, NOW(), NOW()),

  -- Low reliability (score ~37)
  ('worker-021','Raju Meena',   '919876543221', ARRAY['GENERAL_HELPER']::"SkillTag"[],  'APPROVED', true, true, 37.0, 12,7,4,4, 18, NOW(), NOW()),
  ('worker-022','Bunty Yadav',  '919876543222', ARRAY['GENERAL_HELPER']::"SkillTag"[],  'PENDING',  true, true, 37.0, 12,7,4,4, 18, NOW(), NOW()),
  ('worker-023','Pappu Gautam', '919876543223', ARRAY['SCANNER_TRAINED']::"SkillTag"[], 'APPROVED', true, true, 37.0, 12,7,4,4, 18, NOW(), NOW()),
  ('worker-024','Lucky Sharma', '919876543224', ARRAY['GENERAL_HELPER']::"SkillTag"[],  'APPROVED', true, true, 37.0, 12,7,4,4, 18, NOW(), NOW()),
  ('worker-025','Tinku Singh',  '919876543225', ARRAY['FORKLIFT_MHE']::"SkillTag"[],   'PENDING',  true, true, 37.0, 12,7,4,4, 18, NOW(), NOW()),
  ('worker-026','Rinku Prasad', '919876543226', ARRAY['GENERAL_HELPER']::"SkillTag"[],  'APPROVED', true, true, 37.0, 12,7,4,4, 18, NOW(), NOW()),
  ('worker-027','Bablu Nishad', '919876543227', ARRAY['COLD_STORAGE']::"SkillTag"[],   'APPROVED', true, true, 37.0, 12,7,4,4, 18, NOW(), NOW()),
  ('worker-028','Pintu Rajput', '919876543228', ARRAY['GENERAL_HELPER']::"SkillTag"[],  'APPROVED', true, true, 37.0, 12,7,4,4, 18, NOW(), NOW()),
  ('worker-029','Sunny Kashyap','919876543229', ARRAY['SCANNER_TRAINED']::"SkillTag"[], 'PENDING',  true, true, 37.0, 12,7,4,4, 18, NOW(), NOW()),
  ('worker-030','Golu Maurya',  '919876543230', ARRAY['GENERAL_HELPER']::"SkillTag"[],  'APPROVED', true, true, 37.0, 12,7,4,4, 18, NOW(), NOW());

-- ============================================================
-- 4. Requests
-- ============================================================
INSERT INTO "Request" (id, "companyId", "siteId", title, date,
  "shiftStart", "shiftEnd", headcount, "skillTags", status,
  "isRecurring", "recurringDays", "targetHeadcount", "offerBuffer",
  "fillRateThreshold", "guaranteedHeadcount", "bookedHeadcount", notes,
  "createdAt", "updatedAt")
VALUES
  -- Request 1: Today IN_PROGRESS at Gurgaon
  ('request-001', 'company-demo-001', 'site-gurgaon-001',
   'Gurgaon Morning Shift — General & Forklift',
   CURRENT_DATE, '06:00', '14:00', 10,
   ARRAY['GENERAL_HELPER','FORKLIFT_MHE']::"SkillTag"[],
   'IN_PROGRESS', false, ARRAY[]::int[],
   10, 2, 0.95, 8, 7,
   'Loading dock B operational. Forklift operators must hold valid licence.',
   NOW(), NOW()),

  -- Request 2: Tomorrow OPEN at Noida
  ('request-002', 'company-demo-001', 'site-noida-001',
   'Noida Scanner Shift',
   CURRENT_DATE + INTERVAL '1 day', '08:00', '16:00', 5,
   ARRAY['SCANNER_TRAINED']::"SkillTag"[],
   'OPEN', false, ARRAY[]::int[],
   5, 1, 0.95, 4, 3,
   'Must be comfortable with RF scanners.',
   NOW(), NOW()),

  -- Request 3: Next week recurring OPEN at Gurgaon
  ('request-003', 'company-demo-001', 'site-gurgaon-001',
   'Gurgaon Weekly General Helpers',
   CURRENT_DATE + INTERVAL '7 days', '06:00', '14:00', 10,
   ARRAY['GENERAL_HELPER']::"SkillTag"[],
   'OPEN', true, ARRAY[1,2,3,4,5],
   10, 2, 0.95, 8, 0,
   'Weekly recurring contract. Steady bench required.',
   NOW(), NOW());

-- ============================================================
-- 5. Shift offers for Request 1 (12 offered, all ACCEPTED)
--    and Request 2 (6 offered, PENDING)
-- ============================================================
INSERT INTO "ShiftOffer" (id, "requestId", "workerId", status, "offeredAt", "respondedAt", "createdAt", "updatedAt")
VALUES
  -- Request 1 — accepted
  ('offer-r1-w01','request-001','worker-001','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '20 hours', NOW(), NOW()),
  ('offer-r1-w02','request-001','worker-002','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '20 hours', NOW(), NOW()),
  ('offer-r1-w03','request-001','worker-003','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '19 hours', NOW(), NOW()),
  ('offer-r1-w04','request-001','worker-004','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '19 hours', NOW(), NOW()),
  ('offer-r1-w05','request-001','worker-005','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '18 hours', NOW(), NOW()),
  ('offer-r1-w06','request-001','worker-006','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '18 hours', NOW(), NOW()),
  ('offer-r1-w07','request-001','worker-007','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '17 hours', NOW(), NOW()),
  ('offer-r1-w08','request-001','worker-008','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '17 hours', NOW(), NOW()),
  ('offer-r1-w11','request-001','worker-011','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '16 hours', NOW(), NOW()),
  ('offer-r1-w12','request-001','worker-012','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '16 hours', NOW(), NOW()),
  ('offer-r1-w13','request-001','worker-013','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '15 hours', NOW(), NOW()),
  ('offer-r1-w14','request-001','worker-014','ACCEPTED', NOW()-INTERVAL '1 day', NOW()-INTERVAL '15 hours', NOW(), NOW()),

  -- Request 2 — pending
  ('offer-r2-w02','request-002','worker-002','PENDING', NOW(), NULL, NOW(), NOW()),
  ('offer-r2-w03','request-002','worker-003','PENDING', NOW(), NULL, NOW(), NOW()),
  ('offer-r2-w07','request-002','worker-007','PENDING', NOW(), NULL, NOW(), NOW()),
  ('offer-r2-w11','request-002','worker-011','PENDING', NOW(), NULL, NOW(), NOW()),
  ('offer-r2-w12','request-002','worker-012','PENDING', NOW(), NULL, NOW(), NOW()),
  ('offer-r2-w016','request-002','worker-016','PENDING', NOW(), NULL, NOW(), NOW());

-- ============================================================
-- 6. Today's check-ins for Request 1 — 7 workers checked in,
--    4 have already checked out (verified), 3 still active
-- ============================================================
INSERT INTO "CheckIn" (id, "workerId", "requestId", "siteId",
  "checkInAt", "checkInLat", "checkInLng",
  "checkOutAt", "checkOutLat", "checkOutLng",
  "hoursWorked", "isVerified", "punctualityMins",
  "createdAt", "updatedAt")
VALUES
  -- 4 checked out and verified
  ('checkin-001','worker-001','request-001','site-gurgaon-001',
   CURRENT_DATE+'06:05'::time, 28.4600, 77.0269,
   CURRENT_DATE+'10:07'::time, 28.4601, 77.0270,
   4.03, true, 5, NOW(), NOW()),
  ('checkin-002','worker-002','request-001','site-gurgaon-001',
   CURRENT_DATE+'06:06'::time, 28.4592, 77.0273,
   CURRENT_DATE+'10:09'::time, 28.4593, 77.0274,
   4.05, true, 6, NOW(), NOW()),
  ('checkin-003','worker-003','request-001','site-gurgaon-001',
   CURRENT_DATE+'06:07'::time, 28.4603, 77.0258,
   CURRENT_DATE+'10:11'::time, 28.4604, 77.0259,
   4.07, true, 7, NOW(), NOW()),
  ('checkin-004','worker-004','request-001','site-gurgaon-001',
   CURRENT_DATE+'06:08'::time, 28.4589, 77.0261,
   CURRENT_DATE+'10:13'::time, 28.4590, 77.0262,
   4.08, true, 8, NOW(), NOW()),

  -- 3 still checked in (no checkout yet)
  ('checkin-005','worker-005','request-001','site-gurgaon-001',
   CURRENT_DATE+'06:09'::time, 28.4596, 77.0275,
   NULL, NULL, NULL, NULL, false, 9, NOW(), NOW()),
  ('checkin-006','worker-006','request-001','site-gurgaon-001',
   CURRENT_DATE+'06:10'::time, 28.4599, 77.0258,
   NULL, NULL, NULL, NULL, false, 10, NOW(), NOW()),
  ('checkin-007','worker-007','request-001','site-gurgaon-001',
   CURRENT_DATE+'06:11'::time, 28.4594, 77.0270,
   NULL, NULL, NULL, NULL, false, 11, NOW(), NOW());

-- ============================================================
-- 7. Historical check-ins (5 past shifts per worker, all verified)
--    Attached to request-001 for FK; weekly cadence going back 5 weeks
-- ============================================================
INSERT INTO "CheckIn" (id, "workerId", "requestId", "siteId",
  "checkInAt", "checkInLat", "checkInLng",
  "checkOutAt", "checkOutLat", "checkOutLng",
  "hoursWorked", "isVerified", "punctualityMins",
  "createdAt", "updatedAt")
SELECT
  'hist-' || w.id || '-w' || week,
  w.id,
  'request-001',
  'site-gurgaon-001',
  (CURRENT_DATE - (week * 7 + 7) * INTERVAL '1 day') + '06:05'::time,
  28.4595 + 0.0002*(week%3),
  77.0266 - 0.0002*(week%2),
  (CURRENT_DATE - (week * 7 + 7) * INTERVAL '1 day') + '14:05'::time,
  28.4596 + 0.0002*(week%3),
  77.0267 - 0.0001*(week%2),
  8.0,
  true,
  CASE w.tier
    WHEN 'high'     THEN -2 + week
    WHEN 'moderate' THEN 5  + week
    ELSE                 15 + week
  END,
  NOW(), NOW()
FROM (
  VALUES
    ('worker-001','high'),('worker-002','high'),('worker-003','high'),
    ('worker-004','high'),('worker-005','high'),('worker-006','high'),
    ('worker-007','high'),('worker-008','high'),('worker-009','high'),
    ('worker-010','high'),
    ('worker-011','moderate'),('worker-012','moderate'),('worker-013','moderate'),
    ('worker-014','moderate'),('worker-015','moderate'),('worker-016','moderate'),
    ('worker-017','moderate'),('worker-018','moderate'),('worker-019','moderate'),
    ('worker-020','moderate'),
    ('worker-021','low'),('worker-022','low'),('worker-023','low'),
    ('worker-024','low'),('worker-025','low')
) AS w(id, tier)
CROSS JOIN generate_series(1, 5) AS week;

-- ============================================================
-- 8. Sample invoice for Request 1 (based on 4 verified check-ins)
-- ============================================================
INSERT INTO "Invoice" (id, "companyId", "requestId", "invoiceNumber",
  status, "issuedAt", "dueAt",
  subtotal, "gstAmount", total, "gstRate", "hourlyRate",
  "bookedHeadcount", "billedHeadcount",
  "bookedHours", "billedHours",
  "createdAt", "updatedAt")
VALUES (
  'invoice-001', 'company-demo-001', 'request-001',
  'INV-2026-001',
  'ISSUED',
  NOW(),
  NOW() + INTERVAL '15 days',
  5760.0, 1036.8, 6796.8,
  0.18, 120.0,
  10, 4,
  80.0, 16.23,
  NOW(), NOW()
);

INSERT INTO "InvoiceLineItem" (id, "invoiceId", "checkInId", "workerName", "skillTag",
  hours, "hourlyRate", amount, date, "createdAt")
VALUES
  ('line-001','invoice-001','checkin-001','Ravi Kumar',  'GENERAL_HELPER', 4.03, 120.0,  483.6,  CURRENT_DATE, NOW()),
  ('line-002','invoice-001','checkin-002','Amit Sharma', 'SCANNER_TRAINED',4.05, 120.0,  486.0,  CURRENT_DATE, NOW()),
  ('line-003','invoice-001','checkin-003','Suresh Yadav','GENERAL_HELPER', 4.07, 120.0,  488.4,  CURRENT_DATE, NOW()),
  ('line-004','invoice-001','checkin-004','Vikram Singh','FORKLIFT_MHE',   4.08, 120.0,  489.6,  CURRENT_DATE, NOW());

-- ============================================================
-- Done! Verify counts:
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM "Worker")  AS workers,
  (SELECT COUNT(*) FROM "Site")    AS sites,
  (SELECT COUNT(*) FROM "Request") AS requests,
  (SELECT COUNT(*) FROM "ShiftOffer") AS offers,
  (SELECT COUNT(*) FROM "CheckIn") AS checkins,
  (SELECT COUNT(*) FROM "Invoice") AS invoices;
