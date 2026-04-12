import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuthContext } from "@/lib/AuthProvider";
import { useWaiverStatus } from "@/features/waivers/useWaiverStatus";

export default function TabsLayout(): React.ReactElement {
  const { session, schoolId, role, isLoading, isRoleLoading, roleError } = useAuthContext();

  const skipWaiverFetch =
    session != null && !isRoleLoading && (role === "admin" || role === "staff");

  const waiverStatus = useWaiverStatus(schoolId ?? null, session?.user.id ?? null, {
    skipFetch: skipWaiverFetch,
  });

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

  if (isRoleLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" accessibilityLabel="Loading profile" />
      </View>
    );
  }

  if (role === null) {
    return (
      <View style={styles.roleError}>
        <Text style={styles.roleErrorTitle}>Account setup incomplete</Text>
        <Text style={styles.roleErrorBody}>
          {roleError ?? "We could not determine your role for this school. Please contact support."}
        </Text>
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

  const isGuardian = role === "guardian";
  const isAdmin = role === "admin";
  const isStaff = role === "staff";

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
      {(isAdmin || isStaff) && (
        <Tabs.Screen
          name="index"
          options={{
            title: "Attendance",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkbox-outline" size={size ?? 22} color={color} />
            ),
          }}
        />
      )}
      {(isAdmin || isGuardian || isStaff) && (
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size ?? 22} color={color} />
            ),
          }}
        />
      )}
      {(isAdmin || isGuardian) && (
        <Tabs.Screen
          name="announcements"
          options={{
            title: "Announcements",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="megaphone-outline" size={size ?? 22} color={color} />
            ),
          }}
        />
      )}
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
  roleError: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  roleErrorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },
  roleErrorBody: {
    fontSize: 15,
    color: "#0f172a",
    textAlign: "center",
    lineHeight: 22,
  },
});

