-- Digital waivers and waiver signatures for TAFS.
-- Tenant scoped via school_id, consistent with existing pattern.

begin;

-- Waivers: versioned text per school
create table if not exists public.waivers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  body_md text not null,
  version integer not null,
  is_active boolean not null default false,
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (school_id, version)
);

create index if not exists idx_waivers_school_active
  on public.waivers (school_id, is_active);

-- At most one active waiver per school
create unique index if not exists idx_waivers_one_active_per_school
  on public.waivers (school_id)
  where is_active = true;

alter table public.waivers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'waivers'
      and policyname = 'waivers_select_by_school'
  ) then
    create policy "waivers_select_by_school"
      on public.waivers for select
      using ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'waivers'
      and policyname = 'waivers_insert_by_school'
  ) then
    create policy "waivers_insert_by_school"
      on public.waivers for insert
      with check ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'waivers'
      and policyname = 'waivers_update_by_school'
  ) then
    create policy "waivers_update_by_school"
      on public.waivers for update
      using ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;
end$$;

-- Waiver signatures: guardian signing on behalf of a student
create table if not exists public.waiver_signatures (
  id uuid primary key default gen_random_uuid(),
  waiver_id uuid not null references public.waivers(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  signed_at timestamptz not null default now(),
  signature_display_name text not null,
  signature_method text not null default 'typed',
  signed_ip text,
  user_agent text,
  revoked_at timestamptz,
  unique (waiver_id, profile_id, student_id)
);

create index if not exists idx_waiver_signatures_school_waiver_student
  on public.waiver_signatures (school_id, waiver_id, student_id);

alter table public.waiver_signatures enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'waiver_signatures'
      and policyname = 'waiver_signatures_select_by_school'
  ) then
    create policy "waiver_signatures_select_by_school"
      on public.waiver_signatures for select
      using ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'waiver_signatures'
      and policyname = 'waiver_signatures_insert_by_school'
  ) then
    create policy "waiver_signatures_insert_by_school"
      on public.waiver_signatures for insert
      with check ((auth.jwt() ->> 'school_id')::uuid = school_id);
  end if;
end$$;

commit;

