alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists banned_reason text;

-- Banned users cannot use the platform: block RLS on tasks
-- (Existing task/offer policies already check poster_id/tasker_id = auth.uid(),
--  but we add a direct check in a new policy)
create or replace function public.is_banned()
returns boolean language sql stable security definer as $$
  select coalesce(
    (select banned from public.profiles where id = auth.uid()),
    false
  );
$$;
