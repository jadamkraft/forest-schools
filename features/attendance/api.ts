import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getSupabase } from "../../lib/supabase";
import type { Student } from "./types";
import { studentSchema } from "./types";

const studentsArraySchema = z.array(studentSchema);

/**
 * Fetches students for a school. Explicit school_id filter (RLS also enforces).
 * @throws on Supabase error or validation failure
 */
export async function fetchStudents(schoolId: string): Promise<Student[]> {
  const { data, error } = await getSupabase()
    .from("students")
    .select("*")
    .eq("school_id", schoolId);

  if (error) throw error;
  const parsed = studentsArraySchema.parse(data ?? []);
  return parsed as Student[];
}

/** Query key factory for students (include schoolId for cache busting). */
export function studentsQueryKey(schoolId: string | null): [string, string | null] {
  return ["students", schoolId];
}

/**
 * TanStack Query hook for the current school's student roster.
 * Disabled when schoolId is null.
 */
export function useStudents(schoolId: string | null) {
  return useQuery({
    queryKey: studentsQueryKey(schoolId),
    queryFn: () => fetchStudents(schoolId!),
    enabled: schoolId != null,
  });
}
