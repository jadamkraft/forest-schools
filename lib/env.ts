import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates env at runtime. Call early (e.g. in root layout) to fail fast if keys are missing.
 */
export function getEnv(): Env {
  const parsed = envSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid env: ${parsed.error.message}. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_*`
    );
  }
  return parsed.data;
}
