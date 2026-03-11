-- Add emergency contact and medical info fields to students.
-- All fields are nullable to avoid breaking existing rows.

alter table public.students
  add column if not exists primary_contact_name text,
  add column if not exists primary_contact_phone text,
  add column if not exists secondary_contact_name text,
  add column if not exists secondary_contact_phone text,
  add column if not exists medical_info text;

