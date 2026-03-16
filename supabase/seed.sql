-- TAFS seed: one school, five students, master waiver, and core test users.
-- Tulsa school UUID: a0000001-0000-4000-8000-000000000001
-- For a test user to see students: app_metadata.school_id must be this UUID in
--   Supabase Dashboard (Authentication -> Users -> [user] -> App Metadata) or in raw_app_meta_data here, then refresh the session.

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

-- 4. Master waiver for Tulsa (current active waiver)
INSERT INTO public.waivers (
  school_id,
  title,
  body_md,
  version,
  is_active,
  effective_from,
  created_by
)
VALUES (
  'a0000001-0000-4000-8000-000000000001'::uuid,
  'TAFS-2026-V1: Liability, Risk, and Forest Safety',
  $markdown$
# Tulsa Area Forest School – Liability, Risk, and Forest Safety

**Please read this waiver carefully before your child participates in any forest school activity.**

## 1. Assumption of Risk

By signing this waiver, I acknowledge and agree that:

- Forest programs take place in **natural outdoor environments** with uneven terrain, mud, roots, rocks, insects, and changing weather.
- My child may engage in activities such as **climbing**, **running**, **using simple tools** (e.g., sticks, ropes), and **exploring near water** under supervision.
- These activities inherently involve **risks of minor and serious injury**, including but not limited to cuts, scrapes, sprains, insect bites, sunburn, and slips or falls.

I **voluntarily accept and assume all such risks** on behalf of my child.

## 2. Safety Practices

I understand that Tulsa Area Forest School will:

- Maintain **reasonable adult supervision** at all times during program hours.
- Provide **age-appropriate safety guidance** and clear boundaries for play.
- Adjust or pause activities in response to **severe weather** or unsafe conditions.
- Maintain **basic first-aid supplies** and communicate any notable incidents.

I acknowledge that no program can remove **all risk** from outdoor play, and that **shared responsibility** between staff and guardians is essential.

## 3. Medical and Emergency Care

By signing, I:

- Authorize staff to provide **basic first aid** to my child if needed.
- Authorize staff to contact **emergency services (911)** in situations where they reasonably believe it is necessary.
- Agree to be **reachable via the contact information** I have provided to the school.

## 4. Release of Liability

To the fullest extent permitted by law, I hereby:

- **Release and discharge** Tulsa Area Forest School, its staff, volunteers, and partners from any claims or liability arising from ordinary negligence related to my child’s participation.
- Agree not to pursue claims for **injuries or property damage** that may arise from ordinary risks inherent in outdoor, nature-based programs.

This release does *not* apply to gross negligence or intentional harm, where prohibited by law.

## 5. Acknowledgment and Consent

By signing below, I confirm that:

- I have **read and understood** this waiver.
- I have had the opportunity to ask questions about the program and its risks.
- I am the **legal guardian** of the child(ren) I am registering and have the authority to consent on their behalf.

**By typing my full name, I acknowledge that this electronic signature has the same legal effect as a handwritten signature.**
$markdown$,
  1,
  true,
  now(),
  null
)
ON CONFLICT (school_id, version) DO UPDATE
SET
  body_md = EXCLUDED.body_md,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 6. Example classes for Tulsa over the next two weeks (for calendar demos)
with tulsa as (
  select id
  from public.schools
  where id = 'a0000001-0000-4000-8000-000000000001'::uuid
  limit 1
)
insert into public.classes (
  school_id,
  title,
  description,
  location,
  starts_at,
  ends_at,
  facilitator_profile_id
)
select
  tulsa.id,
  cls.title,
  cls.description,
  cls.location,
  cls.starts_at,
  cls.ends_at,
  null::uuid as facilitator_profile_id
from tulsa
cross join (
  values
    (
      'Forest Math & Story Circle',
      'Counting tree rings and reading forest stories.',
      'Oak Grove',
      (now() + interval '1 day')::timestamptz,
      (now() + interval '1 day' + interval '2 hours')::timestamptz
    ),
    (
      'Creek Exploration',
      'Safe exploration of the creek and its ecosystem.',
      'Creekside',
      (now() + interval '3 days')::timestamptz,
      (now() + interval '3 days' + interval '2 hours')::timestamptz
    ),
    (
      'Shelter Building Basics',
      'Learning to build simple forest shelters as a team.',
      'Pine Clearing',
      (now() + interval '7 days')::timestamptz,
      (now() + interval '7 days' + interval '3 hours')::timestamptz
    ),
    (
      'Birdwatching & Journaling',
      'Identifying local birds and keeping a nature journal.',
      'Meadow',
      (now() + interval '10 days')::timestamptz,
      (now() + interval '10 days' + interval '2 hours')::timestamptz
    ),
    (
      'Trail Stewardship Day',
      'Maintaining trails and learning about conservation.',
      'Main Trailhead',
      (now() + interval '13 days')::timestamptz,
      (now() + interval '13 days' + interval '3 hours')::timestamptz
    )
) as cls(title, description, location, starts_at, ends_at);

