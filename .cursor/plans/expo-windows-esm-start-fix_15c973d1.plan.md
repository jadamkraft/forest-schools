---
name: expo-windows-esm-start-fix
overview: Update the Expo start command to work reliably with Node 22 and Windows ESM path handling, without removing module support or breaking the unified mobile build flow.
todos:
  - id: add-cross-env
    content: Add cross-env as a devDependency in package.json for cross-platform env variable handling.
    status: completed
  - id: update-start-script
    content: Change the main npm start script to use cross-env, NODE_OPTIONS, npx expo, and an explicit --config ./metro.config.cjs path.
    status: completed
  - id: update-platform-scripts
    content: Update android/ios/web scripts to mirror the new start invocation with cross-env, NODE_OPTIONS, and explicit Metro config.
    status: completed
  - id: add-loader-fallback-script
    content: Add an optional start:loader script that uses node --loader (e.g., tsx) to run Expo with the same metro config as a more robust Node 22 workaround.
    status: completed
  - id: verify-dev-and-build-flows
    content: Test npm run start and platform scripts on Windows and non-Windows, and confirm the unified mobile build process is compatible with or updated to use the new scripts.
    status: completed
  - id: doc-windows-esm-note
    content: Document the Windows Node 22 ESM URL issue and the new start behavior in the README for future contributors.
    status: completed
isProject: false
---

## Goal

Ensure `expo start` works on Windows (Node 22) without `ERR_UNSUPPORTED_ESM_URL_SCHEME`, by explicitly controlling how the Metro config is loaded and passing only safe, cross-platform paths/flags, while preserving any current or future ESM usage.

## Current Findings

- **Project config**: `package.json` currently has no `"type": "module"`; it is a standard CommonJS package.
- **Start scripts**: `package.json` defines:
  - `"start": "expo start"`
  - `"android": "expo start --android"`
  - `"ios": "expo start --ios"`
  - `"web": "expo start --web"`
- **Metro config**: The Metro configuration exists as `[metro.config.cjs](metro.config.cjs)`:

```1:5:metro.config.cjs
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

- **Implication**: The error is likely coming from Node 22’s stricter ESM URL handling inside Expo/Metro tooling when resolving Windows `C:\...` paths, not from this app declaring itself as `type: module`.

## High-Level Approach

- **Keep CommonJS by default**: Do not add/remove `"type": "module"`; instead, fix how we invoke Expo.
- **Force a safe config path**: Always pass `--config ./metro.config.cjs` (relative path) so the CLI and any internal ESM helpers don’t try to interpret a bare `c:` path as a URL.
- **Use `cross-env` + `NODE_OPTIONS`**: Wrap the `expo` invocation with `cross-env` and, if necessary, set `NODE_OPTIONS` to relax/adjust ESM behavior in Node 22 in a way that’s compatible across platforms.
- **Keep unified build compatibility**: Restrict changes to the `start`-family dev scripts so CI/EAS build commands (if any) remain unaffected unless they rely on `npm run start`.

## Concrete Changes to Implement

- **1. Add `cross-env` as a dev dependency**
  - Add `"cross-env": "^7.x"` (or current stable) to `devDependencies` in `package.json`.
  - This ensures we can set `NODE_OPTIONS` and any future environment flags in a cross-platform way (Windows + POSIX).
- **2. Update the main `start` script to use explicit config + NODE_OPTIONS**
  - Replace the current `"start": "expo start"` with a safer, explicit script along the lines of:
    - `"start": "cross-env NODE_OPTIONS=\"--experimental-vm-modules\" npx expo start --config ./metro.config.cjs"`
  - Rationale:
    - `npx expo start` ensures we’re using the local Expo CLI.
    - `--config ./metro.config.cjs` avoids absolute Windows paths being passed through as raw strings.
    - `NODE_OPTIONS="--experimental-vm-modules"` (or a similar flag we settle on) can work around strict ESM/module resolution behavior in Node 22 without changing package type.
- **3. Mirror the change for platform-specific scripts**
  - Update:
    - `"android": "cross-env NODE_OPTIONS=\"--experimental-vm-modules\" npx expo start --android --config ./metro.config.cjs"`
    - `"ios": "cross-env NODE_OPTIONS=\"--experimental-vm-modules\" npx expo start --ios --config ./metro.config.cjs"`
    - `"web": "cross-env NODE_OPTIONS=\"--experimental-vm-modules\" npx expo start --web --config ./metro.config.cjs"`
  - This keeps behavior consistent between `npm run start` and platform shortcuts, and ensures Windows sees the same safe invocation everywhere.
- **4. Provide an alternate `start` script using `node --loader` as a fallback/workaround**
  - Add an additional script that you can use (or wire into CI) if Node 22’s behavior still causes issues:
    - Example: `"start:loader": "cross-env NODE_OPTIONS=\"--experimental-vm-modules\" node --loader tsx node_modules/.bin/expo start --config ./metro.config.cjs"`
  - This explicitly runs Expo under `node --loader` with `tsx` (or another loader you prefer) so that all imports/ESM behavior are under a known, controlled loader rather than Node’s default.
  - This script is optional and can be used only on environments that exhibit the `ERR_UNSUPPORTED_ESM_URL_SCHEME` error.
- **5. Verify local dev + unified mobile build flows**
  - **Local dev checks**:
    - On Windows: run `npm run start`, verify that the bundler starts without `ERR_UNSUPPORTED_ESM_URL_SCHEME` and Metro uses `metro.config.cjs` correctly.
    - On non-Windows (macOS/Linux): run `npm run start` and a platform script (e.g. `npm run ios`) to confirm there are no regressions.
  - **Unified mobile app pipeline**:
    - Identify how builds are triggered (e.g. `eas build`, `npx expo export`, or a custom script).
    - Ensure those commands do **not** rely on the old `"start": "expo start"` behavior; if they do, update them to use the new `start` (or `start:loader`) script as appropriate.
    - Confirm that CI/build agents on non-Windows remain unaffected, or, if they use Node 22 on Windows, switch them to `start:loader`.
- **6. Document the behavior and Windows note**
  - Add a short section to the project README explaining:
    - The Windows/Node 22 ESM URL issue.
    - That `npm run start` now explicitly passes `--config ./metro.config.cjs` and may set `NODE_OPTIONS` to keep behavior stable.
    - How and when to use the alternative `start:loader` script if someone still encounters `ERR_UNSUPPORTED_ESM_URL_SCHEME`.

## Result

After these changes, `npm run start` (and `android`/`ios`/`web`) should:

- Work on Windows with Node 22 without triggering `ERR_UNSUPPORTED_ESM_URL_SCHEME`.
- Continue to work on macOS/Linux, since `cross-env` and `npx expo` are cross-platform.
- Avoid touching `"type": "module"` so any future ESM usage is preserved.
- Remain compatible with the unified mobile app build process, which can opt into the same scripts or a more explicit `node --loader` entry point if needed.
