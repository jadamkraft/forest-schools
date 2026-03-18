import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getSupabase } from "../../lib/supabase";
import type { Student } from "./types";
import { studentSchema } from "./types";

const studentsArraySchema = z.array(studentSchema);

export type AttendanceStatus = "present" | "absent";

const attendanceLogInsertSchema = z.object({
  student_id: z.string().uuid(),
  school_id: z.string().uuid(),
  status: z.union([z.literal("present"), z.literal("absent")]),
});

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

interface LogAttendanceParams {
  studentId: string;
  schoolId: string;
  status: AttendanceStatus;
}

async function logAttendance(params: LogAttendanceParams): Promise<void> {
  const payload = attendanceLogInsertSchema.parse({
    student_id: params.studentId,
    school_id: params.schoolId,
    status: params.status,
  });

  const { error } = await getSupabase().from("attendance_logs").insert(payload);
  if (error) throw error;
}

/**
 * Insert if no existing log exists yet; otherwise update the most recent log.
 * This matches the "insert/update" check-in behavior without needing a class_id column.
 */
async function upsertAttendanceLog(params: LogAttendanceParams): Promise<void> {
  const supabase = getSupabase();
  const nowIso = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("student_id", params.studentId)
    .eq("school_id", params.schoolId)
    .order("check_in_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error: updateError } = await supabase
      .from("attendance_logs")
      .update({ status: params.status, check_in_time: nowIso })
      .eq("id", existing.id);

    if (updateError) throw updateError;
    return;
  }

  await logAttendance(params);
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

interface LogAttendanceMutationVariables {
  studentId: string;
  status: AttendanceStatus;
}

export function useLogAttendanceMutation(schoolId: string | null) {
  return useMutation<void, Error, LogAttendanceMutationVariables>({
    mutationFn: async (variables): Promise<void> => {
      if (schoolId == null) {
        throw new Error("Cannot log attendance without a schoolId.");
      }
      await logAttendance({
        studentId: variables.studentId,
        schoolId,
        status: variables.status,
      });
    },
  });
}

export function useUpsertAttendanceLogMutation(schoolId: string | null) {
  return useMutation<void, Error, LogAttendanceMutationVariables>({
    mutationFn: async (variables): Promise<void> => {
      if (schoolId == null) {
        throw new Error("Cannot log attendance without a schoolId.");
      }
      await upsertAttendanceLog({
        studentId: variables.studentId,
        schoolId,
        status: variables.status,
      });
    },
  });
}

