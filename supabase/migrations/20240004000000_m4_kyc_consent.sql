-- M4: KYC requests, consent log, admin API key storage

-- KYC requests
create table public.kyc_requests (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id),
  document_type   text not null check (document_type in ('aadhaar','pan','voter_id','passport','driving_licence')),
  document_path   text not null,   -- storage path in private kyc-docs bucket
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  consent_given_at  timestamptz not null,
  consent_purpose   text not null default 'kyc_identity_verification',
  submitted_at    timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewer_id     uuid references public.profiles(id),
  rejection_reason  text,
  created_at      timestamptz not null default now()
);

create index kyc_requests_user_idx on public.kyc_requests(user_id);
create index kyc_requests_status_idx on public.kyc_requests(status);

alter table public.kyc_requests enable row level security;

-- User can see their own KYC requests
create policy "User sees own kyc requests"
  on public.kyc_requests for select using (auth.uid() = user_id);

-- Only the user can insert (server validates, uses service role for final write)
create policy "User submits kyc"
  on public.kyc_requests for insert with check (auth.uid() = user_id);

-- Admin can update (approve/reject) — handled by admin service-role client
-- No anon/user update policy needed; admin panel uses service role directly

-- DPDP consent log: immutable append-only log of all consent events
create table public.consent_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id),
  purpose     text not null,          -- e.g. 'kyc_identity_verification', 'marketing', 'account_deletion'
  given_at    timestamptz not null default now(),
  withdrawn_at  timestamptz,
  ip_country  text,                   -- ISO 3166-1 alpha-2, sourced from Cloudflare header
  created_at  timestamptz not null default now()
);

create index consent_log_user_idx on public.consent_log(user_id);

alter table public.consent_log enable row level security;

create policy "User sees own consent log"
  on public.consent_log for select using (auth.uid() = user_id);

create policy "User inserts consent"
  on public.consent_log for insert with check (auth.uid() = user_id);

-- Private storage bucket for KYC documents (no public access)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-docs',
  'kyc-docs',
  false,
  5242880,  -- 5MB
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- Only the owning user can upload their own KYC document
create policy "User uploads own kyc doc"
  on storage.objects for insert
  with check (
    bucket_id = 'kyc-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only the owning user (or admin via service role) can read
create policy "User reads own kyc doc"
  on storage.objects for select
  using (
    bucket_id = 'kyc-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function: approve KYC request and upgrade user tier (called by admin service role)
create or replace function admin_approve_kyc(p_request_id uuid, p_reviewer_id uuid)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from public.kyc_requests where id = p_request_id;
  if not found then raise exception 'KYC request not found'; end if;

  update public.kyc_requests
     set status = 'approved', reviewed_at = now(), reviewer_id = p_reviewer_id
   where id = p_request_id;

  update public.profiles
     set verification_tier = 'kyc'
   where id = v_user_id;
end;
$$;

-- Function: reject KYC request
create or replace function admin_reject_kyc(p_request_id uuid, p_reviewer_id uuid, p_reason text)
returns void language plpgsql security definer as $$
begin
  update public.kyc_requests
     set status = 'rejected', reviewed_at = now(), reviewer_id = p_reviewer_id, rejection_reason = p_reason
   where id = p_request_id;
end;
$$;
