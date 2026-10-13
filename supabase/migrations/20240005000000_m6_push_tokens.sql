-- Push notification device tokens
drop table if exists public.push_tokens cascade;

create table public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token       text not null,
  platform    text not null check (platform in ('ios','android','web')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

-- Users can manage their own tokens only
create policy "push_tokens: own rows" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger push_tokens_updated_at
  before update on public.push_tokens
  for each row execute procedure moddatetime(updated_at);
