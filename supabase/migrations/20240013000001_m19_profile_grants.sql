-- Ensure anon and authenticated roles have the table-level grants needed for RLS
-- (hosted Supabase may not have auto-applied these if the table was recreated)
grant select, insert, update on public.profiles to anon, authenticated;
