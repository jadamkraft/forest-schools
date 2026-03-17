import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/src/types/supabase";
import { getSupabase } from "@/lib/supabase";
import type { AppRole } from "@/features/auth/types";

type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
type AnnouncementReadRow = Database["public"]["Tables"]["announcement_reads"]["Row"];

export interface Announcement extends AnnouncementRow {
  isRead: boolean;
  readAt: string | null;
}

export function announcementsQueryKey(
  schoolId: string | null,
  role: AppRole | null,
): [string, string | null, AppRole | null] {
  return ["announcements", schoolId, role];
}

function shouldIncludeForRole(audience: string | null, role: AppRole | null): boolean {
  if (audience == null || audience === "all") {
    return true;
  }
  if (role == null) {
    return false;
  }
  if (audience === "staff") {
    return role === "staff" || role === "admin";
  }
  if (audience === "guardians") {
    return role === "guardian";
  }
  return false;
}

async function fetchAnnouncements(schoolId: string, role: AppRole | null): Promise<Announcement[]> {
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

  const filtered = rows.filter((row) => shouldIncludeForRole(row.audience ?? "all", role));

  return filtered.map((row) => {
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

export function useAnnouncements(schoolId: string | null, role: AppRole | null) {
  return useQuery<Announcement[]>({
    queryKey: announcementsQueryKey(schoolId, role),
    queryFn: () => fetchAnnouncements(schoolId!, role),
    enabled: schoolId != null,
  });
}

