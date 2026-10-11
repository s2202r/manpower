-- M3: tasker profiles, payout account storage, and aggregate rating RPCs

-- Tasker profile extension (completed task count, payout account ref, first task date)
create table public.tasker_profiles (
  profile_id          uuid primary key references public.profiles(id),
  completed_tasks     integer not null default 0,
  first_task_at       timestamptz,          -- set on first booking, used for free-period fee calc
  payout_account_ref  text,                 -- provider-stored payout account reference (not raw bank details)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.tasker_profiles enable row level security;

create policy "Tasker can view their own profile"
  on public.tasker_profiles for select using (auth.uid() = profile_id);

create policy "Tasker can insert their own profile"
  on public.tasker_profiles for insert with check (auth.uid() = profile_id);

create policy "Tasker can update their own profile"
  on public.tasker_profiles for update using (auth.uid() = profile_id);

-- Auto-create tasker_profile row when a booking is completed for a new tasker
create or replace function increment_completed_tasks(p_profile_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.tasker_profiles (profile_id, completed_tasks, first_task_at)
  values (p_profile_id, 1, now())
  on conflict (profile_id) do update
    set completed_tasks = public.tasker_profiles.completed_tasks + 1,
        updated_at = now();
end;
$$;

-- Recompute aggregate rating on profiles after a new review
create or replace function update_rating_aggregate(p_profile_id uuid)
returns void language plpgsql security definer as $$
declare
  v_avg  numeric;
  v_cnt  integer;
begin
  select round(avg(rating)::numeric, 2), count(*)
    into v_avg, v_cnt
    from public.reviews
   where reviewee_id = p_profile_id;

  update public.profiles
     set rating_avg   = v_avg,
         rating_count = v_cnt
   where id = p_profile_id;
end;
$$;

-- Set first_task_at on tasker_profile when they get their first accepted offer
create or replace function set_first_task_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'in_progress' then
    insert into public.tasker_profiles (profile_id, first_task_at)
    select b.tasker_id, now()
      from public.bookings b
     where b.task_id = new.id
       and b.escrow_state = 'held'
    on conflict (profile_id) do update
      set first_task_at = coalesce(public.tasker_profiles.first_task_at, excluded.first_task_at),
          updated_at = now();
  end if;
  return new;
end;
$$;

create trigger task_in_progress_trigger
  after update of status on public.tasks
  for each row
  when (new.status = 'in_progress' and old.status <> 'in_progress')
  execute procedure set_first_task_at();

-- Update bookings.updated_at on any change
create trigger bookings_updated_at
  before update on public.bookings
  for each row execute procedure moddatetime(updated_at);
