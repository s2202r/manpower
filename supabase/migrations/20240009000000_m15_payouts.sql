-- Payout tracking
drop table if exists public.payouts cascade;

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade unique,
  tasker_id uuid not null references public.profiles(id),
  amount_paise bigint not null check (amount_paise > 0),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  provider_ref text,
  initiated_by uuid references public.profiles(id),
  initiated_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.payouts enable row level security;

-- Tasker can view their own payouts
create policy "payouts: tasker view" on public.payouts for select
  using (tasker_id = auth.uid());
-- Admin updates via service role (no RLS needed for service role)

-- Index for payout queue
create index if not exists idx_payouts_status on public.payouts(status);
create index if not exists idx_payouts_tasker on public.payouts(tasker_id);
