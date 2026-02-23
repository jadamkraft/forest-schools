---
name: Attendance List Implementation
overview: "Implement a high-contrast Attendance List on the tabs index screen: define the Student type from the seeded schema, add a students API service with explicit school_id filtering, a TanStack Query hook, and a 60px-min-height roster UI with Check-In toggles using NativeWind (Slate-900 on White)."
todos: []
isProject: false
---

# Attendance List Implementation Plan

## 1. Student type (from seeded schema)

Define the type in **[features/attendance/types.ts](features/attendance/types.ts)** to mirror the `public.students` table in [supabase/migrations/20260222000000_initial_schools_profiles_students.sql](supabase/migrations/20260222000000_initial_schools_profiles_students.sql):

| Column        | PG type     | TypeScript type |
| ------------- | ----------- | --------------- | ----- |
| id            | uuid        | `string`        |
| school_id     | uuid        | `string`        |
| first_name    | text        | `string`        |
| last_name     | text        | `string`        |
| date_of_birth | date        | `string         | null` |
| created_at    | timestamptz | `string`        |
| updated_at    | timestamptz | `string`        |

- Export interface `Student` with these fields (no `any`).
- Optional: add a Zod schema `studentSchema` for parsing API responses if you want runtime validation; .cursorrules require Zod for API responses, so including it is recommended.

---

## 2. API service (fetch logic)

Create **[features/attendance/api.ts](features/attendance/api.ts)**:

- **Function:** `fetchStudents(schoolId: string): Promise<Student[]>`.
- Use `getSupabase()` from [lib/supabase.ts](lib/supabase.ts).
- Query: `.from("students").select("*").eq("school_id", schoolId)`.
- Explicit return type `Promise<Student[]>`; on error, throw (or return a typed result object—no `any`).
- Parse/validate with Zod if you added `studentSchema` (e.g. `z.array(studentSchema).parse(data)` before returning).

No TanStack Query in this file—only the fetch function.

---

## 3. TanStack Query hook structure

Add a hook (e.g. in **features/attendance/hooks/useStudents.ts** or in **features/attendance/api.ts** as a named export):

- **Hook:** `useStudents(schoolId: string | null)`.
- Use `useQuery` from `@tanstack/react-query`.
- **Query key:** `["students", schoolId]` (per .cursorrules: include `schoolId` for cache busting).
- **Query function:** call `fetchStudents(schoolId!)` only when `schoolId` is non-null.
- **Options:** `enabled: schoolId != null` so the query does not run when there is no school (e.g. logged out or missing app_metadata).
- Return the full `useQuery` result (e.g. `{ data, isLoading, isError, error, refetch }`) with types inferred from `Student[]`.

Screen will get `schoolId` from `useAuthContext()` (or `useAuth()`), which already exposes `schoolId` from [features/auth/useAuth.ts](features/auth/useAuth.ts).

---

## 4. UI layout (Attendance List in index)

**[app/(tabs)/index.tsx](<app/(tabs)/index.tsx>)** should:

- Use **useAuthContext()** for `schoolId` and **useStudents(schoolId)** for the roster.
- **When no school:** show a short message (e.g. “No school assigned”) and keep Sign out.
- **When loading:** show a loading state (skeleton list or spinner) for the list area.
- **When error:** show an error message and optional retry.
- **When data:** render the attendance list.

**Forest School standard (high-contrast, outdoor):**

- **Container:** White background; list area full-width, readable in bright light.
- **Each row:** Minimum **60px height** (exceeds 44px touch target). One row per student.
- **Row content:** Student name (e.g. “Last, First” or “First Last”) in **Slate-900** text on **White**; optionally date of birth or a subtitle.
- **Check-In control:** High-contrast “Check-In” toggle or button per row (e.g. Slate-900 border/background with White text when checked, or a clear “Check In” button). Large touch target (e.g. min 44px height/width for the control).
- **Styling:** Prefer **NativeWind** (`className`) for layout and colors. The project has NativeWind in [package.json](package.json); if `tailwind.config.js` or the theme/ setup is missing, add minimal Tailwind/NativeWind config so that `className="bg-white"`, `className="text-slate-900"`, etc. work. Use `min-h-[60px]` for row height.
- **Accessibility:** `accessibilityLabel` and `accessibilityRole` on the Sign out button and on each Check-In control (e.g. “Check in River Green”, `button`).

**Layout sketch:**

```
+------------------------------------------+
| TAFS                          [Sign out] |
+------------------------------------------+
| Attendance                               |
|------------------------------------------|
| River Green                    [Check In]|  <- min 60px
| Sage Woods                    [Check In]|
| Brooks Stone                  [Check In]|
| ...                                      |
+------------------------------------------+
```

Check-In can be a toggle (Present / Absent) or a single “Check In” button that toggles state; the plan does not require persistence to the backend yet—UI-only state is fine unless you want to add an `attendance` table later.

---

## 5. Feature exports

Update **[features/attendance/index.ts](features/attendance/index.ts)** to re-export:

- `Student` (and Zod schema if present) from `./types`.
- `fetchStudents` from `./api`.
- `useStudents` from the chosen hooks file (or `./api`).

---

## 6. Dependency and config check

- **TanStack Query:** Already in use; [app/layout.tsx](app/_layout.tsx) wraps the app with `QueryClientProvider`.
- **NativeWind:** In package.json; ensure `tailwind.config.js` (and any `theme/` or `global.css` and Babel preset) exist so `className` works in React Native. If not, add minimal config and wire it in the Expo/Babel setup.

---

## Summary

| Deliverable        | Location                          |
| ------------------ | --------------------------------- |
| `Student` type     | features/attendance/types.ts      |
| `fetchStudents`    | features/attendance/api.ts        |
| `useStudents`      | features/attendance (hook or api) |
| Attendance list UI | app/(tabs)/index.tsx              |
| Re-exports         | features/attendance/index.ts      |

No `any`; explicit return types throughout; `school_id` filter in the API; query key includes `schoolId`; 60px rows and high-contrast Slate-900 on White with NativeWind.
