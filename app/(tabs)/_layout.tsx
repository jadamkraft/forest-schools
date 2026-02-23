import { Redirect } from "expo-router";
import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuthContext } from "../../lib/AuthProvider";

export default function TabsLayout(): React.ReactElement {
  const { session, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" accessibilityLabel="Loading" />
      </View>
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
        headerShown: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
