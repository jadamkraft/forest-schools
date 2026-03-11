import { z } from "zod";

export interface Class {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  facilitator_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

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

export type RsvpStatus = "attending" | "excused" | "late";

export interface Rsvp {
  id: string;
  school_id: string;
  class_id: string;
  profile_id: string;
  student_id: string;
  status: RsvpStatus;
  created_at: string;
  updated_at: string;
}

export const rsvpSchema = z.object({
  id: z.string().uuid(),
  school_id: z.string().uuid(),
  class_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  student_id: z.string().uuid(),
  status: z.union([z.literal("attending"), z.literal("excused"), z.literal("late")]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type RsvpSchema = z.infer<typeof rsvpSchema>;

