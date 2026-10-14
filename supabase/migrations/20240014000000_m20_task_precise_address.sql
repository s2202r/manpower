-- Precise address shown to the assigned tasker for navigation (optional)
alter table public.tasks
  add column if not exists precise_address text;
