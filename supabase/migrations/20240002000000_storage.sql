-- Storage bucket for task photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-photos',
  'task-photos',
  true,
  10485760, -- 10MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Drop policies first so re-running migrations is idempotent
drop policy if exists "Task photos are publicly viewable" on storage.objects;
drop policy if exists "Users upload task photos" on storage.objects;
drop policy if exists "Users delete own task photos" on storage.objects;

-- Anyone can view task photos (public bucket)
create policy "Task photos are publicly viewable"
  on storage.objects for select using (bucket_id = 'task-photos');

-- Authenticated users can upload to their own folder
create policy "Users upload task photos"
  on storage.objects for insert with check (
    bucket_id = 'task-photos' and auth.uid() is not null
  );

-- Users can delete their own uploads
create policy "Users delete own task photos"
  on storage.objects for delete using (
    bucket_id = 'task-photos' and auth.uid() is not null
  );
