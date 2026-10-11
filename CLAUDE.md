# Taim — Claude Code Reference

India-first task marketplace. Posters post tasks, verified Taskers send offers, escrow payment, release on completion.

## Monorepo layout

```
apps/web      Next.js 15 App Router — main marketplace (port 3000)
apps/admin    Next.js 15 App Router — internal admin panel (port 3001)
apps/mobile   Expo ~52 + Expo Router ~4 — Android + iOS app
packages/core  Deterministic TypeScript: fees, task state machine, payment provider interfaces
packages/db    Supabase type helpers (auto-generated)
packages/i18n  12 locales: en hi bn mr te ta gu ur kn or ml pa
packages/config Shared constants (APP_NAME, brand, etc.)
supabase/      migrations/, functions/, seed.sql
```

## Critical engineering rules (never bypass)

1. **Money in paise, integer only.** All fee math lives in `packages/core/src/fees.ts`. Use `applyRateCeil(amount, numer, denom)`. Never float. Never compute fees on the client or in mobile.
2. **Payment state from webhooks only.** `escrow_state=held` is set only by the verified Razorpay/Cashfree webhook handler — never by the create-order route.
3. **Secrets server-side only.** Mobile and web clients use only the Supabase anon key. Service role key is only in `apps/admin/lib/supabase.ts` and `apps/web/app/api/` route handlers.
4. **AI output shown to user before going live.** Any AI-generated task title/description must be confirmed by the user. Log every AI call.
5. **DPDP compliance.** Consent captured with purpose + timestamp in `consent_log`. Export: `GET /api/profile/export`. Delete: `POST /api/profile/delete` (anonymises, blocks on held escrow).
6. **i18n everything.** No hard-coded user-facing strings. All copy goes through `@taim/i18n`.

## Key files

| File | What it does |
|------|-------------|
| `packages/core/src/fees.ts` | Fee calculation — edit only with tests |
| `packages/core/src/task-state-machine.ts` | Valid task state transitions |
| `packages/core/src/payment-provider.ts` | PaymentProvider interface |
| `apps/web/app/api/webhooks/razorpay/route.ts` | Payment capture webhook |
| `apps/web/app/api/bookings/[id]/confirm/route.ts` | OTP verify + release escrow |
| `apps/admin/lib/require-admin.ts` | Admin auth gate |
| `apps/mobile/lib/supabase.ts` | Singleton Supabase client (anon key + AsyncStorage) |
| `apps/mobile/lib/auth.tsx` | AuthContext / useAuth |
| `supabase/migrations/` | All schema changes — append only, never edit existing |

## Auth

Email + password OR email magic link. **No phone OTP — removed by design.**

Web/admin: Supabase SSR (`@supabase/ssr`), cookie-based session.
Mobile: `@supabase/supabase-js` with `AsyncStorage` persistence.

## Payment flow

1. Poster accepts offer → `POST /api/payments/create-order` → returns provider order id + public key
2. Client opens Razorpay/Cashfree checkout
3. Webhook fires → `escrow_state=held`, task=`in_progress`
4. Tasker marks done → `POST /api/bookings/[id]/done` → SHA-256 OTP hash stored
5. Poster enters OTP → `POST /api/bookings/[id]/confirm` → verifies hash, calls `releaseToTasker()`, task=`completed`

## Fee structure

| Party | Rate | Minimum |
|-------|------|---------|
| Poster fee | 5% | ₹19 |
| Tasker fee | 10% (tier 0), 7% (tier 1), 0% (tier 2) | — |
| GST on fees | 18% | — |

## Running locally

```bash
pnpm install
# Web
pnpm --filter @taim/web dev          # http://localhost:3000
# Admin
pnpm --filter @taim/admin dev        # http://localhost:3001
# Mobile
pnpm --filter @taim/mobile start     # Expo Go / simulator
# Tests
pnpm --filter @taim/core test
```

Copy `.env.example` → `.env.local` in each app and fill in real values.

## Database

Supabase + PostGIS. RLS on every table. Never bypass RLS with anon key.
Service role key only in server-side code.

Migrations: append-only files in `supabase/migrations/`. Run with `supabase db push`.
Edge Functions: `supabase/functions/`. Deploy with `supabase functions deploy <name>`.

## Mobile

Expo SDK 52, Expo Router 4, React Native 0.76. StyleSheet only (no NativeWind).
Push notifications via `expo-notifications` + `send-push-notification` Edge Function.
EAS builds: `apps/mobile/eas.json`. Set `projectId` in `app.json` extra.eas before first build.

## Branch

All work: `claude/warehouse-staffing-mvp-h6udlj`
