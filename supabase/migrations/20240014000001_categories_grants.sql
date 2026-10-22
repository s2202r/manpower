-- Grant table-level permissions so RLS policies can take effect
-- (hosted Supabase may not auto-apply these for tables created in migrations)
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
