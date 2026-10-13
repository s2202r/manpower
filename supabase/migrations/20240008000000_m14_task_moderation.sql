-- Task moderation: add suspended status and moderation fields
alter table public.tasks add column if not exists moderation_status text not null default 'ok'
  check (moderation_status in ('ok', 'suspended'));
alter table public.tasks add column if not exists moderation_note text;
alter table public.tasks add column if not exists moderated_at timestamptz;
alter table public.tasks add column if not exists moderated_by uuid references public.profiles(id);

-- Index for filtering suspended tasks
create index if not exists idx_tasks_moderation on public.tasks(moderation_status);
