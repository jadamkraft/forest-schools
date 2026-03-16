-- Create profiles automatically when auth users are created.
-- This reads school_id and other fields from auth.users metadata so that:
-- - profiles.id stays in sync with auth.users.id
-- - profiles.school_id matches the tenant UUID used in JWT claims

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  school_uuid uuid;
  full_name_text text;
  role_text text;
begin
  -- Resolve school_id from app metadata; if missing or invalid, skip profile creation.
  begin
    school_uuid := (new.raw_app_meta_data->>'school_id')::uuid;
  exception
    when others then
      school_uuid := null;
  end;

  if school_uuid is null then
    return new;
  end if;

  full_name_text := coalesce(new.raw_user_meta_data->>'full_name', new.email);
  role_text := coalesce(new.raw_user_meta_data->>'role', 'guardian');

  insert into public.profiles (id, school_id, email, full_name, role)
  values (new.id, school_uuid, new.email, full_name_text, role_text)
  on conflict (id) do update
    set
      school_id = excluded.school_id,
      email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

