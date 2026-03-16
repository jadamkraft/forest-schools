import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import type { AuthState } from "./types";
import { getSchoolIdFromSession } from "./types";

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [role, setRole] = useState<string | null>(null);

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
        }
        return;
      }

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
        return;
      }

      setRole(data?.role ?? null);
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
    signIn,
    signOut,
  };
}
