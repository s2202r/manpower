# Manpower — Warehouse Staffing Platform

Manpower is a B2B on-demand staffing platform purpose-built for warehouses and third-party logistics operators in Delhi NCR. It connects operations managers to a vetted pool of daily-wage workers — general helpers, forklift operators, scanner-trained staff, and cold-storage specialists — and automates the entire workflow from shift request to GST-compliant invoice. The platform replaces labour contractors with a transparent, tech-first layer: workers check in on their phones with GPS verification, you see fill rates in real time, and you only pay for hours that actually happened.

---

## Architecture

```
                        ┌─────────────────────────────────────┐
                        │           Supabase Auth              │
                        │  Email/password (customers + ops)    │
                        │  OTP via WhatsApp/SMS (workers)      │
                        └──────────────┬──────────────────────┘
                                       │ JWT (RS256)
         ┌─────────────────────────────▼──────────────────────────────┐
         │                   NestJS API  :3001                        │
         │                                                            │
         │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
         │  │ Requests │  │ CheckIns │  │ Invoices │  │ Workers  │  │
         │  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │
         │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
         │       └─────────────┴──────────────┴─────────────┘        │
         │                         Prisma ORM                        │
         └───────────────────────────┬────────────────────────────────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │         PostgreSQL 15  (Supabase / Docker)   │
              │                                              │
              │  User · Company · Site · Worker              │
              │  Request · ShiftOffer · CheckIn              │
              │  Invoice · InvoiceLineItem · Payout          │
              └──────────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼────────────────────────────┐
         │                           │                            │
         ▼                           ▼                            ▼
┌─────────────────┐     ┌─────────────────────┐     ┌───────────────────┐
│ Next.js 14 Web  │     │ Expo React Native    │     │ External Services │
│ :3000           │     │ Worker App           │     │                   │
│                 │     │ Android + iOS        │     │ WhatsApp Business │
│ Customer dash   │     │                      │     │ (shift offers)    │
│ Ops console     │     │ Shift list           │     │                   │
│ Fill-rate view  │     │ GPS check-in/out     │     │ Razorpay          │
│ Invoice mgmt    │     │ Earnings & payouts   │     │ (invoices/payout) │
└─────────────────┘     └─────────────────────┘     └───────────────────┘
         ▲
         │ WhatsApp webhook (worker shift responses)
```

---

## Quick Start — Demo in 5 Steps

This gets the demo running locally. All three services start independently; you only need steps 1–4 to run the web dashboard and API.

### Step 1 — Install

```bash
git clone <repo-url> manpower
cd manpower
npm install          # installs all workspaces via npm workspaces
```

### Step 2 — Configure environment

```bash
cp apps/api/.env.example     apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

**Fastest path — use Docker Postgres (no Supabase account needed for the demo):**

```bash
docker compose up -d postgres redis
```

Edit `apps/api/.env` — the defaults below work against the Docker container:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/manpower?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/manpower?schema=public"
SUPABASE_JWT_SECRET="local-dev-secret-change-in-production"
PORT=3001
```

Edit `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321    # or your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3 — Migrate and seed

```bash
cd apps/api
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

The seed takes about 10 seconds and prints a summary:

```
=== Seed Complete ===
Company:  Delhi Logistics Co. (demo@delhilogistics.com)
Sites:    Gurgaon Warehouse, Noida Distribution Center
Workers:  30 (10 high / 10 moderate / 10 low reliability)
Requests: 3
  - Request 1 (IN_PROGRESS, today)
  - Request 2 (OPEN, tomorrow)
  - Request 3 (OPEN, next week recurring)
Offers:   18
CheckIns: ~155 (7 today + historical)
```

### Step 4 — Start the API and dashboard

Open two terminals:

```bash
# Terminal 1 — API
cd apps/api && npm run start:dev
# Listening on http://localhost:3001

# Terminal 2 — Web dashboard
cd apps/web && npm run dev
# Open http://localhost:3000
```

### Step 5 — Log in

