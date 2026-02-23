---
name: expo-54-version-alignment
overview: Align React/React DOM/Expo versions for Expo SDK 54, resolve npm ERESOLVE conflicts when installing babel-preset-expo and expo-router, and validate Babel/TypeScript configuration for Expo Router v4 and NativeWind without breaking existing auth/attendance types.
todos:
  - id: update-package-json-versions
    content: Align react, react-dom, react-native-web, and @types/react versions in package.json for Expo SDK 54 and expo-router v6.0.23.
    status: pending
  - id: adjust-babel-config
    content: Update babel.config.js to keep NativeWind support and add expo-router/babel plugin.
    status: pending
  - id: clean-and-reinstall-deps
    content: Remove node_modules and package-lock.json, reinstall dependencies with npm and Expo CLI, and run expo-doctor.
    status: pending
  - id: run-typescript-checks
    content: Run TypeScript checks (tsc --noEmit) to ensure useAuth and Attendance features remain fully typed with no implicit anys.
    status: pending
isProject: false
---

### Goal

Reconcile `package.json` and project configuration so that Expo SDK 54, React 19, React DOM, Expo Router v4, and NativeWind all have compatible versions, avoiding npm ERESOLVE errors while preserving strict TypeScript types for `useAuth` and Attendance features.

### 1. Analyze current dependency set and ERESOLVE cause

- **Inspect current versions**: Confirm the currently pinned versions:
  - `expo`: `~54.0.33`
  - `react`: `19.1.0`
  - `react-native`: `0.81.5`
  - `expo-router`: `~6.0.23`
  - `babel-preset-expo`: `~54.0.10`
  - `@types/react`: `~19.1.0`
- **Identify missing peers**: Note that `react-dom` and `react-native-web` are not present in `dependencies`, even though `expo-router` declares them as peers and Expo 54 supports DOM rendering.
- **Root cause explanation**:
  - `expo-router@6.0.23` depends on `react-server-dom-webpack` with a peer range `~19.0.4 || ~19.1.5 || ~19.2.4`.
  - Your app pins `react@19.1.0`, which does **not** satisfy the `~19.1.5` range (requires at least 19.1.5) and leads npm to try to resolve a conflicting `react@19.2.4` tree, triggering an ERESOLVE conflict during `babel-preset-expo` / router installation.
  - Missing explicit `react-dom` also lets npm resolve a separate `react-dom@19.2.4` tree for web/DOM packages, further contributing to version divergence.

### 2. Target version alignment for Expo SDK 54

- **Keep Expo core aligned to SDK 54**:
  - Keep `expo` at `~54.0.33` (already SDK 54-compatible).
  - Keep `react-native` at `0.81.5` (matches Expo 54 baseline).
- **Choose a stable React 19 variant compatible with Expo 54**:
  - Bump `react` from `19.1.0` to `**19.1.5` to satisfy `react-server-dom-webpack`’s `~19.1.5` peer range while staying within the React 19.1 minor that Expo 54 is built and tested against.
- **Align React DOM and DOM tooling**:
  - Add `react-dom` pinned to `**19.1.5` so web and DOM packages share the same React minor/patch as native.
  - Add `react-native-web` using Expo’s recommended version for SDK 54 via `npx expo install react-native-web` (this will write a compatible version to `package.json` rather than guessing it manually).
  - Ensure `@expo/metro-runtime` is either already present via Expo Router or installed implicitly; no direct `package.json` change is required if Expo Router already brings it.
- **Align TypeScript React types**:
  - Update `@types/react` from `~19.1.0` to `**~19.1.5` (or the nearest published patch matching `react@19.1.5`) so the TS surface remains strictly in sync with the React runtime.

### 3. Concrete `package.json` edits (proposed)

- **Dependencies** section:
  - **Change** `"react": "19.1.0"` → `**"react": "19.1.5"`.
  - **Add** `"react-dom": "19.1.5"`.
  - **Add** `"react-native-web": "<version chosen by Expo CLI for SDK 54>"` (we’ll obtain this by running `npx expo install react-native-web`, which will update `package.json` for us after you approve the plan).
  - Keep:
    - `"expo": "~54.0.33"`
    - `"babel-preset-expo": "~54.0.10"`
    - `"expo-router": "~6.0.23"`
    - `"expo-constants": "~18.0.13"`, `"expo-linking": "~8.0.11"`, `"react-native-safe-area-context": "~5.6.0"`, `"react-native-screens": "~4.16.0"` (these already satisfy `expo-router` peers for SDK 54).
