import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Singleton Supabase client. Use this everywhere so RLS and auth state are consistent.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env."
      );
    }
    client = createClient(url, key);
  }
  return client;
}

/** Default export for convenience (e.g. import supabase from '@/lib/supabase') */
export const supabase = getSupabase();