Open `http://localhost:3000` and sign in with the demo credentials:

| Field    | Value                        |
|----------|------------------------------|
| Email    | `demo@delhilogistics.com`    |
| Password | `demo1234`                   |
| Role     | Customer (ops manager view)  |

For the ops console, use `ops@manpower.in` / `ops1234` (if your auth is seeded — see "Seeded demo data" below).

---

## Environment Variables

### `apps/api/.env`

| Variable                    | Required | Description                                                         |
|-----------------------------|----------|---------------------------------------------------------------------|
| `DATABASE_URL`              | Yes      | Prisma connection string (pooled, for queries)                      |
| `DIRECT_URL`                | Yes      | Non-pooled connection (for migrations)                              |
| `PORT`                      | No       | API listen port. Default: `3001`                                    |
| `NODE_ENV`                  | No       | `development` or `production`                                       |
| `SUPABASE_URL`              | Yes*     | Your Supabase project URL (`https://xyz.supabase.co`)               |
| `SUPABASE_ANON_KEY`         | Yes*     | Supabase public anon key                                            |
| `SUPABASE_JWT_SECRET`       | Yes      | JWT secret for verifying tokens. Find in Supabase project settings  |
| `SUPABASE_PROJECT_REF`      | No       | Project ref (used by some admin operations)                         |
| `WHATSAPP_PHONE_NUMBER_ID`  | No       | WhatsApp Business phone number ID from Meta developer portal        |
| `WHATSAPP_ACCESS_TOKEN`     | No       | Permanent WhatsApp access token                                     |
| `WHATSAPP_API_VERSION`      | No       | Meta Graph API version. Default: `v18.0`                            |
| `RAZORPAY_KEY_ID`           | No       | Razorpay API key ID (`rzp_test_...` for test mode)                  |
| `RAZORPAY_KEY_SECRET`       | No       | Razorpay API secret                                                 |
| `RAZORPAY_ACCOUNT_NUMBER`   | No       | Razorpay linked bank account number (for worker payouts)            |
| `DEFAULT_GST_RATE`          | No       | GST rate applied to invoices. Default: `0.18`                       |
| `INVOICE_DUE_DAYS`          | No       | Payment terms in days. Default: `30`                                |
| `DEFAULT_HOURLY_RATE`       | No       | Default billing rate (INR/hr). Default: `200`                       |

`*` Not required when running against local Docker Postgres with a dummy JWT secret.

### `apps/web/.env.local`

| Variable                        | Required | Description                                      |
|---------------------------------|----------|--------------------------------------------------|
| `NEXT_PUBLIC_API_URL`           | Yes      | NestJS API base URL                              |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL (exposed to browser)        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon key (safe to expose)               |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY`   | No       | Google Maps JavaScript API key (site map view)   |

### `apps/worker-app/.env`

| Variable                        | Required | Description                                |
|---------------------------------|----------|--------------------------------------------|
| `EXPO_PUBLIC_API_URL`           | Yes      | NestJS API base URL                        |
| `EXPO_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL                       |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon key                          |

---

## Seeded Demo Data

The seed script (`apps/api/prisma/seed.ts`) creates a self-contained demo environment:

### Company and sites

| Field          | Value                                                     |
|----------------|-----------------------------------------------------------|
| Company        | Delhi Logistics Co.                                       |
| GST number     | 07AADCD1234F1Z5                                           |
| Contact        | Vikram Malhotra                                           |
| Site 1         | Gurgaon Warehouse — Plot 12A, IMT Manesar (28.4595, 77.0266) · 300 m geofence |
| Site 2         | Noida Distribution Center — Sector 63 Noida (28.5355, 77.3910) · 250 m geofence |

### Workers (30 total)

Workers are distributed across three reliability tiers so the ops console shows a realistic mix:

| Tier     | Count | Reliability Score | Accept Rate | Show-up Rate | Punctuality  |
|----------|-------|-------------------|-------------|--------------|--------------|
| High     | 10    | 85 – 97           | 92%         | 96%          | ~3 min early |
| Moderate | 10    | 62 – 79           | 75%         | 80%          | ~5 min late  |
| Low      | 10    | 30 – 57           | 55%         | 55%          | ~18 min late |

