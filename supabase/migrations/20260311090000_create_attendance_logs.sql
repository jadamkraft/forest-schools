-- Attendance logs for TAFS: per-student check-in events.
-- RLS enforces (auth.jwt() ->> 'school_id')::uuid = school_id.

create table public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  status text not null check (status in ('present', 'absent')),
  check_in_time timestamptz not null default now()
);

create index idx_attendance_logs_school_student_time
  on public.attendance_logs (school_id, student_id, check_in_time desc);

alter table public.attendance_logs enable row level security;

create policy "attendance_logs_insert_by_school"
  on public.attendance_logs for insert
  with check ((auth.jwt() ->> 'school_id')::uuid = school_id);

create policy "attendance_logs_select_by_school"
  on public.attendance_logs for select
  using ((auth.jwt() ->> 'school_id')::uuid = school_id);