- **DevDependencies** section:
  - **Change** `"@types/react": "~19.1.0"` → `**"@types/react": "~19.1.5"` (or the closest published patch corresponding to the chosen React version).
  - Keep `typescript` at `~5.9.2` (fully compatible with React 19 types and your existing TS setup).

### 4. Babel configuration for Expo Router v4 + NativeWind

- **Current config** in `[babel.config.js](babel.config.js)`:

```3:8:babel.config.js
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
```

- **Issues / gaps**:
  - This config correctly enables Expo + NativeWind, but it does **not** include the `expo-router` Babel plugin that Expo Router v4+ expects (`expo-router/babel`).
  - Without the router plugin, some advanced routing features (e.g., static optimization, server components integration) may not be transformed correctly.
- **Proposed final config** (conceptual, for when we exit plan mode):

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [require.resolve("expo-router/babel")],
  };
};
```

- This keeps NativeWind’s JSX handling intact while explicitly adding the Expo Router Babel plugin in the recommended way.

### 5. Type safety check for `useAuth` and Attendance features

- **Current `useAuth` types** in `[features/auth/types.ts](features/auth/types.ts)` and `[features/auth/useAuth.ts](features/auth/useAuth.ts)`:
  - `AuthState` is fully typed using concrete `Session` types from `@supabase/supabase-js` and does not use `any`.
  - `useAuth` uses `useState<Session | null>`, `useState<boolean>`, and strongly typed `signIn`/`signOut` signatures, all tied to React’s type definitions.
- **Attendance feature** in `[features/attendance/index.ts](features/attendance/index.ts)`:
  - Re-exports `Student`, `StudentSchema`, `studentSchema`, and typed data-access helpers, with no `any` usage.
- **Impact of version changes**:
  - Bumping `react` and `@types/react` from 19.1.0 → 19.1.5 is a patch-level change and will not alter the fundamental types used by `useAuth` or Attendance.
  - We will run `tsc --noEmit` after dependency alignment to ensure that no new type errors are introduced and confirm continued zero-`any` status for these critical areas.

### 6. Clean reinstall strategy (npm-only, as requested)

After you approve the above version alignment, the concrete reinstall sequence will be:

1. **Clean existing install artifacts** (from the project root):

- Delete `node_modules/`.
- Delete `package-lock.json`.

1. **Reinstall with Expo-guided versions**:

- Run `npm install` once to hydrate dependencies according to the updated `package.json` (React 19.1.5, React DOM, etc.).
- Run `npx expo install react-native-web react-dom --fix` to:
  - Ensure `react-native-web` and `react-dom` versions are exactly those supported by Expo SDK 54.
  - Let Expo’s installer reconcile any lingering React/React Native version mismatches.

1. **Verify**:

- Run `npx expo-doctor` to confirm all Expo/React/React Native/React DOM peer dependencies are satisfied.
- Run `npm run typecheck` (or `npx tsc --noEmit`) to ensure that `useAuth`, Attendance, and other TypeScript code remain free of `any` regressions.

### 7. Summary of requested approvals

Before executing changes, please confirm you’re happy with:

- **React alignment**: `react@19.1.5`, `react-dom@19.1.5`, and `@types/react@~19.1.5` as the chosen “most stable” React 19 variant for Expo SDK 54.
- **Expo/Router alignment**: Keeping `expo@~54.0.33`, `expo-router@~6.0.23`, and existing Expo native deps as-is.
- **Babel config**: Adding `plugins: [require.resolve("expo-router/babel")]` alongside the existing `babel-preset-expo` + `nativewind/babel` presets.
- **Reinstall flow**: Cleaning `node_modules`/`package-lock.json`, then reinstalling via `npm install` + `npx expo install react-native-web react-dom --fix`, followed by `npx expo-doctor` and TypeScript checks.
