-- TAFS initial schema: schools (tenant root), profiles, students.
-- RLS enforces (auth.jwt() ->> 'school_id')::uuid = school_id.
--
-- FDE tip: For the first test user, set school_id in Supabase Dashboard:
--   Authentication -> Users -> [user] -> User Metadata or App Metadata -> add "school_id": "<uuid of a school>"
-- Then refresh the session so the JWT includes school_id and RLS allows access.

-- Schools (tenant root; no school_id on this table)
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles: one per auth.users row, scoped to a school
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  email text,
  full_name text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_school_id on public.profiles(school_id);

-- Students: tenant-scoped
create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_students_school_id on public.students(school_id);

-- RLS: profiles
alter table public.profiles enable row level security;

create policy "profiles_select_by_school"
  on public.profiles for select
  using ((auth.jwt() ->> 'school_id')::uuid = school_id);

create policy "profiles_update_by_school"
  on public.profiles for update
  using ((auth.jwt() ->> 'school_id')::uuid = school_id);

create policy "profiles_insert_by_school"
  on public.profiles for insert
  with check ((auth.jwt() ->> 'school_id')::uuid = school_id);

-- RLS: students
alter table public.students enable row level security;

create policy "students_select_by_school"
  on public.students for select
  using ((auth.jwt() ->> 'school_id')::uuid = school_id);

create policy "students_insert_by_school"
  on public.students for insert
  with check ((auth.jwt() ->> 'school_id')::uuid = school_id);

create policy "students_update_by_school"
  on public.students for update
  using ((auth.jwt() ->> 'school_id')::uuid = school_id);

create policy "students_delete_by_school"
  on public.students for delete
  using ((auth.jwt() ->> 'school_id')::uuid = school_id);

-- Optional: RLS on schools so users only see their own school
alter table public.schools enable row level security;

create policy "schools_select_by_jwt_school"
  on public.schools for select
  using (id = (auth.jwt() ->> 'school_id')::uuid);
