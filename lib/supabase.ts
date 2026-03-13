import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/supabase";

let client: SupabaseClient<Database> | null = null;

/**
 * Resolves the Supabase URL, optionally replacing the host with a local IP.
 * Use EXPO_PUBLIC_SUPABASE_LOCAL_IP when testing on a physical device or another VM
 * so the app can reach Supabase running in Docker (avoids Windows host.docker.internal issues).
 */
function resolveSupabaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const localIp = process.env.EXPO_PUBLIC_SUPABASE_LOCAL_IP;
  if (!raw) return "";
  if (!localIp?.trim()) return raw;
  try {
    const u = new URL(raw);
    u.hostname = localIp.trim();
    return u.toString();
  } catch {
    return raw;
  }
}

/**
 * Singleton Supabase client. Use this everywhere so RLS and auth state are consistent.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    const url = resolveSupabaseUrl();
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env."
      );
    }
    client = createClient<Database>(url, key);
  }
  return client;
}

/** Default export for convenience (e.g. import supabase from '@/lib/supabase') */
export const supabase = getSupabase();
