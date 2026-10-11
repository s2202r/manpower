create table public.work_zones (
  id          uuid primary key default uuid_generate_v4(),
  tasker_id   uuid not null references public.profiles(id) on delete cascade,
  label       text not null,
  centre      geography(Point, 4326) not null,
  radius_km   integer not null check (radius_km in (2, 5, 10, 15, 25)),
  created_at  timestamptz not null default now()
);

alter table public.work_zones enable row level security;

create policy "Work zones are publicly viewable"
  on public.work_zones for select using (true);

create policy "Taskers manage own work zones"
  on public.work_zones for all using (auth.uid() = tasker_id);

-- Max 3 work zones per tasker
create or replace function check_work_zone_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.work_zones where tasker_id = new.tasker_id) >= 3 then
    raise exception 'Maximum 3 work zones per tasker';
  end if;
  return new;
end;
$$;

create trigger enforce_work_zone_limit
  before insert on public.work_zones
  for each row execute procedure check_work_zone_limit();

create index work_zones_centre_idx on public.work_zones using gist(centre);
create index work_zones_tasker_idx on public.work_zones(tasker_id);
