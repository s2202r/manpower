-- Seed categories
insert into public.categories (slug, names, icon, allowed_types, is_live, sort_order) values
('shifting-lifting', '{"en":"Shifting & lifting","hi":"सामान उठाना-रखना"}', '📦', '{in_person}', true, 10),
('assembly-mounting', '{"en":"Assembly & mounting","hi":"असेंबली और माउंटिंग"}', '🔧', '{in_person}', true, 20),
('small-fixes', '{"en":"Small fixes","hi":"छोटी-मोटी मरम्मत"}', '🪛', '{in_person}', true, 30),
('cleaning', '{"en":"One-off cleaning","hi":"सफ़ाई"}', '🧹', '{in_person}', true, 40),
('errands-delivery', '{"en":"Errands & delivery","hi":"काम-काज और डिलीवरी"}', '🛵', '{pickup_drop}', true, 50),
('queue-paperwork', '{"en":"Queue & paperwork help","hi":"लाइन और कागज़ का काम"}', '📋', '{in_person}', true, 60),
('event-help', '{"en":"Event & party help","hi":"इवेंट और पार्टी"}', '🎉', '{in_person}', true, 70),
('puja-festival', '{"en":"Puja & festival help","hi":"पूजा और त्योहार"}', '🪔', '{in_person}', true, 80),
('home-tech', '{"en":"Home tech help","hi":"घर में टेक मदद"}', '📱', '{in_person}', true, 90),
('elder-family', '{"en":"Elder & family help","hi":"बुज़ुर्ग और परिवार की मदद"}', '👵', '{in_person}', true, 100),
('pet-care', '{"en":"Pet care","hi":"पालतू जानवर की देखभाल"}', '🐾', '{in_person}', true, 110),
('design-social', '{"en":"Design & social media","hi":"डिज़ाइन और सोशल मीडिया"}', '🎨', '{remote}', true, 120),
('admin-data', '{"en":"Admin & data","hi":"डेटा एंट्री और एडमिन"}', '💻', '{remote}', true, 130),
('writing-translation', '{"en":"Writing & translation","hi":"लेखन और अनुवाद"}', '✍️', '{remote}', true, 140),
('anything-else', '{"en":"Anything else","hi":"कुछ और"}', '⭐', '{in_person,pickup_drop,remote}', true, 150),
-- Coming soon
('gardening', '{"en":"Gardening & plants","hi":"बागबानी और पौधे"}', '🌱', '{in_person}', false, 200),
('cooking', '{"en":"Cooking help","hi":"खाना पकाने में मदद"}', '🍳', '{in_person}', false, 210),
('vehicle', '{"en":"Vehicle help","hi":"वाहन मदद"}', '🚗', '{in_person}', false, 220),
('photography', '{"en":"Photography & video","hi":"फ़ोटोग्राफी और वीडियो"}', '📷', '{in_person,remote}', false, 230),
('tutoring', '{"en":"Tutoring & skills","hi":"ट्यूटरिंग"}', '📚', '{in_person,remote}', false, 240),
('business-onsite', '{"en":"Business on-site help","hi":"बिज़नेस साइट पर मदद"}', '🏢', '{in_person}', false, 250),
('licensed-repairs', '{"en":"Licensed repairs","hi":"लाइसेंसी मरम्मत"}', '⚡', '{in_person}', false, 260)
on conflict (slug) do nothing;

-- Demo users (passwords handled by Supabase Auth in local dev)
-- These UUIDs are fixed for seed reproducibility
insert into public.profiles (id, email, name, preferred_locale, roles, verification_tier) values
('00000000-0000-0000-0000-000000000001', 'demo.poster@taim.space', 'Priya Sharma', 'hi', '{poster}', 'email'),
('00000000-0000-0000-0000-000000000002', 'demo.tasker@taim.space', 'Ravi Kumar', 'hi', '{tasker}', 'email'),
('00000000-0000-0000-0000-000000000003', 'admin@taim.space', 'Admin User', 'en', '{poster,tasker,admin}', 'kyc')
on conflict (id) do nothing;

-- Demo tasker profile
insert into public.tasker_profiles (profile_id, bio, remote_enabled, completed_tasks) values
('00000000-0000-0000-0000-000000000002', 'Experienced handyman in Noida. Available weekdays.', false, 5)
on conflict (profile_id) do nothing;

-- Demo tasks in Greater Noida / Noida
insert into public.tasks (poster_id, category_id, title, description, task_type, location, display_area, budget_paise, status)
select
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Help moving furniture to new flat',
  'Need 2-3 people to help move furniture from my 2BHK in Sector 62 to a new flat in Sector 137, Noida. Approximately 15-20 boxes and medium furniture.',
  'in_person',
  ST_GeographyFromText('SRID=4326;POINT(77.3704 28.6139)'),
  'Sector 62, Noida',
  250000,
  'open'
from public.categories c where c.slug = 'shifting-lifting'
limit 1;

insert into public.tasks (poster_id, category_id, title, description, task_type, location, display_area, budget_paise, status)
select
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Assemble IKEA wardrobe',
  'Need help assembling a PAX wardrobe (3 sections) and mounting a TV unit. All tools provided.',
  'in_person',
  ST_GeographyFromText('SRID=4326;POINT(77.3741 28.5945)'),
  'Sector 137, Noida',
  80000,
  'open'
from public.categories c where c.slug = 'assembly-mounting'
limit 1;
