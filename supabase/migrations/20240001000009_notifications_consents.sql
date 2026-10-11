create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text not null,
  data        jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table public.consents (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  purpose     text not null,
  granted     boolean not null,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create table public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles(id),
  action      text not null,
  table_name  text not null,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.consents enable row level security;
alter table public.audit_log enable row level security;

create policy "Users see own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "System inserts notifications"
  on public.notifications for insert with check (false);

create policy "Users see own consents"
  on public.consents for select using (auth.uid() = user_id);

create policy "Users insert own consents"
  on public.consents for insert with check (auth.uid() = user_id);

create policy "Admins see audit log"
  on public.audit_log for select using (
    exists (select 1 from public.profiles where id = auth.uid() and 'admin' = any(roles))
  );

create index notifications_user_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;
