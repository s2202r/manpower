-- Grant table-level permissions so RLS policies can take effect for all core tables.
-- Supabase hosted projects may not auto-apply these when tables are created in migrations.
-- anon  → select only on public tables; authenticated → full CRUD (RLS still applies)

grant select on public.work_zones       to anon, authenticated;
grant insert, update, delete on public.work_zones to authenticated;

grant select on public.tasker_profiles  to anon, authenticated;
grant insert, update, delete on public.tasker_profiles to authenticated;

grant select on public.tasks            to anon, authenticated;
grant insert, update, delete on public.tasks to authenticated;

grant select on public.offers           to anon, authenticated;
grant insert, update, delete on public.offers to authenticated;

grant select on public.conversations    to anon, authenticated;
grant insert, update, delete on public.conversations to authenticated;

grant select on public.messages         to anon, authenticated;
grant insert, update, delete on public.messages to authenticated;

grant select on public.bookings         to anon, authenticated;
grant insert, update, delete on public.bookings to authenticated;

grant select on public.reviews          to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

grant select on public.disputes         to anon, authenticated;
grant insert, update, delete on public.disputes to authenticated;
