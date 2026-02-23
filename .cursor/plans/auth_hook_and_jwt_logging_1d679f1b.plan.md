---
name: Auth hook and JWT logging
overview: Add a Supabase Custom Access Token Hook migration that copies school_id from raw_app_meta_data into the JWT so RLS can match, grant execute to supabase_auth_admin, enable the hook in config, and update verify-rls.ts to log the decoded JWT for debugging.
todos: []
isProject: false
---

# Auth hook and verify-rls JWT logging

## Problem

[lib/verify-rls.ts](lib/verify-rls.ts) signs in successfully but returns 0 students. RLS uses `(auth.jwt() ->> 'school_id')::uuid = school_id`; the JWT does not currently include `school_id`, so the predicate is false for every row.

## Approach

1. **Custom Access Token Hook** (Postgres function) runs before each token is issued and adds `school_id` from `auth.users.raw_app_meta_data` to the token claims.
2. **Enable the hook** in [supabase/config.toml](supabase/config.toml) so Auth calls the function.
3. **Log decoded JWT** in verify-rls so you can confirm `school_id` is present after the hook is active.

---

## 1. New migration: `supabase/migrations/[timestamp]_add_auth_hook.sql`

Use a timestamp after the existing migration (e.g. `20260222100000`). Single file that:

**1.1 Create the hook function**

- **Schema**: Supabase’s documented pattern uses the **public** schema for this hook (Auth invokes `pg-functions://.../public/custom_access_token_hook`). Creating in `auth` is not the standard approach and may not be supported by the Auth service; use **public**.
- **Signature**: `custom_access_token_hook(event jsonb) returns jsonb` (same as [Supabase Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)).
- **Logic**:
  - Read `event->'claims'` and `event->>'user_id'`.
  - `SELECT raw_app_meta_data FROM auth.users WHERE id = (event->>'user_id')::uuid` (single row).
  - If `raw_app_meta_data->'school_id'` is present, set it on the claims: `jsonb_set(claims, '{school_id}', raw_app_meta_data->'school_id')`. Keep all existing claims; only add or overwrite `school_id`.
  - Return `jsonb_build_object('claims', modified_claims)`.
- **Privileges**: The function must read `auth.users`. If the invoker (`supabase_auth_admin`) has `SELECT` on `auth.users`, use default `SECURITY INVOKER`. If not, use `SECURITY DEFINER` and set the function owner to a role that can read `auth.users` (e.g. `postgres`).

**1.2 Grants (per setup plan and Supabase docs)**

- `GRANT USAGE ON SCHEMA public TO supabase_auth_admin;`
- `GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;`
- `REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;` (so only Auth can call it)

No other schema or table changes.

---

## 2. Enable the hook in config

In [supabase/config.toml](supabase/config.toml), uncomment and set the custom access token hook (around lines 266–269):

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

After changing config, restart Supabase (e.g. `supabase stop` / `supabase start` or `supabase db reset` if you prefer a full reset) so the hook is loaded. New sign-ins and token refreshes will then get `school_id` in the JWT.

---

## 3. Update [lib/verify-rls.ts](lib/verify-rls.ts): log decoded JWT

After a successful `signInWithPassword`, the session’s `access_token` is a JWT. Decode and log its payload so you can verify `school_id` is present.

**Options:**

- **Option A (recommended):** Add dev dependency `jwt-decode` and use `jwtDecode<{ school_id?: string }>(session.access_token)` then `console.log('Decoded JWT payload:', payload)` (and optionally `payload.school_id`).
- **Option B:** No new dependency: decode manually by splitting on `'.'`, base64url-decoding the second segment (replace `-`/`_`, add padding if needed), `JSON.parse`, then log. Less robust for edge cases but fine for a dev script.

Log **after** sign-in and before the students fetch, so the log clearly shows whether the token used for the request includes `school_id`. Keep existing logs (e.g. `app_metadata.school_id`) for comparison.

---

## 4. Verification flow

1. Ensure the test user has **App Metadata** `school_id` set to the Tulsa school UUID (e.g. in Dashboard: Authentication → Users → user → App Metadata: `{"school_id": "a0000001-0000-4000-8000-000000000001"}`).
2. Apply migration and config, restart Supabase.
3. Run `npm run verify-rls`. In the output:

- Decoded JWT should show `school_id` in the payload.
- Students count should be 5 and all rows should have the Tulsa `school_id`.

If the decoded JWT still has no `school_id`, the hook is not running (config not reloaded, or hook not in `public` with correct name/uri) or `raw_app_meta_data` has no `school_id` for that user.

---

## Summary

| Item          | Action                                                                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Migration     | New `[timestamp]_add_auth_hook.sql`: create `public.custom_access_token_hook(event jsonb)`, copy `school_id` from `raw_app_meta_data` into returned claims; grant execute to `supabase_auth_admin`; revoke from authenticated/anon/public. |
| Config        | Enable `[auth.hook.custom_access_token]` with `uri = "pg-functions://postgres/public/custom_access_token_hook"`.                                                                                                                           |
| verify-rls.ts | After sign-in, decode `session.access_token` (jwt-decode or manual) and log the payload so you can confirm `school_id` is present.                                                                                                         |
