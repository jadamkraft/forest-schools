import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/src/types/supabase";
import { getSupabase } from "@/lib/supabase";

type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
type AnnouncementReadRow = Database["public"]["Tables"]["announcement_reads"]["Row"];

export interface Announcement extends AnnouncementRow {
  isRead: boolean;
  readAt: string | null;
}

export function announcementsQueryKey(
  schoolId: string | null,
): [string, string | null] {
  return ["announcements", schoolId];
}

async function fetchAnnouncements(schoolId: string): Promise<Announcement[]> {
  const client = getSupabase();

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  const profileId = user?.id;

  const { data, error } = await client
    .from("announcements")
    .select(
      `
        id,
        school_id,
        title,
        body,
        priority,
        audience,
        published_at,
        expires_at,
        created_by,
        created_at,
        updated_at,
        announcement_reads (
          announcement_id,
          profile_id,
          read_at,
          school_id
        )
      `,
    )
    .eq("school_id", schoolId)
    .order("published_at", { ascending: false });

  if (error) {
    throw error;
  }

  type AnnouncementJoined = AnnouncementRow & {
    announcement_reads: AnnouncementReadRow[] | null;
  };

  const rows = (data ?? []) as AnnouncementJoined[];

  return rows.map((row) => {
    const match =
      row.announcement_reads?.find((read) => read.profile_id === profileId) ??
      null;

    return {
      ...row,
      isRead: match != null,
      readAt: match?.read_at ?? null,
    };
  });
}

export function useAnnouncements(schoolId: string | null) {
  return useQuery<Announcement[]>({
    queryKey: announcementsQueryKey(schoolId),
    queryFn: () => fetchAnnouncements(schoolId!),
    enabled: schoolId != null,
  });
}

