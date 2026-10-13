-- Full-text search index on tasks

alter table public.categories add column if not exists slug text unique;

alter table public.tasks
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector('simple',
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(display_area, '')
      )
    ) stored;

create index if not exists tasks_search_gin on public.tasks using gin(search_vector);

insert into public.categories (id, names, icon, slug) values
  (gen_random_uuid(), '{"en":"Home Repairs","hi":"घर की मरम्मत"}', '🔧', 'home-repairs'),
  (gen_random_uuid(), '{"en":"Cleaning","hi":"सफाई"}', '🧹', 'cleaning'),
  (gen_random_uuid(), '{"en":"Delivery","hi":"डिलीवरी"}', '🛵', 'delivery'),
  (gen_random_uuid(), '{"en":"Tech Help","hi":"टेक सहायता"}', '💻', 'tech-help'),
  (gen_random_uuid(), '{"en":"Design","hi":"डिज़ाइन"}', '🎨', 'design'),
  (gen_random_uuid(), '{"en":"Moving","hi":"शिफ्टिंग"}', '📦', 'moving'),
  (gen_random_uuid(), '{"en":"Gardening","hi":"बागवानी"}', '🌿', 'gardening'),
  (gen_random_uuid(), '{"en":"Photography","hi":"फोटोग्राफी"}', '📸', 'photography'),
  (gen_random_uuid(), '{"en":"Childcare","hi":"बाल देखभाल"}', '👶', 'childcare'),
  (gen_random_uuid(), '{"en":"Pet Care","hi":"पालतू देखभाल"}', '🐾', 'pet-care')
on conflict (slug) do nothing;
