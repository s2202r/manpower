create table public.offers (
  id            uuid primary key default uuid_generate_v4(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  tasker_id     uuid not null references public.profiles(id),
  amount_paise  bigint not null check (amount_paise > 0),
  message       text,
  status        text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(task_id, tasker_id)
);

alter table public.offers enable row level security;

create policy "Posters see offers on their tasks"
  on public.offers for select using (
    exists (select 1 from public.tasks where id = task_id and poster_id = auth.uid())
  );

create policy "Taskers see own offers"
  on public.offers for select using (auth.uid() = tasker_id);

create policy "Taskers create offers"
  on public.offers for insert with check (auth.uid() = tasker_id);

create policy "Taskers update own offers"
  on public.offers for update using (auth.uid() = tasker_id);

create index offers_task_idx on public.offers(task_id);
create index offers_tasker_idx on public.offers(tasker_id);
