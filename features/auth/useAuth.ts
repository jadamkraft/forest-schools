import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import type { AppRole, AuthState } from "./types";
import { getSchoolIdFromSession, normalizeRole } from "./types";

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [role, setRole] = useState<AppRole | null>(null);
  /** Start true so we never flash the "no role" screen before the first profile fetch when a session exists. */
  const [isRoleLoading, setIsRoleLoading] = useState<boolean>(true);
  const [roleError, setRoleError] = useState<string | null>(null);

  const user = session?.user ?? null;
  const schoolId = getSchoolIdFromSession(session);

  useEffect(() => {
    let mounted = true;

    getSupabase()
      .auth.getSession()
      .then(({ data: { session: s } }) => {
        if (mounted) {
          setSession(s);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, s) => {
      if (mounted) {
        setSession(s);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfileRole() {
      if (!user) {
        if (mounted) {
          setRole(null);
          setRoleError(null);
          setIsRoleLoading(false);
        }
        return;
      }

      setIsRoleLoading(true);
      setRoleError(null);

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<{ role: string | null }>();

      if (!mounted) return;

      if (error) {
        console.error("Failed to load profile role", error);
        setRole(null);
        setRoleError(error.message ?? "Failed to load profile role");
        setIsRoleLoading(false);
        return;
      }

      const normalized = normalizeRole(data?.role ?? null);
      setRole(normalized);
      if (data === null) {
        setRoleError("No profile row for this account");
      } else if (normalized === null) {
        setRoleError(
          data.role == null || String(data.role).trim() === ""
            ? "Profile has no role set"
            : "Unrecognized profile role",
        );
      } else {
        setRoleError(null);
      }
      setIsRoleLoading(false);
    }

    loadProfileRole();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await getSupabase().auth.signOut();
  }, []);

  return {
    session,
    user,
    schoolId,
    role,
    isLoading,
    isRoleLoading,
    roleError,
    signIn,
    signOut,
  };
}
