-- M3: RPCs for tasker task counting, rating aggregation, and first_task_at tracking.
-- tasker_profiles table already created in 20240001000002_tasker_profiles.sql.

-- Increment completed_tasks and set first_task_at on first completion
create or replace function increment_completed_tasks(p_profile_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.tasker_profiles
     set completed_tasks = completed_tasks + 1,
         first_task_at   = coalesce(first_task_at, now()),
         updated_at      = now()
   where profile_id = p_profile_id;

  -- Insert row if tasker_profiles row doesn't exist yet
  if not found then
    insert into public.tasker_profiles (profile_id, completed_tasks, first_task_at)
    values (p_profile_id, 1, now())
    on conflict (profile_id) do update
      set completed_tasks = public.tasker_profiles.completed_tasks + 1,
          updated_at = now();
  end if;
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

-- Set first_task_at when task transitions to in_progress (escrow captured)
create or replace function set_first_task_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'in_progress' then
    update public.tasker_profiles tp
       set first_task_at = coalesce(tp.first_task_at, now()),
           updated_at    = now()
      from public.bookings b
     where b.task_id = new.id
       and b.escrow_state = 'held'
       and tp.profile_id = b.tasker_id;
  end if;
  return new;
end;
$$;

create trigger task_in_progress_trigger
  after update of status on public.tasks
  for each row
  when (new.status = 'in_progress' and old.status <> 'in_progress')
  execute procedure set_first_task_at();

-- Auto-update bookings.updated_at on any change
create trigger bookings_updated_at
  before update on public.bookings
  for each row execute procedure moddatetime(updated_at);
