import { Stack } from "expo-router";

export default function CalendarLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#0f172a",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Calendar" }} />
      <Stack.Screen name="[classId]" options={{ title: "Class" }} />
    </Stack>
  );
}

