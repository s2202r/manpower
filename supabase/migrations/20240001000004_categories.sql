create table public.categories (
  id            uuid primary key default uuid_generate_v4(),
  parent_id     uuid references public.categories(id),
  slug          text unique not null,
  names         jsonb not null default '{}',
  icon          text,
  allowed_types text[] not null default '{in_person,pickup_drop,remote}',
  needs_licence boolean not null default false,
  involves_minors boolean not null default false,
  home_entry    boolean not null default false,
  is_live       boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories are publicly viewable"
  on public.categories for select using (true);

create policy "Only admins can manage categories"
  on public.categories for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and 'admin' = any(roles)
    )
  );
