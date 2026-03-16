-- Backfill profiles for existing auth users that have a school_id
-- in raw_app_meta_data but no corresponding row in public.profiles.
-- This mirrors the logic in public.handle_new_user().

begin;

insert into public.profiles (id, school_id, email, full_name, role, created_at, updated_at)
select
  u.id,
  (u.raw_app_meta_data->>'school_id')::uuid as school_id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  coalesce(
    u.raw_user_meta_data->>'role',
    u.raw_app_meta_data->>'role',
    'guardian'
  ) as role,
  now() as created_at,
  now() as updated_at
from auth.users u
left join public.profiles p
  on p.id = u.id
where
  (u.raw_app_meta_data->>'school_id') is not null
  and p.id is null;

commit;

