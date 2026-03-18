-- Add created_by column to students to track which profile created a student.
-- We reference public.profiles(id) rather than auth.users(id) so that
-- guardian/staff/admin role metadata and school scoping remain aligned.

alter table public.students
  add column if not exists created_by uuid;

alter table public.students
  add constraint students_created_by_fkey
  foreign key (created_by)
  references public.profiles(id)
  on delete set null;

create index if not exists idx_students_created_by on public.students(created_by);