All workers have 5 weeks of historical check-in records that back up their reliability scores. Skills cover all four tags: General Helper, Forklift/MHE, Scanner Trained, Cold Storage.

### Requests

| Request       | Status      | Site             | Date        | Headcount | Skills                           |
|---------------|-------------|------------------|-------------|-----------|----------------------------------|
| Morning Shift | IN_PROGRESS | Gurgaon Warehouse | Today       | 10        | General Helper, Forklift/MHE     |
| Scanner Shift | OPEN        | Noida DC         | Tomorrow    | 5         | Scanner Trained                  |
| Weekly Helpers| OPEN        | Gurgaon Warehouse | Next week   | 10        | General Helper (Mon–Fri recur.)  |

The today's IN_PROGRESS request has **7 of 10 workers checked in**, with 4 already checked out — giving you a live fill-rate view at `IN_PROGRESS` fill rate of 70%, which triggers the AT_RISK state. This is intentional: it makes the fill-rate story visible immediately.

---

## Demo Script — 15-Minute Walkthrough with an Ops Manager

Use this script when demoing to a warehouse operations manager or logistics head. Keep the browser tab open alongside this document.

> Tip: run the demo with the seeded data but open two browser windows side by side — the customer dashboard on the left, and the ops console (`/ops`) on the right.

---

### Step 1 — Customer dashboard (minutes 0 – 3)

**Say:** "This is what your ops manager sees every morning when they open Manpower."

Open `http://localhost:3000/dashboard`. Walk through:

- The **summary bar** at the top: X active shifts today, Y workers confirmed, Z check-ins live.
- The **fill-rate cards** — one is amber (AT_RISK). Point to it: "This is the Gurgaon morning shift. 7 of 10 workers are confirmed. We flagged it at amber because it's below the 95% fill threshold you set."
- The **active requests table**: date, site, shift window, headcount, fill rate, status badge.

**Key message:** "This replaces the WhatsApp group and the morning phone calls to your contractor. Everything is in one place, and it updates in real time."

---

### Step 2 — Drill into the live shift (minutes 3 – 5)

Click the **Gurgaon Warehouse Morning Shift** row.

Walk through the request detail page:

- **Fill rate progress bar**: 7/10 confirmed, 70% fill rate, AT_RISK in amber.
- **Live attendance board**: a list of the 7 checked-in workers — name, skill tag, check-in time, punctuality delta.
- Point to one worker who is `+5 min` late: "The system captured that Ravi checked in 5 minutes late. That gets recorded against his reliability score — automatically, no manual intervention."
- Point to the 3 workers who haven't checked in: "These 3 accepted the offer but haven't arrived yet. We've already sent a WhatsApp reminder. If they're no-shows, we'll re-offer to standby workers."

**Key message:** "You're not waiting for your supervisor to send you a headcount update on WhatsApp at 8 AM. You see it here, live."

---

### Step 3 — Create a staffing request (minutes 5 – 8)

Click **New Request** in the sidebar.

Fill in the form live with the ops manager watching:

```
Site:         Noida Distribution Center
Date:         [pick tomorrow's date]
Shift start:  08:00
Shift end:    17:00
Headcount:    20
Skills:       General Helper, Scanner Trained
Notes:        Annual sale peak — strict punctuality required
```

Click **Submit**. The system shows the **overbooking recommendation**:

> "Based on the accept rate (82%) and show-up rate (88%) for Scanner Trained workers at this site, we recommend sending **28 offers** to reliably fill 20 spots."

**Say:** "We over-invite by default. We know that historically 18% of workers who accept don't show up. So we build that buffer in automatically — you don't have to do this calculation yourself."

Click **Confirm with suggested buffer**. The request moves to OPEN and offers go out.

**Key message:** "You posted a 20-person shift in 90 seconds. Your contractor would have taken 3 phone calls and a WhatsApp blast, and you'd still be worried about fill rate the night before."

