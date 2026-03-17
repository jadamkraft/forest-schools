import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/src/types/supabase";
import { getSupabase } from "@/lib/supabase";
import type { Announcement } from "@/features/announcements/hooks/useAnnouncements";
import { announcementsQueryKey } from "@/features/announcements/hooks/useAnnouncements";
import type { AppRole } from "@/features/auth/types";

type AnnouncementReadInsert =
  Database["public"]["Tables"]["announcement_reads"]["Insert"];

interface UseMarkAnnouncementReadArgs {
  schoolId: string | null;
  role: AppRole | null;
}

export function useMarkAnnouncementRead(
  args: UseMarkAnnouncementReadArgs,
): ReturnType<
  typeof useMutation<
    void,
    Error,
    { announcementId: string },
    { previous?: Announcement[] }
  >
> {
  const { schoolId, role } = args;
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { announcementId: string },
    { previous?: Announcement[] }
  >({
    mutationFn: async ({ announcementId }) => {
      if (schoolId == null) {
        throw new Error("Cannot mark announcement as read without a schoolId.");
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

      const payload: AnnouncementReadInsert = {
        announcement_id: announcementId,
        profile_id: user.id,
        school_id: schoolId,
      };

      const { error } = await client
        .from("announcement_reads")
        .upsert(payload, { onConflict: "announcement_id,profile_id" });

      if (error) {
        throw error;
      }
    },
    onMutate: async ({ announcementId }) => {
      if (schoolId == null) {
        return {};
      }

      const key = announcementsQueryKey(schoolId, role ?? null);

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Announcement[]>(key);

      if (previous) {
        const next = previous.map((announcement) =>
          announcement.id === announcementId
            ? {
                ...announcement,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : announcement,
        );

        queryClient.setQueryData(key, next);
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (schoolId == null || !context?.previous) {
        return;
      }

      const key = announcementsQueryKey(schoolId, role ?? null);
      queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      if (schoolId == null) {
        return;
      }

      const key = announcementsQueryKey(schoolId, role ?? null);
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

