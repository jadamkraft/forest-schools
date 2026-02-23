---
name: tabs-layout-fix-and-attendance
overview: Fix the tabs layout type error, quiet non-blocking Expo doctor warnings, and verify that the attendance list is wired to the correct school for on-device testing.
todos:
  - id: fix-tabs-layout-ts2322
    content: Update `TabsLayout` in `app/(tabs)/_layout.tsx` so all branches return a React element (ActivityIndicator for loading, Redirect in a fragment for unauthenticated, Stack for authenticated).
    status: completed
  - id: update-app-json-install-exclude
    content: Modify `app.json` to add `expo.install.exclude` for react, react-dom, react-native-web, and @types/react to silence expo-doctor minor warnings.
    status: completed
  - id: verify-attendance-wiring
    content: Confirm `app/(tabs)/index.tsx` uses `useStudents(schoolId)` from `useAuthContext` and that this will load the 5 seeded TAFS students for the test account, then run TS build and Expo to ensure readiness for on-device testing.
    status: completed
isProject: false
---

## Tabs layout TS2322 fix

- **Goal**: Ensure `app/(tabs)/_layout.tsx` always returns a valid `React.ReactElement` and removes the `null` branch causing TS2322.
- **Approach**:
  - Update `TabsLayout` so that both the loading and unauthenticated states render elements instead of `null`.
  - For the **loading** state, return an `ActivityIndicator` wrapped in a fragment, e.g. a minimal full-screen container or centered spinner.
  - For the **unauthenticated** state, keep the redirect, but wrap `<Redirect href="/login" />` in a fragment as well so all branches return `React.ReactElement`.
  - Preserve the existing authenticated case where a `Stack` from `expo-router` is rendered, ensuring the function’s explicit return type remains `React.ReactElement`.

```16:23:app/(tabs)/_layout.tsx
return (
  <Stack
    screenOptions={{
      headerShown: true,
    }}
  />
);
```

- **Result**: TS2322 is resolved, and the layout cleanly handles loading vs. unauthenticated vs. authenticated states without ever returning `null`.

## Expo config: silence minor doctor warnings

- **Goal**: Add an `expo.install.exclude` section to `app.json` so `expo-doctor` ignores known minor version mismatches for React/web packages.
- **Approach**:
  - Extend the existing `expo` object in `app.json` with an `install` property.
  - Under `install`, add an `exclude` array including: `"react"`, `"react-dom"`, `"react-native-web"`, and `"@types/react"`.
  - Keep the rest of the config intact (name, slug, icons, plugins, etc.).

```1:32:app.json
{
  "expo": {
    "name": "my-app",
    "slug": "my-app",
    ...,
    "plugins": [
      "expo-router"
    ]
  }
}
```

- **Result**: `expo-doctor` no longer surfaces these specific version warnings, keeping the signal focused on issues that might actually impact runtime.

## Attendance tab wiring and readiness

- **Goal**: Confirm `app/(tabs)/index.tsx` is correctly using `useStudents` with the authenticated user’s `schoolId` so the 5 seeded TAFS students load for the test tenant.
- **Current wiring**:
  - The screen calls `useAuthContext()` to obtain `signOut` and `schoolId`.
  - It invokes `useStudents(schoolId)` from `features/attendance`, where the hook delegates to `fetchStudents(schoolId!)` and is disabled when `schoolId == null`.
  - The UI already handles `schoolId == null`, loading (`ActivityIndicator` + message), error (message + retry), and empty roster states.

```50:53:app/(tabs)/index.tsx
const { signOut, schoolId } = useAuthContext();
const { data: students, isLoading, isError, error, refetch } = useStudents(schoolId);
```

- **Verification steps (no code changes)**:
  - Double-check (via existing auth/seed setup) that the TAFS test account’s profile is associated with the seeded `school_id` used in `supabase/seed.sql`.
  - Run a TypeScript build and `expo start` to ensure no remaining type or runtime errors block launching the app.
  - Log in with the verified TAFS test account and navigate to the main tab to confirm that:
    - The header shows `TAFS`.
    - The attendance list populates with the 5 seeded students, each rendered via `StudentRow` with the check-in toggle.
    - Loading, error, and empty states behave as expected when simulated (e.g., by temporarily nulling `schoolId` or triggering a network issue).
- **Result**: The attendance tab is confirmed wired to the correct `schoolId` source and is ready for your final on-device validation of the 5 seeded students.