---

### Step 4 — Fill rate view (minutes 8 – 10)

Navigate to **Analytics → Fill Rates**.

Show the fill rate chart (last 30 days, both sites):

- Gurgaon Warehouse: consistently 91–97%.
- Noida DC: 78–85% — lower because it's newer and the bench is smaller.

Point to the status legend: "Green is on-track (above 95%). Amber is at-risk (70–94%). Red is breached — that means we failed to fill the guaranteed headcount, and our SLA kicks in."

**Say:** "The guaranteed headcount is the number in your contract. Right now, for every Gurgaon shift, we're guaranteeing 8 out of 10. Every time we've missed that, we've credited your account. In 3 months, we've missed it twice."

**Key message:** "This is the fill rate dashboard your contractor can't show you because they don't have the data."

---

### Step 5 — Live attendance board (minutes 10 – 11)

Navigate back to the Gurgaon Morning Shift request detail page.

Point to the attendance board again:

**Say:** "Workers check in on their phone — they open the app, tap Check In, and it verifies their GPS location against this 300-metre geofence around the warehouse. If they're outside the boundary, check-in is rejected. No faking it from the parking lot."

**Say:** "They also capture a selfie at check-in. That's not just for attendance — it's your proof of presence for any compliance audit."

If you have the worker app running, switch to it briefly: show the one-tap check-in screen with the map and the geofence radius visible.

**Key message:** "This eliminates proxy attendance and buddy punching — two of the top three sources of inflated contractor bills."

---

### Step 6 — Invoice — "you only pay for verified hours" (minutes 11 – 14)

Navigate to **Invoices**.

Open the most recent invoice (INV-2024XX-XXXX).

Walk through the invoice detail:

- **Line items** at the top: worker name, skill, date, hours worked, rate (₹200/hr), amount per line. Each line links to a verified check-in.
- Point to the **Booked vs Billed** box:
  ```
  Booked:  10 workers × 8 hrs = 80 hrs → ₹16,000
  Billed:   9 workers × 8 hrs = 72 hrs → ₹14,400
  Saved:                         8 hrs → ₹1,600 (+ ₹288 GST)
  ```
- **Say:** "One worker was a no-show. Under your old contract, you'd have been billed for all 10 because the contractor's bill is headcount-based. We only bill for hours that were worked and GPS-verified. You saved ₹1,888 on this one shift."

- Point to the **GST breakdown**: subtotal, 18% GST, total.
- Point to the **Razorpay payment link**: "You pay directly from this link — no bank transfer details to manage, no NEFT delays."

**Key message:** "You pay for outcomes, not bookings. Today, the saving was ₹1,888. Over a month with 25 shifts, that compounds."

---

### Step 7 — Ops console — "why we never miss fill rate" (minutes 14 – 15)

Navigate to **Ops Console** (or open `http://localhost:3000/ops` in the second window).

Show the two key panels:

**Worker reliability scores:**

Point to the worker table sorted by reliability score. Show the three tiers:

- Green (score 85+): "These are the workers we send first. They've accepted and shown up 96% of the time in their history."
- Amber (score 60–84): "Good workers, slightly inconsistent. We use them for buffer slots."
- Red (score below 60): "We monitor these. They stay on the bench for low-urgency shifts only."

**Say:** "The reliability score is computed automatically from every check-in record. There's no human rating workers — the data rates them."

**Overbooking logic:**

Point to the fill-risk alert for today's Gurgaon shift (AT_RISK):

**Say:** "This is our early-warning system. When a shift drops below 80% confirmed with more than 4 hours to go, we automatically send a top-up offer to the next tier of workers. This is why we almost never miss the guaranteed headcount."

**Closing line:** "Manpower is not a staffing agency with an app. It's an operating system for your daily labour — it removes the contractor middleman, gives you verified data instead of phone calls, and bills you only for what happened. The reliability engine and the overbooking algorithm are what make that guarantee real."

---

