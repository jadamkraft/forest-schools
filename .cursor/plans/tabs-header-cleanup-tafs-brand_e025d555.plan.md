---
name: tabs-header-cleanup-tafs-brand
overview: Hide auto-generated Expo Router headers for the tabs layout and implement a custom TAFS-branded header row with icon-only logout and proper spacing for the Attendance screen.
todos:
  - id: hide-stack-headers
    content: "Set `headerShown: false` on the tabs layout Stack to remove auto-generated headers"
    status: completed
  - id: implement-tafs-brand-header
    content: Refine the TAFS header row in tabs index with bold text and icon-only logout action
    status: completed
  - id: adjust-attendance-spacing
    content: Increase spacing between the TAFS header and Attendance title for better hierarchy
    status: completed
  - id: verify-ui-behavior
    content: Run and visually verify that `(tabs)`/`index` labels are gone and the new header behaves correctly
    status: completed
isProject: false
---

### Goals

- **Hide internal Expo Router headers** so `(tabs)` / `index` labels do not appear.
- **Introduce a custom TAFS brand header row** on the tabs index screen with a bold logo text and icon-only logout action.
- **Polish spacing** around the `Attendance` title so it feels comfortably separated from the header.
- **Respect UX constraints**: Slate-900 on white, no `any` types, and 44px minimum touch target for the logout icon.

### Plan

- **1. Tabs layout header cleanup**
  - Update `[app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx)` `Stack` configuration to hide the auto-generated headers by default.
  - Use `screenOptions={{ headerShown: false }}` at the `Stack` level so no `(tabs)` or `index` route names render as headers.
  - Confirm there are no per-screen overrides that would re-enable headers inside this layout; if any exist later, ensure they are removed or aligned with the custom header approach.
- **2. TAFS brand header row structure**
  - Keep the main screen component in `[app/(tabs)/index.tsx](app/(tabs)/index.tsx)` as the root of the Attendance experience.
  - Replace the existing top bar `View` + text button with a cleaner header row:
    - Left: `Text` "TAFS" with `text-xl`, `font-bold` (or `font-semibold` if that’s your preferred system weight), and `text-slate-900`.
    - Right: a `TouchableOpacity` containing only a logout icon component from `@expo/vector-icons` (e.g., `Ionicons` `log-out-outline` or `MaterialIcons` `logout`).
  - Ensure the header row uses `className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-200"` to match the current style with clear horizontal padding and center alignment.
- **3. Logout icon UX and accessibility**
  - Import the chosen icon set (e.g., `import { Ionicons } from "@expo/vector-icons";`) at the top of `[app/(tabs)/index.tsx](app/(tabs)/index.tsx)`.
  - Configure the logout `TouchableOpacity` to:
    - Maintain `min-h-[44px] min-w-[44px] items-center justify-center rounded-full` (or subtle rounded square) to preserve at least a 44px touch target.
    - Use background `bg-white` or a very subtle `bg-slate-100` while keeping the icon itself `text-slate-900` for a less aggressive call-to-action.
    - Set `accessibilityLabel="Sign out"` and `accessibilityRole="button"` as currently, so assistive technologies remain supported.
  - Render the icon at an appropriate size (e.g., 22–24) to balance visual weight against the TAFS text while keeping the control visually lightweight.
- **4. Attendance title spacing and visual hierarchy**
  - Adjust the container below the header in `[app/(tabs)/index.tsx](app/(tabs)/index.tsx)` so that the `Attendance` title has more breathing room from the brand header.
  - For example, keep `px-4` but increase top padding on the content container (`pt-5`/`pt-6` instead of `pt-4`) and make the title `Text` margin-top slightly larger (e.g., `mb-4` instead of `mb-3`).
  - Verify that on small devices the header + title remain visually balanced and that the scrollable roster still has sufficient vertical space.
- **5. Type safety and style consistency**
  - Avoid introducing any `any` types; the current components already use explicit return types (`React.ReactElement`) and typed props like `Student` and should be maintained.
  - Keep colors limited to `text-slate-900`, `bg-white`, and subtle Slate border shades that are already used so the scheme remains consistent.
  - If any new helper components or functions are introduced (not strictly required here), give them explicit prop typings.
- **6. Manual verification checklist (final audit)**
  - Run the app and navigate to the Attendance/tabs index screen.
  - Confirm:
    - **No `(tabs)` or `index` labels** appear in the system header area.
    - The custom TAFS header row is visible with bold "TAFS" on the left and an icon-only logout action on the right.
    - Tapping the icon triggers the existing `handleSignOut` logic and still routes to `/login` as before.
    - The logout icon button visually appears at least 44x44 and feels comfortably tappable.
    - The `Attendance` title has adequate breathing room relative to the brand header and maintains the Slate-900 on white visual system.
