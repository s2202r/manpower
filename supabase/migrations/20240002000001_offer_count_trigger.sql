-- Keep tasks.offer_count in sync automatically
create or replace function update_offer_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.tasks set offer_count = offer_count + 1 where id = new.task_id;
  elsif TG_OP = 'DELETE' then
    update public.tasks set offer_count = offer_count - 1 where id = old.task_id;
  end if;
  return null;
end;
$$;

create trigger offers_count_trigger
  after insert or delete on public.offers
  for each row execute procedure update_offer_count();

-- Auto-release bookings 48h after tasker marks done (pg_cron job)
select cron.schedule(
  'auto-release-bookings',
  '*/15 * * * *', -- every 15 minutes
  $$
    update public.bookings
    set escrow_state = 'released'
    where escrow_state = 'held'
      and auto_release_at <= now();

    update public.tasks t
    set status = 'paid_out'
    from public.bookings b
    where b.task_id = t.id
      and b.escrow_state = 'released'
      and t.status = 'completed';
  $$
);

-- Expire tasks with no offers after 7 days
select cron.schedule(
  'expire-stale-tasks',
  '0 2 * * *', -- daily at 2am
  $$
    update public.tasks
    set status = 'expired'
    where status = 'open'
      and offer_count = 0
      and created_at < now() - interval '7 days';
  $$
);
