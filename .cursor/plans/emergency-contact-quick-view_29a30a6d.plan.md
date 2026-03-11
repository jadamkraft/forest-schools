---
name: emergency-contact-quick-view
overview: Add a StudentEmergencyCard modal from the attendance list that shows high-contrast emergency details, medical alerts, and call actions for primary/secondary contacts while keeping the Zero-Any policy intact.
todos:
  - id: extend-student-schema
    content: Extend Student interface and studentSchema with optional emergency contact and medical_info fields using precise Zod types.
    status: pending
  - id: implement-student-emergency-card
    content: Create high-contrast StudentEmergencyCard component with medical alerts and primary/secondary call buttons.
    status: pending
  - id: wire-modal-from-attendance-list
    content: Update TabsIndexScreen and StudentRow so tapping the student name opens a bottom-aligned modal rendering StudentEmergencyCard while keeping the toggle behavior unchanged.
    status: pending
  - id: implement-call-helpers-and-ux-checks
    content: Add typed call helper(s), connect call buttons, and verify hit areas and visual contrast on the screen.
    status: pending
isProject: false
---

### Goal

Implement an Emergency Contact Quick-View triggered by tapping a student name in the attendance list, backed by typed student data (including emergency contacts and medical info), using a high-contrast modal UI with prominent medical alerts and call actions.

### 1. Extend student domain model & schema

- **Update Student interface** in `[features/attendance/types.ts](features/attendance/types.ts)`:
  - Add **optional, nullable, structured emergency contact fields**, for example:
    - `primary_contact_name?: string | null`
    - `primary_contact_phone?: string | null`
    - `secondary_contact_name?: string | null`
    - `secondary_contact_phone?: string | null`
    - `medical_info?: string | null`
  - Keep existing fields untouched and preserve the **Zero-Any Policy** (no `any`, keep explicit types).
- **Update `studentSchema` Zod definition** in the same file:
  - Add matching keys using `z.string().nullable().optional()` for each new field so parsing succeeds whether or not the DB columns exist yet.
  - This keeps `fetchStudents` working even if some or all of these fields are missing in the returned rows.
- **Confirm all usage sites** of `Student` (currently the attendance list) still type-check after the extension and do not assume the new fields are non-null.

### 2. Design & implement `StudentEmergencyCard` component

- **Create new component file** `[features/attendance/StudentEmergencyCard.tsx](features/attendance/StudentEmergencyCard.tsx)`.
- **Props**:
  - `student: Student` (from the attendance feature types).
  - `onClose: () => void` for closing the modal.
  - Optional `onCallPrimary?: (phone: string) => void` and `onCallSecondary?: (phone: string) => void` callbacks so calling behavior can be centralized in the screen, or handle `Linking.openURL` directly inside the card if we choose to keep it self-contained.
- **Layout & theme (max contrast)**:
  - Root container: `bg-white`, full-width card-style layout inside the modal/bottom sheet, with generous padding.
  - Typography: `text-slate-900` for all labels/values, clear hierarchy (`text-xl` for name, `text-base` for fields).
  - Include at minimum:
    - Student full name.
    - Primary contact (name + phone) if present.
    - Secondary contact (name + phone) if present.
    - Medical info section.
- **Medical alerts styling**:
  - If `student.medical_info` exists and is non-empty, render a clearly separated section near the top:
    - Label like "Medical Alerts" in **bold** `text-red-600`.
    - Content text in `text-red-600`, optionally slightly larger or bold to stand out.
    - Consider a subtle icon (e.g. `Ionicons` alert/medical icon) aligned left to reinforce importance.
- **Call actions**:
  - Render **separate Call buttons** for primary and secondary contacts when their phone numbers exist.
  - Use `TouchableOpacity` with at least `min-h-[60px]` and `min-w-[44px]`, centered label, and clear border (`border-2 border-slate-900`) and high-contrast text (`text-slate-900` on `bg-white` or inverted when active).
  - Button labels like `Call Primary` / `Call Secondary` (or include the contact name if present).
  - Wire buttons to either:
    - Call provided callbacks with the phone string, or
    - Directly call `Linking.openURL(` tel:${normalizedPhone} `)` with basic normalization of the phone string.
  - Add accessibility labels like `Call primary contact for {studentName}`.

