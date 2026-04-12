import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Tables } from "@/src/types/supabase";

type Waiver = Tables<"waivers">;
type WaiverSignature = Tables<"waiver_signatures">;

type WaiverStatus =
  | { status: "loading" }
  | { status: "needs-signature"; waiver: Waiver | null }
  | { status: "fulfilled"; waiver: Waiver | null };

export type UseWaiverStatusOptions = {
  /**
   * When true, skip network calls and treat waiver as satisfied (staff/admin do not sign guardian waivers).
   */
  skipFetch?: boolean;
};

export function useWaiverStatus(
  schoolId: string | null | undefined,
  profileId: string | null | undefined,
  options?: UseWaiverStatusOptions,
): WaiverStatus {
  const skipFetch = options?.skipFetch === true;
  const [state, setState] = useState<WaiverStatus>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (skipFetch) {
        if (isMounted) {
          setState({ status: "fulfilled", waiver: null });
        }
        return;
      }

      if (!schoolId || !profileId) {
        if (isMounted) {
          // Avoid infinite loading: without school scope we cannot verify signatures; gate as needs-signature.
          setState({ status: "needs-signature", waiver: null });
        }
        return;
      }

      const supabase = getSupabase();

      const { data: waiver, error: waiverError } = await supabase
        .from("waivers")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .maybeSingle<Waiver>();

      if (waiverError) {
        console.error("Failed to load waiver", waiverError);
        if (isMounted) {
          // Never silently grant access when we can't validate waiver status.
          // For guardians, the layout will route to the waiver screen.
          setState({ status: "needs-signature", waiver: null });
        }
        return;
      }

      if (!waiver) {
        if (isMounted) {
          setState({ status: "fulfilled", waiver: null });
        }
        return;
      }

      const { data: signatures, error: sigError } = await supabase
        .from("waiver_signatures")
        .select("*")
        .eq("school_id", schoolId)
        .eq("profile_id", profileId)
        .eq("waiver_id", waiver.id)
        .limit(1)
        .returns<WaiverSignature[]>();

      if (sigError) {
        console.error("Failed to load waiver signatures", sigError);
        if (isMounted) {
          setState({ status: "needs-signature", waiver });
        }
        return;
      }

      if (!signatures || signatures.length === 0) {
        if (isMounted) {
          setState({ status: "needs-signature", waiver });
        }
      } else if (isMounted) {
        setState({ status: "fulfilled", waiver });
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [schoolId, profileId, skipFetch]);

  return state;
}

