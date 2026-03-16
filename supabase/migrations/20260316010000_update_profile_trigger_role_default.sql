-- Update profiles trigger to be more robust when role metadata is missing.
-- This keeps the same behavior for school_id while expanding how role is derived:
-- - Prefer raw_user_meta_data->>'role'
-- - Fallback to raw_app_meta_data->>'role'
-- - Finally default to 'guardian'

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

  -- Prefer user metadata role, then app metadata role, then default.
  role_text := coalesce(
    new.raw_user_meta_data->>'role',
    new.raw_app_meta_data->>'role',
    'guardian'
  );

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

