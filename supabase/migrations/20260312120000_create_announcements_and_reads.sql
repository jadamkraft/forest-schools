-- TAFS Phase 2: Internal Announcements
-- Multi-tenant announcements + per-profile read tracking.
-- RLS is based on joining public.profiles using auth.uid()
-- rather than relying solely on auth.jwt()->>'school_id',
-- which is important for local Docker development where JWT
-- claims may not always be present.

-- 1) Announcements table (tenant-scoped via school_id)
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  body text not null,
  priority text not null default 'normal', -- 'normal' | 'important' | 'emergency' (enforced in app)
  audience text not null default 'all',    -- 'all' | 'staff' | 'guardians' (enforced in app)
  published_at timestamptz not null default now(),
  expires_at timestamptz null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index announcements_school_published_at_desc
  on public.announcements (school_id, published_at desc);

create index announcements_school_priority_published_at
  on public.announcements (school_id, priority, published_at desc);

-- 2) Announcement read receipts (per profile, tenant-scoped)
create table public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  read_at timestamptz not null default now(),
  constraint announcement_reads_pkey primary key (announcement_id, profile_id)
);

create index announcement_reads_profile_id_idx
  on public.announcement_reads (profile_id, announcement_id);

create index announcement_reads_school_idx
  on public.announcement_reads (school_id);

-- 3) Enable RLS
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;

-- Helper note:
-- We derive the caller's school via public.profiles using auth.uid().
-- This keeps policies working in local Docker dev even when JWT
-- app_metadata.school_id is not wired through.

-- 4) RLS policies for public.announcements

-- SELECT: any profile whose school_id matches the announcement's school_id
-- may read announcements, regardless of role, within the valid time window.
create policy announcements_select_by_profile_school
  on public.announcements
  as permissive
  for select
  to public
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = announcements.school_id
    )
    and published_at <= now()
    and (expires_at is null or expires_at > now())
  );

-- INSERT: only 'staff' in the same school can create announcements.
create policy announcements_insert_by_staff
  on public.announcements
  as permissive
  for insert
  to public
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = announcements.school_id
        and p.role = 'staff'
    )
  );

-- UPDATE: only 'staff' in the same school can update announcements.
create policy announcements_update_by_staff
  on public.announcements
  as permissive
  for update
  to public
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = announcements.school_id
        and p.role = 'staff'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = announcements.school_id
        and p.role = 'staff'
    )
  );

-- DELETE: only 'staff' in the same school can delete announcements.
create policy announcements_delete_by_staff
  on public.announcements
  as permissive
  for delete
  to public
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = announcements.school_id
        and p.role = 'staff'
    )
  );

-- 5) RLS policies for public.announcement_reads

-- SELECT: profile can see its own read receipts within its school.
create policy announcement_reads_select_by_profile
  on public.announcement_reads
  as permissive
  for select
  to public
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = announcement_reads.school_id
        and p.id = announcement_reads.profile_id
    )
  );

-- INSERT: 'staff' and 'guardian' can mark announcements as read for themselves
-- within their own school.
create policy announcement_reads_insert_by_profile
  on public.announcement_reads
  as permissive
  for insert
  to public
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = announcement_reads.school_id
        and p.id = announcement_reads.profile_id
        and p.role in ('staff', 'guardian')
    )
  );

-- (Optional) We do not expose UPDATE/DELETE for announcement_reads for now.

