# Taim

India-first task marketplace. Post any task, get offers from verified Taskers nearby.

**Tagline:** Taim nahi hai? Taim pe daal do.

## Monorepo structure

```
apps/
  web/      # Next.js web app (taim.space)
  admin/    # Next.js admin panel (admin.taim.space)
  mobile/   # Expo mobile app (Android + iOS)
packages/
  config/   # Shared constants (APP_NAME, fee rates)
  core/     # Zod schemas, state machine, fee calc
  db/       # Supabase migrations and seed data
  i18n/     # 12 locale translation files
  ui/       # Shared UI components (M2)
```

## Local setup

### Prerequisites
- Node.js 22+
- pnpm 10+
- Docker (for Supabase local dev)
- Supabase CLI

### Steps

1. Clone the repo
```bash
git clone https://github.com/s2202r/manpower taim
cd taim
```

2. Install dependencies
```bash
pnpm install
```

3. Copy environment variables
```bash
cp .env.example apps/web/.env.local
cp .env.example apps/admin/.env.local
```

4. Start Supabase locally
```bash
cd packages/db
npx supabase start
```
This prints your local `SUPABASE_URL` and `ANON_KEY` — paste them into `.env.local`.

5. Run migrations and seed
```bash
npx supabase db reset
```

6. Start the web app
```bash
pnpm dev --filter=@taim/web
```

Open [http://localhost:3000](http://localhost:3000).

### Run tests
```bash
pnpm test
```

## Deployment

### Web & Admin (Vercel)
- Import `apps/web` and `apps/admin` as separate Vercel projects
- Set the root directory to `apps/web` (or `apps/admin`)
- Set environment variables from `.env.example`

### Mobile (EAS Build)
```bash
cd apps/mobile
eas build --platform android --profile preview
```

## Auth
Email + password, or email magic link (OTP). No phone number required.

## Languages
12 locales: en, hi, bn, mr, te, ta, gu, ur, kn, or, ml, pa. Urdu uses RTL layout.

## Milestones
- **M1** (current): Foundation — monorepo, auth, home screen, DB schema, core logic ✅
- **M2**: Post task, browse feed, offers, Realtime chat
- **M3**: Payments (Razorpay + Cashfree), escrow, payouts
- **M4**: KYC, push notifications, admin panel
- **M5**: AI features, Pro subscription, SEO
