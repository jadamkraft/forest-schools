-- Custom Access Token Hook: copy school_id from auth.users.raw_app_meta_data
-- into the JWT claims so RLS (auth.jwt() ->> 'school_id') can match.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  user_claims jsonb;
  app_meta jsonb;
  school_id_val jsonb;
begin
  user_claims := event->'claims';
  select raw_app_meta_data into app_meta
  from auth.users
  where id = (event->>'user_id')::uuid;

  if app_meta is not null and app_meta ? 'school_id' then
    school_id_val := app_meta->'school_id';
    user_claims := jsonb_set(user_claims, '{school_id}', school_id_val);
  end if;

  return jsonb_build_object('claims', user_claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated;
revoke execute on function public.custom_access_token_hook(jsonb) from anon;
revoke execute on function public.custom_access_token_hook(jsonb) from public;
