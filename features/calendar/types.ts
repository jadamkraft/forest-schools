import { z } from "zod";
import type { Database } from "../../src/types/supabase";

type ClassesRow = Database["public"]["Tables"]["classes"]["Row"];
type RsvpsRow = Database["public"]["Tables"]["rsvps"]["Row"];
export type RsvpStatus = Database["public"]["Enums"]["rsvp_status"];

export type Class = ClassesRow;

export const classSchema = z.object({
  id: z.string().uuid(),
  school_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  starts_at: z.string(),
  ends_at: z.string().nullable(),
  facilitator_profile_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export type Rsvp = RsvpsRow;

export const rsvpSchema = z.object({
  id: z.string().uuid(),
  school_id: z.string().uuid(),
  class_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  student_id: z.string().uuid(),
  status: z.nativeEnum(
    // Zod doesn't know the enum at runtime; keep literals in sync with DB enum definition.
    { attending: "attending", excused: "excused", late: "late" } as const
  ),
  created_at: z.string(),
  updated_at: z.string(),
});

export type RsvpSchema = z.infer<typeof rsvpSchema>;

