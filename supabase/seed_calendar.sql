-- Temporary seed for TAFS calendar classes.
-- Adds a few example classes for Tulsa Area Forest School
-- over the next two weeks so the calendar is not empty.

begin;

-- Fixed Tulsa school UUID from seed.sql
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
    ('Forest Math & Story Circle', 'Counting tree rings and reading forest stories.', 'Oak Grove', now() + interval '1 day' at time zone 'utc', now() + interval '1 day' + interval '2 hours' at time zone 'utc'),
    ('Creek Exploration', 'Safe exploration of the creek and its ecosystem.', 'Creekside', now() + interval '3 days' at time zone 'utc', now() + interval '3 days' + interval '2 hours' at time zone 'utc'),
    ('Shelter Building Basics', 'Learning to build simple forest shelters as a team.', 'Pine Clearing', now() + interval '7 days' at time zone 'utc', now() + interval '7 days' + interval '3 hours' at time zone 'utc'),
    ('Birdwatching & Journaling', 'Identifying local birds and keeping a nature journal.', 'Meadow', now() + interval '10 days' at time zone 'utc', now() + interval '10 days' + interval '2 hours' at time zone 'utc'),
    ('Trail Stewardship Day', 'Maintaining trails and learning about conservation.', 'Main Trailhead', now() + interval '13 days' at time zone 'utc', now() + interval '13 days' + interval '3 hours' at time zone 'utc')
) as cls(title, description, location, starts_at, ends_at);

commit;

