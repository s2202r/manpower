import { PrismaClient, SkillTag, KycStatus, RequestStatus, OfferStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function computeReliabilityScore(params: {
  totalShiftsOffered: number;
  totalShiftsAccepted: number;
  totalShiftsCompleted: number;
  totalNoShows: number;
}): number {
  const { totalShiftsOffered, totalShiftsAccepted, totalShiftsCompleted, totalNoShows } = params;
  const completionRate = totalShiftsCompleted / Math.max(totalShiftsAccepted, 1);
  const noShowRate = totalNoShows / Math.max(totalShiftsOffered, 1);
  const score = (completionRate * 0.6 + (1 - noShowRate) * 0.4) * 100;
  return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function todayAt(hhmm: string): Date {
  const d = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ---------------------------------------------------------------------------
// Worker definitions
// ---------------------------------------------------------------------------

interface WorkerSeed {
  name: string;
  phone: string;
  skills: SkillTag[];
  kycStatus: KycStatus;
  tier: 'high' | 'moderate' | 'low';
}

const WORKERS: WorkerSeed[] = [
  // High reliability (score 85-100)
  { name: 'Ravi Kumar',     phone: '919876543201', skills: ['GENERAL_HELPER', 'FORKLIFT_MHE'],  kycStatus: 'APPROVED', tier: 'high' },
  { name: 'Amit Sharma',    phone: '919876543202', skills: ['SCANNER_TRAINED'],                kycStatus: 'APPROVED', tier: 'high' },
  { name: 'Suresh Yadav',   phone: '919876543203', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'high' },
  { name: 'Vikram Singh',   phone: '919876543204', skills: ['FORKLIFT_MHE'],                   kycStatus: 'APPROVED', tier: 'high' },
  { name: 'Deepak Gupta',   phone: '919876543205', skills: ['COLD_STORAGE', 'SCANNER_TRAINED'],kycStatus: 'APPROVED', tier: 'high' },
  { name: 'Manish Tiwari',  phone: '919876543206', skills: ['GENERAL_HELPER', 'FORKLIFT_MHE'], kycStatus: 'APPROVED', tier: 'high' },
  { name: 'Rajesh Patel',   phone: '919876543207', skills: ['SCANNER_TRAINED'],                kycStatus: 'APPROVED', tier: 'high' },
  { name: 'Ankit Verma',    phone: '919876543208', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'high' },
  { name: 'Sanjay Mishra',  phone: '919876543209', skills: ['FORKLIFT_MHE', 'COLD_STORAGE'],   kycStatus: 'APPROVED', tier: 'high' },
  { name: 'Pradeep Joshi',  phone: '919876543210', skills: ['GENERAL_HELPER', 'SCANNER_TRAINED'],kycStatus: 'APPROVED', tier: 'high' },

  // Moderate reliability (score 60-84)
  { name: 'Rahul Chauhan',  phone: '919876543211', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'moderate' },
  { name: 'Naresh Thakur',  phone: '919876543212', skills: ['SCANNER_TRAINED'],                kycStatus: 'APPROVED', tier: 'moderate' },
  { name: 'Hemant Dubey',   phone: '919876543213', skills: ['FORKLIFT_MHE'],                   kycStatus: 'APPROVED', tier: 'moderate' },
  { name: 'Santosh Rawat',  phone: '919876543214', skills: ['GENERAL_HELPER', 'COLD_STORAGE'], kycStatus: 'APPROVED', tier: 'moderate' },
  { name: 'Arun Bajpai',    phone: '919876543215', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'moderate' },
  { name: 'Manoj Pandey',   phone: '919876543216', skills: ['SCANNER_TRAINED', 'FORKLIFT_MHE'],kycStatus: 'APPROVED', tier: 'moderate' },
  { name: 'Dinesh Kaur',    phone: '919876543217', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'moderate' },
  { name: 'Nitin Saxena',   phone: '919876543218', skills: ['COLD_STORAGE'],                   kycStatus: 'APPROVED', tier: 'moderate' },
  { name: 'Ajay Dixit',     phone: '919876543219', skills: ['GENERAL_HELPER', 'SCANNER_TRAINED'],kycStatus: 'APPROVED', tier: 'moderate' },
  { name: 'Vivek Srivastava',phone: '919876543220', skills: ['FORKLIFT_MHE'],                  kycStatus: 'APPROVED', tier: 'moderate' },

  // Low reliability (score 30-59)
  { name: 'Raju Meena',     phone: '919876543221', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'low' },
  { name: 'Bunty Yadav',    phone: '919876543222', skills: ['GENERAL_HELPER'],                 kycStatus: 'PENDING',  tier: 'low' },
  { name: 'Pappu Gautam',   phone: '919876543223', skills: ['SCANNER_TRAINED'],                kycStatus: 'APPROVED', tier: 'low' },
  { name: 'Lucky Sharma',   phone: '919876543224', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'low' },
  { name: 'Tinku Singh',    phone: '919876543225', skills: ['FORKLIFT_MHE'],                   kycStatus: 'PENDING',  tier: 'low' },
  { name: 'Rinku Prasad',   phone: '919876543226', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'low' },
  { name: 'Bablu Nishad',   phone: '919876543227', skills: ['COLD_STORAGE'],                   kycStatus: 'APPROVED', tier: 'low' },
  { name: 'Pintu Rajput',   phone: '919876543228', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'low' },
  { name: 'Sunny Kashyap',  phone: '919876543229', skills: ['SCANNER_TRAINED'],                kycStatus: 'PENDING',  tier: 'low' },
  { name: 'Golu Maurya',    phone: '919876543230', skills: ['GENERAL_HELPER'],                 kycStatus: 'APPROVED', tier: 'low' },
];

// Reliability history parameters by tier
const TIER_PARAMS = {
  high:     { offered: 20, acceptRate: 0.92, completionRate: 0.96, noShowRate: 0.02 },
  moderate: { offered: 15, acceptRate: 0.75, completionRate: 0.80, noShowRate: 0.12 },
  low:      { offered: 12, acceptRate: 0.55, completionRate: 0.55, noShowRate: 0.30 },
};

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function main() {
  console.log('Seeding database...');

  // Clean up existing data (order matters due to FK constraints)
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.shiftOffer.deleteMany();
  await prisma.request.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.site.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleaned existing data');

  // ------------------------------------------------------------------
  // 1. Demo company user
  // ------------------------------------------------------------------
  const companyUser = await prisma.user.create({
    data: {
      supabaseId: 'demo-supabase-id-company-001',
      email: 'demo@delhilogistics.com',
      role: 'CUSTOMER',
    },
  });

  const company = await prisma.company.create({
    data: {
      userId: companyUser.id,
      name: 'Delhi Logistics Co.',
      gstNumber: '07AADCD1234F1Z5',
      address: 'Plot 45, Sector 18, Gurugram, Haryana 122015',
      contactName: 'Vikram Malhotra',
      contactPhone: '919811234567',
    },
  });
  console.log(`Created company: ${company.name}`);

  // ------------------------------------------------------------------
  // 2. Sites
  // ------------------------------------------------------------------
  const site1 = await prisma.site.create({
    data: {
      companyId: company.id,
      name: 'Gurgaon Warehouse',
      address: 'Plot 12A, IMT Manesar, Gurugram, Haryana 122050',
      lat: 28.4595,
      lng: 77.0266,
      radiusMeters: 300,
    },
  });

  const site2 = await prisma.site.create({
    data: {
      companyId: company.id,
      name: 'Noida Distribution Center',
      address: 'A-45, Sector 63, Noida, Uttar Pradesh 201301',
      lat: 28.5355,
      lng: 77.3910,
      radiusMeters: 250,
    },
  });
  console.log(`Created sites: ${site1.name}, ${site2.name}`);

  // ------------------------------------------------------------------
  // 3. Workers with realistic reliability histories
  // ------------------------------------------------------------------
  const createdWorkers: { id: string; tier: string }[] = [];

  for (const w of WORKERS) {
    const params = TIER_PARAMS[w.tier];
    const offered = params.offered;
    const accepted = Math.round(offered * params.acceptRate);
    const completed = Math.round(accepted * params.completionRate);
    const noShows = Math.round(offered * params.noShowRate);

    const reliabilityScore = computeReliabilityScore({
      totalShiftsOffered: offered,
      totalShiftsAccepted: accepted,
      totalShiftsCompleted: completed,
      totalNoShows: noShows,
    });

    const worker = await prisma.worker.create({
      data: {
        name: w.name,
        phone: w.phone,
        skills: w.skills,
        kycStatus: w.kycStatus,
        isActive: true,
        whatsappOptIn: true,
        reliabilityScore,
        totalShiftsOffered: offered,
        totalShiftsAccepted: accepted,
        totalShiftsCompleted: completed,
        totalNoShows: noShows,
        avgPunctualityMins: w.tier === 'high' ? -3 : w.tier === 'moderate' ? 5 : 18,
      },
    });

    createdWorkers.push({ id: worker.id, tier: w.tier });
  }
  console.log(`Created ${createdWorkers.length} workers`);

  // ------------------------------------------------------------------
  // 4. Requests
  // ------------------------------------------------------------------

  // Request 1: Today's morning shift at Gurgaon — IN_PROGRESS
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const request1 = await prisma.request.create({
    data: {
      companyId: company.id,
      siteId: site1.id,
      title: 'Gurgaon Morning Shift — General & Forklift',
      date: today,
      shiftStart: '06:00',
      shiftEnd: '14:00',
      headcount: 10,
      targetHeadcount: 10,
      guaranteedHeadcount: 8,
      skillTags: ['GENERAL_HELPER', 'FORKLIFT_MHE'],
      status: 'IN_PROGRESS',
      notes: 'Loading dock B operational. Forklift operators must hold valid licence.',
    },
  });

  // Request 2: Tomorrow at Noida — OPEN
  const tomorrow = addDays(today, 1);
  const request2 = await prisma.request.create({
    data: {
      companyId: company.id,
      siteId: site2.id,
      title: 'Noida Scanner Shift',
      date: tomorrow,
      shiftStart: '08:00',
      shiftEnd: '16:00',
      headcount: 5,
      targetHeadcount: 5,
      guaranteedHeadcount: 4,
      skillTags: ['SCANNER_TRAINED'],
      status: 'OPEN',
      notes: 'Must be comfortable with RF scanners.',
    },
  });

  // Request 3: Next week recurring at Gurgaon — OPEN
  const nextWeek = addDays(today, 7);
  const request3 = await prisma.request.create({
    data: {
      companyId: company.id,
      siteId: site1.id,
      title: 'Gurgaon Weekly General Helpers',
      date: nextWeek,
      shiftStart: '06:00',
      shiftEnd: '14:00',
      headcount: 10,
      targetHeadcount: 10,
      guaranteedHeadcount: 8,
      skillTags: ['GENERAL_HELPER'],
      status: 'OPEN',
      isRecurring: true,
      recurringDays: [1, 2, 3, 4, 5], // Mon–Fri
      notes: 'Weekly recurring contract. Steady bench required.',
    },
  });
  console.log('Created 3 requests');

  // ------------------------------------------------------------------
  // 5. Shift offers for Request 1 (all 10 workers offered, some accepted)
  // ------------------------------------------------------------------
  // Pick first 8 high/moderate workers for general helpers and 2 forklift
  const highWorkers = createdWorkers.filter((w) => w.tier === 'high').slice(0, 8);
  const forkWorkers = createdWorkers.filter((w) => w.tier === 'high').slice(3, 5);
  const offeredSet = new Set<string>();

  const req1WorkerIds = [
    ...highWorkers.map((w) => w.id),
    ...createdWorkers.filter((w) => w.tier === 'moderate').slice(0, 4).map((w) => w.id),
  ];

  for (const wid of req1WorkerIds.slice(0, 12)) {
    if (offeredSet.has(wid)) continue;
    offeredSet.add(wid);
    await prisma.shiftOffer.create({
      data: {
        requestId: request1.id,
        workerId: wid,
        status: 'ACCEPTED',
        offeredAt: daysAgo(1),
        respondedAt: daysAgo(0),
      },
    });
  }

  // Offer Request 2 workers
  const req2WorkerIds = createdWorkers
    .filter((w) => w.tier === 'high' || w.tier === 'moderate')
    .slice(1, 8)
    .map((w) => w.id);

  for (const wid of req2WorkerIds.slice(0, 6)) {
    await prisma.shiftOffer.upsert({
      where: { requestId_workerId: { requestId: request2.id, workerId: wid } },
      create: {
        requestId: request2.id,
        workerId: wid,
        status: 'PENDING',
        offeredAt: new Date(),
      },
      update: {},
    });
  }

  console.log('Created shift offers');

  // ------------------------------------------------------------------
  // 6. Check-ins for Request 1 — 7 of 10 workers checked in
  // ------------------------------------------------------------------
  const checkInWorkerIds = req1WorkerIds.slice(0, 7);
  const checkInTime = todayAt('06:05'); // slightly after shift start (5 min late)

  // Site 1 centre: lat 28.4595, lng 77.0266
  // Spread workers slightly within the 300m radius
  const checkInOffsets = [
    { dlat: 0.0005, dlng: 0.0003 },
    { dlat: -0.0003, dlng: 0.0007 },
    { dlat: 0.0008, dlng: -0.0002 },
    { dlat: -0.0006, dlng: -0.0005 },
    { dlat: 0.0001, dlng: 0.0009 },
    { dlat: 0.0004, dlng: -0.0008 },
    { dlat: -0.0002, dlng: 0.0004 },
  ];

  for (let i = 0; i < checkInWorkerIds.length; i++) {
    const wid = checkInWorkerIds[i];
    const offset = checkInOffsets[i];
    const lat = site1.lat + offset.dlat;
    const lng = site1.lng + offset.dlng;
    const pMin = 5 + i; // 5..11 minutes late

    const checkInAt = new Date(checkInTime.getTime() + i * 60 * 1000);
    // 4 workers have already checked out (shift mid-point reached)
    const hasCheckedOut = i < 4;
    const checkOutAt = hasCheckedOut
      ? new Date(todayAt('10:00').getTime() + i * 2 * 60 * 1000)
      : null;
    const hoursWorked = hasCheckedOut
      ? (checkOutAt!.getTime() - checkInAt.getTime()) / (1000 * 60 * 60)
      : null;

    await prisma.checkIn.create({
      data: {
        workerId: wid,
        requestId: request1.id,
        siteId: site1.id,
        checkInAt,
        checkInLat: lat,
        checkInLng: lng,
        checkOutAt,
        checkOutLat: hasCheckedOut ? lat + 0.00005 : null,
        checkOutLng: hasCheckedOut ? lng + 0.00005 : null,
        hoursWorked: hoursWorked ? Math.round(hoursWorked * 100) / 100 : null,
        isVerified: hasCheckedOut,
        punctualityMins: pMin,
      },
    });
  }
  console.log(`Created ${checkInWorkerIds.length} check-ins for Request 1 (4 with checkout)`);

  // ------------------------------------------------------------------
  // 7. Historical check-ins for workers (to back up their scores)
  // ------------------------------------------------------------------
  console.log('Creating historical check-in records...');

  // Use request 1 as the template request for historical check-ins is non-trivial
  // without separate historical requests, so we create lightweight records directly.
  // For a full system, each historical shift would have its own Request.
  // Here we attach them to request1 to satisfy FK — in production each shift is a separate request.

  for (let i = 0; i < createdWorkers.length; i++) {
    const w = createdWorkers[i];
    const params = TIER_PARAMS[w.tier as keyof typeof TIER_PARAMS];
    const completed = Math.round(params.offered * params.acceptRate * params.completionRate);

    for (let j = 0; j < Math.min(completed, 5); j++) {
      const shiftDaysAgo = 7 + j * 7; // weekly historical shifts
      const ciAt = daysAgo(shiftDaysAgo);
      ciAt.setHours(6, 5 + j, 0, 0);
      const coAt = new Date(ciAt.getTime() + 8 * 60 * 60 * 1000);

      await prisma.checkIn.create({
        data: {
          workerId: w.id,
          requestId: request1.id,
          siteId: site1.id,
          checkInAt: ciAt,
          checkInLat: site1.lat + 0.0002 * (j % 3),
          checkInLng: site1.lng - 0.0002 * (j % 2),
          checkOutAt: coAt,
          checkOutLat: site1.lat + 0.0003 * (j % 3),
          checkOutLng: site1.lng - 0.0001 * (j % 2),
          hoursWorked: 8.0,
          isVerified: true,
          punctualityMins: w.tier === 'high' ? -2 + j : w.tier === 'moderate' ? 5 + j : 15 + j,
        },
      });
    }
  }

  console.log('Historical check-in records created');

  // ------------------------------------------------------------------
  // 8. Summary
  // ------------------------------------------------------------------
  const workerCount = await prisma.worker.count();
  const offerCount = await prisma.shiftOffer.count();
  const checkInCount = await prisma.checkIn.count();

  console.log('\n=== Seed Complete ===');
  console.log(`Company:  ${company.name} (${companyUser.email})`);
  console.log(`Sites:    ${site1.name}, ${site2.name}`);
  console.log(`Workers:  ${workerCount} (10 high / 10 moderate / 10 low reliability)`);
  console.log(`Requests: 3`);
  console.log(`  - Request 1 (IN_PROGRESS, today): ${request1.id}`);
  console.log(`  - Request 2 (OPEN, tomorrow):     ${request2.id}`);
  console.log(`  - Request 3 (OPEN, next week):    ${request3.id}`);
  console.log(`Offers:   ${offerCount}`);
  console.log(`CheckIns: ${checkInCount} (7 today for request 1, rest historical)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