## API Endpoints Reference

Base URL: `http://localhost:3001`

All endpoints require a Supabase JWT in the `Authorization: Bearer <token>` header, except where noted.

### Auth

The API validates Supabase JWTs — no separate auth endpoints. Obtain tokens from Supabase Auth (`supabase.auth.signInWithPassword` or OTP flow).

### Requests

| Method | Path                                  | Auth role | Description                              |
|--------|---------------------------------------|-----------|------------------------------------------|
| POST   | `/requests`                           | CUSTOMER  | Create a new staffing request            |
| GET    | `/requests`                           | CUSTOMER  | List all requests for the caller's company |
| GET    | `/requests/:id`                       | Any       | Get a single request with offers + check-ins |
| PUT    | `/requests/:id`                       | CUSTOMER  | Update request details or status         |
| GET    | `/requests/:id/overbooking-suggestion`| Any       | Get recommended offer buffer for a request |
| GET    | `/requests/:id/fill-risk`             | Any       | Get current fill risk status             |
| GET    | `/requests/admin/all`                 | OPS_ADMIN | List all requests across all companies   |

### Workers

| Method | Path                    | Auth role | Description                              |
|--------|-------------------------|-----------|------------------------------------------|
| GET    | `/workers`              | OPS_ADMIN | List all workers with reliability stats  |
| GET    | `/workers/:id`          | OPS_ADMIN | Get worker detail                        |
| POST   | `/workers`              | OPS_ADMIN | Register a new worker                    |
| PUT    | `/workers/:id`          | OPS_ADMIN | Update worker profile / KYC status       |
| GET    | `/workers/:id/checkins` | OPS_ADMIN | Worker's check-in history                |

### Check-ins

| Method | Path                    | Auth role | Description                             |
|--------|-------------------------|-----------|-----------------------------------------|
| POST   | `/checkins`             | WORKER    | Check in (geofence + selfie validation) |
| PUT    | `/checkins/:id/checkout`| WORKER    | Check out (closes the shift record)     |
| GET    | `/checkins/request/:id` | Any       | All check-ins for a request             |
| GET    | `/checkins/:id`         | Any       | Single check-in detail                  |
| PUT    | `/checkins/:id/verify`  | OPS_ADMIN | Manually mark a check-in as verified    |

### Invoices

| Method | Path                    | Auth role | Description                             |
|--------|-------------------------|-----------|-----------------------------------------|
| POST   | `/invoices/generate`    | OPS_ADMIN | Generate invoice from verified check-ins|
| GET    | `/invoices`             | CUSTOMER  | List invoices for the caller's company  |
| GET    | `/invoices/:id`         | CUSTOMER  | Invoice detail with line items          |
| PUT    | `/invoices/:id/paid`    | OPS_ADMIN | Mark invoice as paid                    |

### Analytics

| Method | Path                         | Auth role | Description                               |
|--------|------------------------------|-----------|-------------------------------------------|
| GET    | `/analytics/fill-rates`      | Any       | Fill rate by date and site (`?from=&to=`) |
| GET    | `/analytics/ops-console`     | OPS_ADMIN | Today's ops overview (`?date=YYYY-MM-DD`) |
| GET    | `/analytics/workers`         | OPS_ADMIN | Worker reliability distribution           |
| GET    | `/analytics/revenue`         | OPS_ADMIN | Billed vs booked revenue (`?from=&to=`)   |

### Sites

| Method | Path             | Auth role | Description               |
|--------|------------------|-----------|---------------------------|
| POST   | `/sites`         | CUSTOMER  | Create a site             |
| GET    | `/sites`         | CUSTOMER  | List company's sites      |
| GET    | `/sites/:id`     | Any       | Get site detail           |
| PUT    | `/sites/:id`     | CUSTOMER  | Update site / geofence    |

### Offers

| Method | Path                        | Auth role | Description                           |
|--------|-----------------------------|-----------|---------------------------------------|
| GET    | `/offers/worker/:workerId`  | OPS_ADMIN | All offers for a worker               |
| PUT    | `/offers/:id/accept`        | WORKER    | Worker accepts an offer               |
| PUT    | `/offers/:id/decline`       | WORKER    | Worker declines an offer              |

