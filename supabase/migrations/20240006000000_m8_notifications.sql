drop table if exists public.notifications cascade;

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,  -- 'new_offer' | 'offer_accepted' | 'task_assigned' | 'payment_held' | 'task_done' | 'payment_released' | 'new_message' | 'review_received'
  title       text not null,
  body        text not null,
  link        text,           -- relative URL to navigate to
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_unread on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: own rows"
  on public.notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
