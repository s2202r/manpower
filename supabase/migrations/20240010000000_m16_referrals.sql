-- Referral codes: each user gets one on profile creation
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);
alter table public.profiles add column if not exists referral_count int not null default 0;

-- Auto-generate referral code on new profile insert
create or replace function public.generate_referral_code()
returns trigger language plpgsql as $$
begin
  new.referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  return new;
end;
$$;

drop trigger if exists trg_referral_code on public.profiles;
create trigger trg_referral_code
  before insert on public.profiles
  for each row
  when (new.referral_code is null)
  execute function public.generate_referral_code();

-- Backfill existing profiles that have no code
update public.profiles
set referral_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where referral_code is null;

-- Referral events log
create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id),
  referred_id uuid not null references public.profiles(id) unique,
  created_at timestamptz not null default now()
);
alter table public.referral_events enable row level security;
create policy "referral_events: user view own" on public.referral_events for select
  using (referrer_id = auth.uid() or referred_id = auth.uid());
