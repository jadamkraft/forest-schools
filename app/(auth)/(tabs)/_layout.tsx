import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuthContext } from "@/lib/AuthProvider";
import { useWaiverStatus } from "@/features/waivers/useWaiverStatus";

export default function TabsLayout(): React.ReactElement {
  const { session, schoolId, role, isLoading } = useAuthContext();

  const waiverStatus = useWaiverStatus(schoolId ?? null, session?.user.id ?? null);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" accessibilityLabel="Loading" />
      </View>
    );
  }

  if (waiverStatus.status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" accessibilityLabel="Checking waiver status" />
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

  const isGuardian = role === "guardian";

  if (waiverStatus.status === "needs-signature" && isGuardian) {
    return <Redirect href="/(auth)/waiver" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0f172a",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: "Announcements",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
});

