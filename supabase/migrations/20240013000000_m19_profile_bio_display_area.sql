-- Add bio and display_area to profiles so all app code can query them in one table
alter table public.profiles
  add column if not exists bio          text,
  add column if not exists display_area text;
