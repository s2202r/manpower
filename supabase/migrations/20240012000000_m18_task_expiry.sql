-- Allow 'expired' as a valid task status
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('draft', 'open', 'assigned', 'in_progress', 'tasker_done', 'completed', 'paid_out', 'expired'));
