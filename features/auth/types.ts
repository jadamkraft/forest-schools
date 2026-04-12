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
  /** Session bootstrap (Supabase getSession / auth listener). */
  isLoading: boolean;
  /** Profile role query in flight for the signed-in user. */
  isRoleLoading: boolean;
  /** Set when the role query fails; omitted or null when not applicable. */
  roleError?: string | null;
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
 * Returns null for missing, empty, or unrecognized values (caller treats as unresolved).
 */
export function normalizeRole(raw: string | null): AppRole | null {
  if (raw == null) return null;
  const key = raw.trim().toLowerCase();
  if (key === "") return null;
  if (key === "admin") return "admin";
  if (key === "staff" || key === "teacher") return "staff";
  if (key === "guardian" || key === "parent") return "guardian";
  return null;
}
