import type { Session } from "@supabase/supabase-js";

/**
 * Narrowed set of roles understood by the app.
 */
export type AppRole = "admin" | "staff" | "guardian";

/**
 * App metadata set by our custom Supabase hook; school_id is added to the JWT for RLS.
 */
export interface AppMetadataWithSchoolId {
  school_id?: string;
}

/**
 * Auth state returned by useAuth (and AuthProvider).
 */
export interface AuthState {
  session: Session | null;
  user: Session["user"] | null;
  schoolId: string | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Extracts school_id from session user app_metadata. Returns null if missing.
 */
export function getSchoolIdFromSession(session: Session | null): string | null {
  if (!session?.user?.app_metadata) return null;
  const meta = session.user.app_metadata as AppMetadataWithSchoolId;
  const id = meta?.school_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * Normalize a raw profile role string into an AppRole.
 * Defaults to "guardian" for unknown or missing roles.
 */
export function normalizeRole(raw: string | null): AppRole {
  if (raw === "admin" || raw === "staff" || raw === "guardian") {
    return raw;
  }
  return "guardian";
}
