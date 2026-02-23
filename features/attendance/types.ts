import { z } from "zod";

/**
 * Student entity matching public.students table.
 * All tenant-scoped queries must filter by school_id.
 */
export interface Student {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

/** Zod schema for validating API responses (students table row). */
export const studentSchema = z.object({
  id: z.string().uuid(),
  school_id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  date_of_birth: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type StudentSchema = z.infer<typeof studentSchema>;
