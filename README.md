## Development

- **Start the app (default)**:

```bash
npm run start
```

This uses `cross-env` to set `NODE_OPTIONS=--experimental-vm-modules` and runs `npx expo start`. This combination works around a Windows + Node 22 ESM quirk where absolute `C:\` paths can trigger `ERR_UNSUPPORTED_ESM_URL_SCHEME` inside tooling.

- **Platform-specific shortcuts**:

```bash
npm run android
npm run ios
npm run web
```

These scripts use the same `NODE_OPTIONS` behavior and are safe on Windows, macOS, and Linux.

- **Fallback loader script (if you still hit ESM errors)**:

```bash
npm run start:loader
```

This runs Expo via `node --loader tsx` with the same `NODE_OPTIONS` flag, giving you a more explicit control over how modules are loaded. Use this only if the default `npm run start` still surfaces ESM/URL issues with your local Node version.

