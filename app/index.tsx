import { Redirect } from "expo-router";
import { useAuthContext } from "../lib/AuthProvider";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function IndexScreen(): React.ReactElement {
  const { session, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" accessibilityLabel="Loading" />
      </View>
    );
  }
  if (session) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
