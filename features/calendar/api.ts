import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getSupabase } from "../../lib/supabase";
import type { Class, RsvpStatus } from "./types";
import { classSchema, rsvpSchema } from "./types";

const classesArraySchema = z.array(classSchema);
const rsvpsArraySchema = z.array(rsvpSchema);

export interface FetchClassesForRangeParams {
  schoolId: string;
  start: string;
  end: string;
}

export async function fetchClassesForRange(params: FetchClassesForRangeParams): Promise<Class[]> {
  const { schoolId, start, end } = params;
  const { data, error } = await getSupabase()
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)
    .gte("starts_at", start)
    .lte("starts_at", end)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  const parsed = classesArraySchema.parse(data ?? []);
  return parsed as Class[];
}

export interface FetchRsvpsForClassesParams {
  schoolId: string;
  classIds: string[];
}

export async function fetchRsvpsForClasses(params: FetchRsvpsForClassesParams) {
  const { schoolId, classIds } = params;
  if (classIds.length === 0) return [];

  const { data, error } = await getSupabase()
    .from("rsvps")
    .select("*")
    .eq("school_id", schoolId)
    .in("class_id", classIds);

  if (error) throw error;
  const parsed = rsvpsArraySchema.parse(data ?? []);
  return parsed;
}

export function classesQueryKey(schoolId: string | null, start: string | null, end: string | null) {
  return ["classes", schoolId, start, end] as const;
}

export function rsvpsQueryKey(schoolId: string | null, classIds: string[]) {
  return ["rsvps", schoolId, classIds] as const;
}

export function useClassesForRange(schoolId: string | null, start: string | null, end: string | null) {
  return useQuery({
    queryKey: classesQueryKey(schoolId, start, end),
    queryFn: () => fetchClassesForRange({ schoolId: schoolId!, start: start!, end: end! }),
    enabled: schoolId != null && start != null && end != null,
  });
}

export function useRsvpsForClasses(schoolId: string | null, classIds: string[]) {
  return useQuery({
    queryKey: rsvpsQueryKey(schoolId, classIds),
    queryFn: () => fetchRsvpsForClasses({ schoolId: schoolId!, classIds }),
    enabled: schoolId != null && classIds.length > 0,
  });
}

interface UpsertRsvpParams {
  schoolId: string;
  classId: string;
  profileId: string;
  studentId: string;
  status: RsvpStatus;
}

async function upsertRsvp(params: UpsertRsvpParams): Promise<void> {
  const { schoolId, classId, profileId, studentId, status } = params;
  const payload = {
    school_id: schoolId,
    class_id: classId,
    profile_id: profileId,
    student_id: studentId,
    status,
  };

  const { error } = await getSupabase()
    .from("rsvps")
    .upsert(payload, { onConflict: "class_id,student_id" });

  if (error) throw error;
}

interface UseUpsertRsvpMutationArgs {
  schoolId: string | null;
  classId: string;
  profileId: string | null;
  studentId: string;
}

export function useUpsertRsvpMutation(args: UseUpsertRsvpMutationArgs) {
  const { schoolId, classId, profileId, studentId } = args;

  return useMutation<void, Error, { status: RsvpStatus }>({
    mutationFn: async (variables) => {
      if (schoolId == null || profileId == null) {
        throw new Error("Cannot RSVP without schoolId and profileId.");
      }
      await upsertRsvp({
        schoolId,
        classId,
        profileId,
        studentId,
        status: variables.status,
      });
    },
  });
}

