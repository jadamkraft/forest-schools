// Attendance feature: logic and UI co-located. Re-export public API here.
export type { Student, StudentSchema } from "./types";
export { studentSchema } from "./types";
export {
  fetchStudents,
  useStudents,
  studentsQueryKey,
  useLogAttendanceMutation,
} from "./api";