---

## Project Structure

```
manpower/
├── apps/
│   ├── api/                        NestJS 10 backend
│   │   ├── src/
│   │   │   ├── auth/               Supabase JWT guard
│   │   │   ├── analytics/          Fill rates, ops console, revenue
│   │   │   ├── checkins/           Geofenced check-in/out logic
│   │   │   ├── companies/          Company CRUD
│   │   │   ├── invoices/           Invoice generation + Razorpay links
│   │   │   ├── notifications/      WhatsApp offer dispatch
│   │   │   ├── offers/             Shift offer accept/decline
│   │   │   ├── requests/           Staffing request CRUD + fill risk
│   │   │   ├── sites/              Site CRUD
│   │   │   └── workers/            Worker management + reliability
│   │   └── prisma/
│   │       ├── schema.prisma       Source of truth for DB schema
│   │       └── seed.ts             30 workers, 3 requests, historical data
│   │
│   ├── web/                        Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── auth/               Sign-in page
│   │   │   ├── dashboard/          Summary + fill-rate cards
│   │   │   └── ops/                Ops console (worker bench, analytics)
│   │   └── components/
│   │       ├── invoices/           Invoice table + detail view
│   │       ├── requests/           Request form + attendance board
│   │       └── workers/            Worker table + profile card
│   │
│   └── worker-app/                 Expo (React Native)
│       └── app/
│           ├── (auth)/             OTP login
│           └── (tabs)/             Shifts, check-in, earnings
│
├── packages/
│   └── shared/                     @manpower/shared
│       └── src/
│           ├── index.ts            Enums, utility functions, constants
│           └── types.ts            API response interfaces + DTO shapes
│
├── supabase/
│   └── migrations/
│       └── 001_initial.sql        Schema + RLS policies
│
├── docker-compose.yml             Local Postgres + Redis + optional API
├── turbo.json                     Turborepo pipeline config
└── package.json                   Workspace root
```

---

## Deploy Guide

### Option A — Vercel (Recommended for demo)

The Next.js web app is fully self-contained: it includes built-in API route handlers that call Supabase directly. No separate backend server is required.

**Step 1 — Run the database schema in Supabase**

Open your Supabase project → **SQL Editor** → New Query, paste the contents of `supabase/migrations/001_initial.sql`, and click **Run**.

Then seed the demo data by running the seed script locally (requires Node 20+):

```bash
cd apps/api
cp .env.example .env
# Edit .env: set DATABASE_URL and DIRECT_URL to your Supabase connection string
# DATABASE_URL=postgresql://postgres:RDmanpower2026@db.omtkhyyzkrnvugkaqacj.supabase.co:5432/postgres
npm install
npx ts-node prisma/seed.ts
```

**Step 2 — Get your Supabase Service Role key**

In Supabase dashboard → **Settings → API**, copy the `service_role` secret key. You'll need it in Step 4.

**Step 3 — Deploy to Vercel**

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Set **Root Directory** to `apps/web`.
4. Vercel auto-detects Next.js — click Deploy.

**Step 4 — Set environment variables in Vercel**

In your Vercel project → **Settings → Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://omtkhyyzkrnvugkaqacj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_NWBXXHd7hnrPtQ5iCyFcOA_3yNXa6Il
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-step-2>
NEXT_PUBLIC_API_URL=
```

Redeploy after adding env vars.

**Step 5 — Configure Supabase auth redirect**

In Supabase dashboard → **Authentication → URL Configuration**:
- Add your Vercel domain to **Redirect URLs**: `https://your-app.vercel.app/**`

**Step 6 — Create your demo account**

Visit `https://your-app.vercel.app/auth/login` → sign up with `demo@delhilogistics.com`.

