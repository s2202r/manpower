# Manpower — Warehouse Staffing Platform

A B2B on-demand staffing platform purpose-built for warehouses and logistics operations in Delhi NCR. Manpower connects warehouses with a vetted pool of daily-wage workers — general helpers, forklift operators, scanner-trained staff, and cold-storage specialists — and automates the entire ops workflow from request to invoice.

**Three surfaces, one platform:**

| Surface | Audience | Purpose |
|---|---|---|
| Customer Dashboard (`apps/web`) | Warehouse managers / procurement | Post shifts, track fill rates, approve invoices |
| Worker App (`apps/worker-app`) | Daily-wage workers | Accept shifts, check in/out, view earnings |
| Ops Admin (inside `apps/web`) | Internal operations team | Manage worker bench, run matching, resolve exceptions |

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | NestJS 10, Prisma ORM |
| Customer Dashboard | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Worker App | Expo (React Native), Expo Router |
| Database | PostgreSQL 15 via Supabase |
| Auth | Supabase Auth (OTP for workers, email/password for customers) |
| Payments | Razorpay (payment links for invoices, payouts for workers) |
| Monorepo | Turborepo + npm workspaces |
| Shared Types | `@manpower/shared` (TypeScript enums + utility functions) |

---

## Prerequisites

- Node.js 20 or later
- npm 10+ (or pnpm 8+)
- A Supabase project (free tier is fine) **or** Docker + Docker Compose for local Postgres
- Expo Go app on a physical device or Android/iOS simulator (for the worker app)

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url> manpower
cd manpower
npm install
```

### 2. Copy environment files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

### 3. Configure Supabase credentials

Open `apps/api/.env` and fill in:

```
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
```

Open `apps/web/.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:3001
```

> **Using local Docker instead of Supabase?** Run `docker-compose up -d postgres` and set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/manpower`.

### 4. Run database migrations

```bash
cd apps/api
npx prisma migrate dev
```

### 5. Seed demo data

```bash
cd apps/api
npx ts-node prisma/seed.ts
```

This creates:
- 1 demo company: **Delhi Logistics Pvt Ltd** (`demo@delhilogistics.com` / `demo1234`)
- 2 warehouse sites: Gurgaon Sector 37 and Noida Phase 2
- 30 workers with varied reliability scores and skill tags
- 3 active staffing requests (one AT_RISK fill rate)
- Sample invoices and check-in records

### 6. Start the API

```bash
cd apps/api
npm run start:dev
# API runs at http://localhost:3001
```

### 7. Start the customer dashboard

```bash
cd apps/web
npm run dev
# Dashboard at http://localhost:3000
```

### 8. Start the worker app

```bash
cd apps/worker-app
npm run android   # or: npm run ios
```

---

## 15-Minute Demo Walkthrough

This walkthrough follows the seeded demo data. Run all three services before starting.

### (0:00) — Login

