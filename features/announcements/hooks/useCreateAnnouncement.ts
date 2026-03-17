import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/src/types/supabase";
import { getSupabase } from "@/lib/supabase";
import type { AppRole } from "@/features/auth/types";
import { announcementsQueryKey } from "@/features/announcements/hooks/useAnnouncements";

type AnnouncementInsert = Database["public"]["Tables"]["announcements"]["Insert"];

export interface UseCreateAnnouncementArgs {
  schoolId: string | null;
  role: AppRole | null;
}

interface CreateAnnouncementInput {
  title: string;
  body: string;
  audience: "all" | "staff" | "guardians";
  priority: "normal" | "important" | "emergency";
}

export function useCreateAnnouncement({
  schoolId,
  role,
}: UseCreateAnnouncementArgs) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CreateAnnouncementInput>({
    mutationFn: async ({ title, body, audience, priority }) => {
      if (schoolId == null) {
        throw new Error("Cannot create announcement without a schoolId.");
      }

      const client = getSupabase();
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Not authenticated.");
      }

      const payload: AnnouncementInsert = {
        school_id: schoolId,
        title,
        body,
        audience,
        priority,
        created_by: user.id,
      };

      const { error } = await client.from("announcements").insert(payload);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      if (schoolId == null) {
        return;
      }

      const key = announcementsQueryKey(schoolId, role ?? null);
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

