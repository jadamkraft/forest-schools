-- TAFS: Broaden announcements RLS so admins can manage announcements
-- as well as staff. This aligns with the mobile app, where admins
-- are the primary authors of school-wide broadcasts.

begin;

-- Ensure RLS is enabled (no-op if already on)
alter table public.announcements enable row level security;

-- Update INSERT policy: allow both 'staff' and 'admin' profiles
drop policy if exists announcements_insert_by_staff on public.announcements;

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
        and p.role in ('staff', 'admin')
    )
  );

-- Update UPDATE policy: allow both 'staff' and 'admin' profiles
drop policy if exists announcements_update_by_staff on public.announcements;

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
        and p.role in ('staff', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_id = announcements.school_id
        and p.role in ('staff', 'admin')
    )
  );

-- Update DELETE policy: allow both 'staff' and 'admin' profiles
drop policy if exists announcements_delete_by_staff on public.announcements;

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
        and p.role in ('staff', 'admin')
    )
  );

commit;

