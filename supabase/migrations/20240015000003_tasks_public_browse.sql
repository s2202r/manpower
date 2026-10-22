-- Make open tasks publicly browsable (no login required).
-- Previous policy required auth.uid() is not null, so anonymous visitors and
-- any user whose session wasn't read from cookies saw no tasks at all.

drop policy if exists "Authenticated users can browse open tasks" on public.tasks;

create policy "Open tasks are publicly viewable"
  on public.tasks for select using (status = 'open');
