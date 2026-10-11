create table public.conversations (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  poster_id   uuid not null references public.profiles(id),
  tasker_id   uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique(task_id, poster_id, tasker_id)
);

create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id),
  body            text not null,
  masked_body     text,
  created_at      timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Conversation participants can view"
  on public.conversations for select using (
    auth.uid() = poster_id or auth.uid() = tasker_id
  );

create policy "Conversation participants create"
  on public.conversations for insert with check (
    auth.uid() = poster_id or auth.uid() = tasker_id
  );

create policy "Message participants can view"
  on public.messages for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.poster_id = auth.uid() or c.tasker_id = auth.uid())
    )
  );

create policy "Participants send messages"
  on public.messages for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.poster_id = auth.uid() or c.tasker_id = auth.uid())
    )
  );

create index messages_conv_idx on public.messages(conversation_id, created_at);
