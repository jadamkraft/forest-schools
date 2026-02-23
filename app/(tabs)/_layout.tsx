import { Redirect } from "expo-router";
import { Stack } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useAuthContext } from "../../lib/AuthProvider";

export default function TabsLayout(): React.ReactElement {
  const { session, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <>
        <ActivityIndicator size="large" />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Redirect href="/login" />
      </>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    />
  );
}
