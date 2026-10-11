-- M4: Admin dispute resolution route + action log

-- Add resolution fields to disputes (already has status/resolution/resolved_at from M2)
-- Add resolved_by column
alter table public.disputes
  add column if not exists resolved_by uuid references public.profiles(id),
  add column if not exists admin_notes text;

-- Admin action log for audit trail (DPDP compliance — no PII in admin action itself)
create table public.admin_actions (
  id          uuid primary key default uuid_generate_v4(),
  admin_id    uuid not null references public.profiles(id),
  action      text not null,             -- e.g. 'dispute_resolved', 'kyc_approved', 'user_banned'
  target_type text not null,             -- e.g. 'dispute', 'kyc_request', 'profile'
  target_id   uuid not null,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.admin_actions enable row level security;

-- Admin actions are service-role only (admin panel never exposes these to end users)
create policy "Admin actions: deny all anon"
  on public.admin_actions for all using (false);

-- Function: resolve dispute (refund or release) — called by admin service role
create or replace function admin_resolve_dispute(
  p_dispute_id uuid,
  p_resolution text,
  p_admin_id uuid,
  p_outcome text  -- 'refund' | 'release'
) returns void language plpgsql security definer as $$
declare
  v_booking_id uuid;
  v_task_id uuid;
begin
  select booking_id into v_booking_id from public.disputes where id = p_dispute_id;
  select task_id into v_task_id from public.bookings where id = v_booking_id;

  update public.disputes
     set status = 'resolved', resolution = p_resolution,
         resolved_at = now(), resolved_by = p_admin_id, admin_notes = p_resolution
   where id = p_dispute_id;

  if p_outcome = 'refund' then
    update public.bookings set escrow_state = 'refunded' where id = v_booking_id;
    update public.tasks set status = 'cancelled' where id = v_task_id;
  elsif p_outcome = 'release' then
    update public.bookings set escrow_state = 'released' where id = v_booking_id;
    update public.tasks set status = 'completed' where id = v_task_id;
  end if;

  insert into public.admin_actions (admin_id, action, target_type, target_id, notes)
  values (p_admin_id, 'dispute_resolved', 'dispute', p_dispute_id, p_outcome);
end;
$$;
