-- TAFS seed: one school, five students, and one profile for the first auth user (if any).
-- Tulsa school UUID: a0000001-0000-4000-8000-000000000001
-- For the test user to see students: set app_metadata.school_id to this UUID in
--   Supabase Dashboard (Authentication -> Users -> [user] -> App Metadata) and refresh the session.

-- 1. School (fixed UUID for docs and verify-rls)
INSERT INTO public.schools (id, name)
VALUES ('a0000001-0000-4000-8000-000000000001'::uuid, 'Tulsa Area Forest School')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

-- 2. Five students for Tulsa
INSERT INTO public.students (school_id, first_name, last_name, date_of_birth)
VALUES
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'River', 'Green', '2018-03-15'),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'Sage', 'Woods', '2017-07-22'),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'Brooks', 'Stone', '2019-01-10'),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'Willow', 'Brook', '2018-11-05'),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'Ash', 'Fern', '2017-09-30');

-- 3. One profile for the first auth user (if any) who does not yet have a profile
INSERT INTO public.profiles (id, school_id, email, full_name, role)
SELECT sub.id, sub.school_id, sub.email, sub.full_name, sub.role
FROM (
  SELECT
    u.id,
    s.id AS school_id,
    COALESCE(u.email::text, 'test@example.com') AS email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Test User') AS full_name,
    'staff'::text AS role
  FROM auth.users u
  CROSS JOIN (SELECT id FROM public.schools WHERE name = 'Tulsa Area Forest School' LIMIT 1) s
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  ORDER BY u.created_at
  LIMIT 1
) sub
ON CONFLICT (id) DO NOTHING;
