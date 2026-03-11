-- TAFS: Classes and RSVPs for calendar feature.
-- RLS enforces (auth.jwt() ->> 'school_id')::uuid = school_id.

begin;

-- Enum for RSVP status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rsvp_status') then
    create type public.rsvp_status as enum ('attending', 'excused', 'late');
  end if;
end$$;

-- Classes: tenant-scoped schedule entries
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  facilitator_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_classes_school_starts_at
  on public.classes (school_id, starts_at desc);

alter table public.classes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'classes'
      and policyname = 'classes_select_by_school'
  ) then
    create policy "classes_select_by_school"
      on public.classes for select
      using ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'classes'
      and policyname = 'classes_insert_by_school'
  ) then
    create policy "classes_insert_by_school"
      on public.classes for insert
      with check ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'classes'
      and policyname = 'classes_update_by_school'
  ) then
    create policy "classes_update_by_school"
      on public.classes for update
      using ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;
end$$;

-- RSVPs: one per student per class (profile is the actor)
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.rsvp_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create index if not exists idx_rsvps_school_class
  on public.rsvps (school_id, class_id);

alter table public.rsvps enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rsvps'
      and policyname = 'rsvps_select_by_school'
  ) then
    create policy "rsvps_select_by_school"
      on public.rsvps for select
      using ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rsvps'
      and policyname = 'rsvps_insert_by_school'
  ) then
    create policy "rsvps_insert_by_school"
      on public.rsvps for insert
      with check ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rsvps'
      and policyname = 'rsvps_update_by_school'
  ) then
    create policy "rsvps_update_by_school"
      on public.rsvps for update
      using ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;
end$$;

commit;

