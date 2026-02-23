import { router } from "expo-router";
import { useAuthContext } from "../../lib/AuthProvider";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TabsIndexScreen(): React.ReactElement {
  const { signOut } = useAuthContext();

  const handleSignOut = (): void => {
    signOut().then(() => {
      router.replace("/login");
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TAFS</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleSignOut}
        accessibilityLabel="Sign out"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