Open [http://localhost:3000](http://localhost:3000). Log in with:

- **Email:** `demo@delhilogistics.com`
- **Password:** `demo1234`

### (1:00) — Dashboard overview

The home screen shows:

- Active requests count and today's total headcount across all sites
- Fill rate summary cards — one card is amber (AT_RISK), indicating a shift that may not reach 95% fill
- Quick links to pending invoice approvals

### (2:00) — Drill into an at-risk shift

Click **"Gurgaon Warehouse Morning Shift"** in the active requests table.

- The **fill rate card** shows AT_RISK in amber: 7 confirmed out of a target of 10 workers (70% fill rate)
- The **attendance board** lists the 7 checked-in workers by name, skill tag, and check-in time
- A real-time timer shows how long the shift has been running

### (4:00) — Create a new staffing request

Navigate to **Requests → New Request**. Fill in:

- Site: Noida Phase 2
- Date: tomorrow's date
- Shift window: 08:00 – 17:00
- Headcount: 20
- Skill tags: General Helper, Scanner Trained
- Notes: "Annual sale peak — strict punctuality required"

### (6:00) — Submit and see overbooking suggestion

Click **Submit**. Before confirming, the system displays the overbooking recommendation:

> "Based on historical accept rate (82%) and show-up rate (91%) for this site, we recommend sending **24 offers** to reliably fill 20 spots."

Accept the suggestion. The request moves to OPEN status and offers are queued for dispatch via WhatsApp.

### (7:00) — Sites with geofence

Navigate to **Sites**. The map shows both demo sites:

- **Gurgaon Sector 37** — 28.4595° N, 77.0266° E, 200 m geofence radius
- **Noida Phase 2** — 28.5705° N, 77.3219° E, 150 m geofence radius

Workers can only check in when their GPS position falls within the geofence. The radius is configurable per site.

### (8:00) — Invoices

Navigate to **Invoices**. The table shows one SENT invoice and one DRAFT:

- **INV-2024-001** — Delhi Logistics, ₹28,320 (incl. 18% GST), due in 12 days
- Click the row to open the invoice detail

### (9:00) — Invoice detail

The invoice detail page shows:

- Line items: worker name, skill, hours worked, rate (₹120/hr), amount
- **Booked vs Billed delta**: 10 workers booked, 9 billed (1 no-show excluded from billing)
- GST breakdown: subtotal ₹24,000 + GST ₹4,320 = ₹28,320
- Razorpay payment link placeholder (active once Razorpay is configured)
- Net-15 payment terms prominently displayed

### (10:00) — Worker bench

Navigate to **Ops → Worker Bench**. A table of 30 workers with:

- Name, phone (masked), skills, KYC status
- Reliability score (0–100) color-coded: green ≥ 80, amber 60–79, red < 60
- Filter by skill tag (e.g., show only Forklift / MHE workers)
- Sort by reliability score descending to surface your best performers

### (11:00) — Worker profile

Click any worker to open their profile:

- Attendance history: last 10 shifts with check-in time, punctuality delta, hours worked
- Reliability score breakdown: completion rate contributes 60%, show-up rate 40%
- KYC status badge (Verified / Pending / Not Submitted)
- Cumulative earnings (for ops visibility)

### (12:00) — Analytics

Navigate to **Ops → Analytics**:

- **Fill rate per site** bar chart — compare Gurgaon vs Noida over the last 30 days
- **No-show trend** line chart — weekly no-show rate
- **Top workers** by shifts completed this month

### (13:00) — Compliance tab

Navigate to **Ops → Compliance**:

- A placeholder card reads: _"ESIC / PF / CLRA automation — coming soon. This module will auto-generate Form 6, Form 7, and monthly contractor returns."_
- Current manual workflow guidance is linked

### (14:00) — Worker app overview

Switch to the worker app on your device or emulator:

1. **OTP Login** — enter a demo worker phone number; OTP arrives via Supabase Auth (or use a test OTP in dev mode)
2. **Shift list** — upcoming accepted shifts shown as cards with site name, date, shift window, and pay estimate
3. **Check-in flow** — tap Check In → app requests location → verifies geofence → captures selfie → confirms check-in
4. **Earnings screen** — shows completed shifts, hours worked, amount earned; the Instant Payout button is visible but disabled (Earned Wage Access coming soon)

### (15:00) — Wrap

> "Manpower bills only for verified, geofenced check-ins — eliminating time-theft and dispute resolution. The reliability score surfaces your best workers automatically. And the platform handles the entire ops workflow end-to-end: from posting a shift request to generating a GST-compliant invoice."

---

## Architecture

```
                         ┌─────────────────────────────────┐
                         │         Supabase Auth            │
                         │  (JWT tokens, OTP for workers)   │
                         └────────────┬────────────────────┘
                                      │ JWT
          ┌───────────────────────────▼──────────────────────────┐
          │                   NestJS API (port 3001)              │
          │   Guards │ Services │ Prisma ORM │ Cron Jobs          │
          └──────┬────────────────────────────────┬──────────────┘
                 │                                │
    ┌────────────▼──────────┐       ┌─────────────▼─────────────┐
    │  PostgreSQL (Supabase) │       │   External Integrations    │
    │  - User / Company      │       │   - Razorpay (payments)    │
    │  - Request / ShiftOffer│       │   - WhatsApp Business API  │
    │  - CheckIn / Invoice   │       │   - SMS (OTP fallback)     │
    │  - Worker / Payout     │       └───────────────────────────┘
    └───────────────────────┘
                 ▲                               ▲
                 │                               │
    ┌────────────┴──────────┐       ┌────────────┴──────────────┐
    │  Next.js 14 Dashboard  │       │  Expo React Native App     │
    │  (Customer + Ops Admin)│       │  (Worker check-in & pay)   │
    │  port 3000             │       │  Android / iOS             │
    └───────────────────────┘       └───────────────────────────┘

    WhatsApp webhook ──────────────────► NestJS API
    (worker shift responses)
```

---

## Roadmap

| Feature | Status |
|---|---|
| ESIC / PF / CLRA auto-returns | Planned Q3 2025 |
| Earned Wage Access (instant daily payout) | Planned Q3 2025 |
| KYC + police verification integration | Planned Q4 2025 |
| Surge / dynamic pricing by shift urgency | Planned Q4 2025 |
| WhatsApp bot for workers (shift accept/decline) | In Progress |
| Multi-city expansion (Mumbai, Bengaluru) | Planned Q1 2026 |
| Worker ratings by customers | Planned Q1 2026 |

---

## Environment Variables Reference

### `apps/api/.env`

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Prisma connection string to Postgres | `postgresql://user:pass@host:5432/db` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) | `eyJhbGci...` |
| `SUPABASE_JWT_SECRET` | JWT secret for verifying Supabase tokens | `super-secret-jwt-secret` |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | `...` |
| `WHATSAPP_API_URL` | WhatsApp Business API base URL | `https://graph.facebook.com/v18.0` |
| `WHATSAPP_TOKEN` | WhatsApp access token | `EAABsb...` |
| `WHATSAPP_PHONE_ID` | WhatsApp phone number ID | `1234567890` |
| `PORT` | API server port (default 3001) | `3001` |

### `apps/web/.env.local`

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGci...` |
| `NEXT_PUBLIC_API_URL` | NestJS API base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps API key (for site map) | `AIzaSy...` |

---

## Project Structure

```
manpower/
├── apps/
│   ├── api/                  # NestJS + Prisma backend
│   │   ├── src/
│   │   │   ├── auth/         # Supabase JWT guard
│   │   │   ├── requests/     # Staffing request CRUD
│   │   │   ├── workers/      # Worker management
│   │   │   ├── checkins/     # Geofenced check-in/out
│   │   │   ├── invoices/     # Invoice generation
│   │   │   └── payouts/      # Worker payout processing
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   ├── web/                  # Next.js 14 dashboard
│   │   └── src/app/
│   │       ├── dashboard/
│   │       ├── requests/
│   │       ├── sites/
│   │       ├── invoices/
│   │       └── ops/
│   └── worker-app/           # Expo React Native
│       └── app/
│           ├── (auth)/
│           ├── shifts/
│           ├── checkin/
│           └── earnings/
├── packages/
│   └── shared/               # @manpower/shared — shared TypeScript types
│       └── src/index.ts
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## License

Private — all rights reserved.
