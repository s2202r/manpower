-- Allow any authenticated user to browse open tasks.
-- The previous policy only showed tasks to taskers within a work zone,
-- and ST_DWithin(null, ...) evaluates to false for tasks with no location,
-- making newly-posted tasks invisible to everyone except the poster.

drop policy if exists "Taskers see open nearby tasks" on public.tasks;

-- Authenticated users can browse all open tasks
create policy "Authenticated users can browse open tasks"
  on public.tasks for select using (
    auth.uid() is not null and status = 'open'
  );