### 3. Add modal/bottom sheet behavior to `TabsIndexScreen`

- **State management** in `[app/(tabs)/index.tsx](app/(tabs)/index.tsx)`:
  - Introduce state for the currently selected student, e.g. `const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);`.
  - Derive a boolean `isEmergencyCardOpen = selectedStudent != null`.
- **Wire name press to open modal**:
  - In `StudentRow`, separate interactions so that:
    - The **toggle button** on the right continues to handle attendance logging exactly as now.
    - The **student name area** becomes pressable and does **not** trigger the attendance toggle.
  - Implementation details:
    - Wrap the name `Text` in a `TouchableOpacity` with `onPress` calling a new `onPressStudent` callback passed from the parent.
    - Keep the surrounding row `View` with `min-h-[60px]` and layout unchanged to preserve existing hit-area guarantees.
  - Update `StudentRow` props to include `onPressStudent: (student: Student) => void`, and in the `ScrollView` map, pass a handler that sets `selectedStudent` in `TabsIndexScreen`.
- **Render modal / bottom sheet**:
  - Use React Native's built-in `Modal` from `react-native` for simplicity and reliability.
  - Configure it as a **bottom sheet–like modal** by:
    - Setting `transparent` and using a semi-opaque dark backdrop `bg-black/40`.
    - Positioning the card in a bottom-aligned container with rounded top corners and safe-area padding.
  - Inside the modal, render `StudentEmergencyCard` with the `selectedStudent` and `onClose` that clears `selectedStudent`.
  - Add backdrop tap and possibly a close button (e.g. "Done" or an `X` icon) to dismiss the modal without affecting attendance state.

### 4. Implement call behavior and safety checks

- **Call utilities**:
  - Implement a small helper in `TabsIndexScreen` or a tiny shared utility (e.g. `callPhoneNumber(phone: string): Promise<void>`) that:
    - Trims the phone string and strips obvious spaces.
    - Guards against empty/invalid input (no-op or shows a basic alert if `phone` is falsy).
    - Uses `Linking.openURL` with `tel:` scheme; handle rejections with a `console.error` and optional user-friendly message.
  - Ensure the helper and all call sites are fully typed (`phone: string`) and avoid `any`.
- **Wire buttons to helper**:
  - If callbacks are passed into `StudentEmergencyCard`, implement `onCallPrimary` / `onCallSecondary` in `TabsIndexScreen` using the helper.
  - Alternatively, if the card owns the behavior, have it import `Linking` directly and keep the logic in one place.
  - In both cases, guard rendering of buttons so they only appear when a non-empty phone string is present.

### 5. Type-safety, lints, and UX verification

- **Zero-Any enforcement**:
  - Ensure all new code (props, state, helpers) uses explicit interfaces or inferred generics with no `any` usage.
  - Keep Zod schemas strictly typed with unions/literals for any future status-like values and `nullable().optional()` for the new string fields.
- **UX checks**:
  - Verify the row still has at least `min-h-[60px]` and that both the name and toggle remain easily tappable on device.
  - Confirm the modal uses white background with Slate-900 text everywhere except the red medical alert region.
  - Ensure the call buttons have at least `min-h-[60px]` and clear focus/press feedback.

### 6. Data-flow sketch

```mermaid
flowchart TD
  teacher[TeacherTapsStudentName] --> openModal[Set selectedStudent]
  openModal --> modalVisible[EmergencyCardModalVisible]
  modalVisible --> card[StudentEmergencyCard]
  card --> medicalAlert[ShowMedicalAlertsIfPresent]
  card --> primaryCall[PrimaryCallButton]
  card --> secondaryCall[SecondaryCallButton]
  primaryCall --> callHelper[callPhoneNumber()]
  secondaryCall --> callHelper
```
