import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import type { Student } from "@/features/attendance";

interface ClassRosterStudent extends Student {
  rsvp_status: string;
}

interface UseClassRosterArgs {
  schoolId: string | null;
  classId: string | null;
}

async function fetchClassRoster(schoolId: string, classId: string): Promise<ClassRosterStudent[]> {
  const client = getSupabase();

  const { data, error } = await client
    .from("rsvps")
    .select(
      `
        status,
        students (
          id,
          school_id,
          first_name,
          last_name,
          date_of_birth,
          primary_contact_name,
          primary_contact_phone,
          secondary_contact_name,
          secondary_contact_phone,
          medical_info,
          created_at,
          updated_at
        )
      `,
    )
    .eq("school_id", schoolId)
    .eq("class_id", classId);

  if (error) {
    throw error;
  }

  type RsvpWithStudent = {
    status: string;
    students: Student | null;
  };

  const rows = (data ?? []) as RsvpWithStudent[];

  const roster: ClassRosterStudent[] = rows
    .filter((row) => row.students != null)
    .map((row) => ({
      ...(row.students as Student),
      rsvp_status: row.status,
    }));

  return roster;
}

export function useClassRoster({ schoolId, classId }: UseClassRosterArgs) {
  const enabled = useMemo(() => schoolId != null && classId != null, [schoolId, classId]);

  return useQuery<ClassRosterStudent[]>({
    queryKey: ["class-roster", schoolId, classId],
    queryFn: () => fetchClassRoster(schoolId!, classId!),
    enabled,
  });
}

