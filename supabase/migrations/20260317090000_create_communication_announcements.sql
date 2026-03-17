-- Internal communication announcements (Phase 1)
create table public.communication_announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  target_role text not null,
  created_at timestamptz not null default now()
);

create index communication_announcements_school_role_created_at_desc
  on public.communication_announcements (school_id, target_role, created_at desc);

alter table public.communication_announcements enable row level security;

-- Helper: resolve caller's profile and school via auth.uid()
-- This mirrors the pattern used in announcements and keeps local dev working
-- even when JWT app_metadata.school_id is not present.

-- SELECT: any profile in the same school can read announcements
create policy communication_announcements_select_by_profile_school
  on public.communication_announcements
  as permissive
  for select
  to public
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = communication_announcements.school_id
    )
  );

-- INSERT: only admins in the same school can create announcements
create policy communication_announcements_insert_by_admin
  on public.communication_announcements
  as permissive
  for insert
  to public
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = communication_announcements.school_id
        and p.role = 'admin'
    )
  );

