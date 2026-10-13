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

-- Demo users require auth.users rows which only exist in local dev.
-- Create test accounts manually via the Supabase dashboard for hosted projects.
