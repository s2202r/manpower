create table public.tasks (
  id                  uuid primary key default uuid_generate_v4(),
  poster_id           uuid not null references public.profiles(id),
  category_id         uuid not null references public.categories(id),
  title               text not null,
  description         text not null,
  photos              text[] not null default '{}',
  task_type           text not null check (task_type in ('in_person','pickup_drop','remote')),
  location            geography(Point, 4326),
  display_area        text,
  pickup_location     geography(Point, 4326),
  dropoff_location    geography(Point, 4326),
  date_from           date,
  date_to             date,
  date_flexibility    text not null default 'exact' check (date_flexibility in ('exact','week','month')),
  budget_paise        bigint not null check (budget_paise > 0),
  visibility_society  boolean not null default false,
  visibility_verified_only boolean not null default false,
  visibility_locale   text,
  status              text not null default 'draft' check (status in (
    'draft','open','assigned','in_progress','tasker_done',
    'completed','paid_out','cancelled','disputed','expired'
  )),
  offer_count         integer not null default 0,
  assigned_tasker_id  uuid references public.profiles(id),
  widened_reach       boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.tasks enable row level security;

-- Posters can see their own tasks always
create policy "Posters see own tasks"
  on public.tasks for select using (auth.uid() = poster_id);

-- Taskers see open tasks near their work zones (or all remote tasks)
create policy "Taskers see open nearby tasks"
  on public.tasks for select using (
    status = 'open' and (
      task_type = 'remote'
      or exists (
        select 1 from public.work_zones wz
        where wz.tasker_id = auth.uid()
        and ST_DWithin(
          tasks.location,
          wz.centre,
          wz.radius_km * 1000
        )
      )
    )
  );

-- Assigned tasker sees their task
create policy "Assigned tasker sees their task"
  on public.tasks for select using (auth.uid() = assigned_tasker_id);

create policy "Poster can insert tasks"
  on public.tasks for insert with check (auth.uid() = poster_id);

create policy "Poster can update own tasks"
  on public.tasks for update using (auth.uid() = poster_id);

create index tasks_location_idx on public.tasks using gist(location);
create index tasks_pickup_location_idx on public.tasks using gist(pickup_location);
create index tasks_status_idx on public.tasks(status);
create index tasks_poster_idx on public.tasks(poster_id);
create index tasks_category_idx on public.tasks(category_id);
