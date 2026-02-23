---
name: React Version Fix and TabsLayout UI
overview: Fix critical React version mismatch (19.2.4 vs 19.1.0) causing crash, remove deprecated Babel plugin, implement centered TabsLayout loading UI, and verify multi-tenant schoolId wiring.
todos:
  - id: version-fix
    content: Pin react, react-dom, @types/react to "19.1.0" in package.json (no ^ or ~)
    status: completed
  - id: babel-cleanup
    content: Remove deprecated "expo-router/babel" from babel.config.js plugins
    status: completed
  - id: tabslayout-ui
    content: Refactor app/(tabs)/_layout.tsx with centered View, flex:1, backgroundColor
    status: completed
  - id: multi-tenant-check
    content: Verify app/(tabs)/index.tsx receives schoolId from useAuthContext for TAFS students
    status: completed
  - id: npm-install
    content: Run npm install --prefer-offline --legacy-peer-deps to reconcile
    status: completed
isProject: false
---

# React Version Fix and TabsLayout UI Plan

**Context**: Critical React version mismatch (19.2.4 vs 19.1.0) is causing a crash. TabsLayout loading UI needs improvement. Babel emits deprecated plugin warnings.

**Execution**: Code changes below require your approval before implementation.

---

## 1. Version Fix (Priority 1)

**Goal**: Resolve React version mismatch by strictly pinning to 19.1.0. No `^` or `~` symbols.

**File**: [package.json](package.json)

**Current**:

```json
"react": "19.2.4",
"react-dom": "19.2.4",
"@types/react": "~19.2.4"
```

**Change to**:

```json
"react": "19.1.0",
"react-dom": "19.1.0",
"@types/react": "19.1.0"
```

---

## 2. Babel Cleanup

**Goal**: Remove deprecated `expo-router/babel` plugin to silence bundler warnings.

**File**: [babel.config.js](babel.config.js)

**Current**:

```js
plugins: [require.resolve("expo-router/babel")],
```

**Change to**:

```js
plugins: [],
```

Expo Router v6+ no longer requires this plugin; the preset handles routing.

---

## 3. TabsLayout Loading UI

**Goal**: Wrap `ActivityIndicator` in a centered full-screen `View` with `flex: 1`, `backgroundColor: "#f5f5f5"`, and `accessibilityLabel="Loading"`.

**File**: [app/(tabs)/layout.tsx](<app/(tabs)/_layout.tsx>)

**Current loading branch**:

```tsx
if (isLoading) {
  return (
    <>
      <ActivityIndicator size="large" />
    </>
  );
}
```

**Change to**:

```tsx
// Add View and StyleSheet to imports
import { ActivityIndicator, StyleSheet, View } from "react-native";

if (isLoading) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" accessibilityLabel="Loading" />
    </View>
  );
}

// Add at end of file:
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
```

---

## 4. Multi-Tenant Check (Verification)

**Goal**: Confirm `app/(tabs)/index.tsx` correctly receives `schoolId` for the 5 seeded TAFS students.

**Data flow**:

- `useAuthContext()` returns `AuthState` from [lib/AuthProvider.tsx](lib/AuthProvider.tsx)
- `AuthState` includes `schoolId: string | null` from [features/auth/types.ts](features/auth/types.ts)
- `useAuth()` derives `schoolId` via `getSchoolIdFromSession(session)` in [features/auth/useAuth.ts](features/auth/useAuth.ts)
- `app/(tabs)/index.tsx` line 51: `const { signOut, schoolId } = useAuthContext();`
- Line 52: `useStudents(schoolId)` fetches students for that school

**Status**: Wiring is correct. No code changes needed. After version fix and `npm install`, verify on device that TAFS test account loads the 5 seeded students.

---

## 5. Post-Change Steps

1. Apply code changes (package.json, babel.config.js, layout.tsx).
2. Run: `npm install --prefer-offline --legacy-peer-deps`
3. Run `npx expo start` and confirm no crash.
4. Log in with TAFS test account and confirm attendance list shows 5 students.

---

## Summary

| Task          | File                  | Action                                             |
| ------------- | --------------------- | -------------------------------------------------- |
| Version fix   | package.json          | Pin react, react-dom, @types/react to "19.1.0"     |
| Babel cleanup | babel.config.js       | Remove `expo-router/babel` from plugins            |
| TabsLayout UI | app/(tabs)/layout.tsx | Centered View, flex:1, #f5f5f5, accessibilityLabel |
| Multi-tenant  | app/(tabs)/index.tsx  | Verify only (no changes)                           |
| Reconcile     | —                     | `npm install --prefer-offline --legacy-peer-deps`  |
