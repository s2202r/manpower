-- Disputes
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  raised_by uuid not null references public.profiles(id),
  reason text not null check (char_length(reason) between 10 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved_poster', 'resolved_tasker', 'resolved_refund')),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  unique (booking_id)
);

alter table public.disputes enable row level security;

-- Poster and tasker on the booking can see the dispute
create policy "disputes: parties can view"
  on public.disputes for select
  using (
    raised_by = auth.uid()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.poster_id = auth.uid() or b.tasker_id = auth.uid())
    )
  );

-- Only poster can raise a dispute
create policy "disputes: poster can insert"
  on public.disputes for insert
  with check (raised_by = auth.uid());

-- Only via service role (admin) can update
create policy "disputes: admin update"
  on public.disputes for update
  using (false);
