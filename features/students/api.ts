import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { studentSchema } from "@/features/attendance";

const studentsArraySchema = z.array(studentSchema);

export async function fetchStudentsForGuardian(schoolId: string, profileId: string) {
  const client = getSupabase();
  const { data, error } = await client
    .from("students")
    .select("*")
    .eq("school_id", schoolId)
    .eq("created_by", profileId);

  if (error) {
    throw error;
  }

  const parsed = studentsArraySchema.parse(data ?? []);
  return parsed;
}

export function useGuardianStudents(schoolId: string | null, profileId: string | null) {
  return useQuery({
    queryKey: ["guardian-students", schoolId, profileId],
    queryFn: () => fetchStudentsForGuardian(schoolId!, profileId!),
    enabled: schoolId != null && profileId != null,
  });
}

const createStudentInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().nullable(),
});

interface UseCreateStudentArgs {
  schoolId: string | null;
  profileId: string | null;
}

export function useCreateStudent({ schoolId, profileId }: UseCreateStudentArgs) {
  return useMutation({
    mutationFn: async (input: z.infer<typeof createStudentInputSchema>) => {
      if (schoolId == null || profileId == null) {
        throw new Error("Cannot create student without schoolId and profileId.");
      }

      const payload = {
        ...createStudentInputSchema.parse(input),
        school_id: schoolId,
        created_by: profileId,
      };

      const client = getSupabase();
      const { error } = await client.from("students").insert(payload);
      if (error) {
        throw error;
      }
    },
  });
}

