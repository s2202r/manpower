create table public.bookings (
  id                    uuid primary key default uuid_generate_v4(),
  task_id               uuid not null references public.tasks(id),
  offer_id              uuid not null references public.offers(id),
  poster_id             uuid not null references public.profiles(id),
  tasker_id             uuid not null references public.profiles(id),
  amount_paise          bigint not null,
  poster_fee_paise      bigint not null,
  tasker_fee_paise      bigint not null,
  gst_poster_paise      bigint not null,
  gst_tasker_paise      bigint not null,
  tasker_payout_paise   bigint not null,
  payment_provider      text not null check (payment_provider in ('razorpay','cashfree')),
  payment_order_id      text,
  payment_id            text,
  escrow_state          text not null default 'pending' check (escrow_state in ('pending','held','released','refunded')),
  completion_otp_hash   text,
  completed_at          timestamptz,
  auto_release_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.webhook_events (
  id              uuid primary key default uuid_generate_v4(),
  provider        text not null,
  idempotency_key text unique not null,
  event_type      text not null,
  payload         jsonb not null,
  processed_at    timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);

create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid not null references public.bookings(id),
  reviewer_id uuid not null references public.profiles(id),
  reviewee_id uuid not null references public.profiles(id),
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique(booking_id, reviewer_id)
);

create table public.disputes (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid not null references public.bookings(id),
  raised_by   uuid not null references public.profiles(id),
  reason      text not null,
  evidence    text[],
  status      text not null default 'open' check (status in ('open','investigating','resolved')),
  resolution  text,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.webhook_events enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;

create policy "Booking parties can view"
  on public.bookings for select using (
    auth.uid() = poster_id or auth.uid() = tasker_id
  );

create policy "System inserts bookings"
  on public.bookings for insert with check (auth.uid() = poster_id);

create policy "Webhook events are service-role only"
  on public.webhook_events for all using (false);

create policy "Reviews are publicly viewable"
  on public.reviews for select using (true);

create policy "Reviewer creates review after booking"
  on public.reviews for insert with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and (b.poster_id = auth.uid() or b.tasker_id = auth.uid())
      and b.escrow_state = 'released'
    )
  );

create policy "Dispute parties can view"
  on public.disputes for select using (
    auth.uid() = raised_by
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id and (b.poster_id = auth.uid() or b.tasker_id = auth.uid())
    )
  );

create index bookings_task_idx on public.bookings(task_id);
create index bookings_auto_release_idx on public.bookings(auto_release_at) where escrow_state = 'held';