Then create the Company record from the app (or insert directly in Supabase):
```sql
INSERT INTO "Company" (id, "userId", name, "gstNumber", address)
VALUES (gen_random_uuid(), '<your-auth-user-id>', 'Delhi Logistics Co.', '07AABCD1234E1Z5', 'Connaught Place, New Delhi');
```

### Option B — Vercel (web) + Railway (NestJS API)

Use this when you need the full NestJS API (WhatsApp webhooks, complex background jobs, etc.).

Deploy the API to Railway: `railway up --source ./apps/api`

Then set `NEXT_PUBLIC_API_URL=https://your-api.up.railway.app` in Vercel instead of leaving it empty.

### Option C — Docker on a VPS

```bash
# On your server
git clone <repo> manpower && cd manpower

# Copy and edit env files
cp apps/api/.env.example apps/api/.env
# Edit: set DATABASE_URL, SUPABASE_*, RAZORPAY_*, WHATSAPP_*

# Build and start
docker compose up -d --build

# Run migrations inside the container
docker compose exec api npx prisma migrate deploy
docker compose exec api npx ts-node prisma/seed.ts
```

Expose ports via nginx + certbot for TLS.

### Option B — Docker on a VPS

```bash
# On your server
git clone <repo> manpower && cd manpower

# Copy and edit env files
cp apps/api/.env.example apps/api/.env
# Edit: set DATABASE_URL, SUPABASE_*, RAZORPAY_*, WHATSAPP_*

# Build and start
docker compose --profile api up -d --build

# Run migrations inside the container
docker compose exec api npx prisma migrate deploy
docker compose exec api npx ts-node prisma/seed.ts
```

Expose port 3001 (API) and 3000 (web) via nginx + certbot for TLS.

### Expo Worker App — OTA updates via EAS

```bash
cd apps/worker-app
npm install -g eas-cli
eas login
eas build --platform all --profile production
eas submit --platform all
```

For over-the-air updates (JS changes only, no native rebuild):

```bash
eas update --branch production --message "Fix check-in selfie upload"
```

---

## Roadmap

Items are ordered by founder priority: things that close deals first.

| Feature                              | Status          | Notes                                                               |
|--------------------------------------|-----------------|---------------------------------------------------------------------|
| WhatsApp bot — shift accept/decline  | In Progress     | Workers reply "1" to accept, "2" to decline. No app install needed |
| Overbooking auto-dispatch            | In Progress     | API logic complete; cron job wiring in progress                     |
| GST-compliant PDF invoices           | Planned Q3 2025 | Puppeteer/Chromium PDF generation on Railway                        |
| ESIC / PF return automation          | Planned Q3 2025 | Form 6, Form 7, monthly contractor returns auto-generated           |
| Earned Wage Access (daily payout)    | Planned Q3 2025 | Workers withdraw same-day via Razorpay X; customer pays monthly     |
| KYC + police verification            | Planned Q4 2025 | Aadhaar eKYC via DigiLocker + background check API integration      |
| Surge / urgency pricing              | Planned Q4 2025 | Dynamic hourly rate based on fill urgency and shift lead time        |
| Multi-city expansion                 | Planned Q1 2026 | Mumbai, Bengaluru — separate worker pools, city ops managers        |
| Customer ratings for workers         | Planned Q1 2026 | Post-shift thumbs-up/down; feeds into reliability score             |
| Worker skill certification badges    | Planned Q1 2026 | Forklift licence scan + expiry alert                                |
| SLA breach auto-credit               | Planned Q2 2026 | Automatic invoice credit when guaranteed headcount is missed        |

---

## Monorepo Workflow

```bash
# Run all services in dev mode (requires turbo)
npm run dev

# Build all packages
npm run build

# Database operations (from repo root)
npm run db:push       # push schema without migrations (dev only)
npm run db:migrate    # create and apply a new migration
npm run db:seed       # re-seed demo data
npm run db:studio     # open Prisma Studio at http://localhost:5555

# Type-check the shared package
cd packages/shared && npm run typecheck
```

---

## License

Private — all rights reserved. Contact founders@manpower.in for licensing enquiries.
