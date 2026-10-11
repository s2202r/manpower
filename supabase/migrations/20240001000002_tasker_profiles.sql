create table public.tasker_profiles (
  id                  uuid primary key default uuid_generate_v4(),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  bio                 text,
  category_ids        uuid[] not null default '{}',
  languages_spoken    text[] not null default '{}',
  remote_enabled      boolean not null default false,
  kyc_status          text not null default 'none' check (kyc_status in ('none','pending','verified','rejected')),
  kyc_provider_ref    text,
  payout_account_ref  text,
  pro_until           timestamptz,
  first_task_at       timestamptz,
  completed_tasks     integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique(profile_id)
);

alter table public.tasker_profiles enable row level security;

create policy "Tasker profiles are publicly viewable"
  on public.tasker_profiles for select using (true);

create policy "Users manage own tasker profile"
  on public.tasker_profiles for all using (
    auth.uid() = profile_id
  );
