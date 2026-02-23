import { Redirect } from "expo-router";
import { Stack } from "expo-router";
import { useAuthContext } from "../../lib/AuthProvider";

export default function TabsLayout(): React.ReactElement {
  const { session, isLoading } = useAuthContext();

  if (!isLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    />
  );
}
