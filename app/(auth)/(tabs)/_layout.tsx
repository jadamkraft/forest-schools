import React from "react";
import { Redirect, Tabs, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuthContext } from "@/lib/AuthProvider";
import { useWaiverStatus } from "@/features/waivers/useWaiverStatus";

export default function TabsLayout(): React.ReactElement {
  const { session, schoolId, role, isLoading, isRoleLoading, roleError } = useAuthContext();
  const segments = useSegments();

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

  const roleHomeHref = isStaff ? "/(auth)/(tabs)/calendar" : "/(auth)/(tabs)";
  const tabsSegmentIndex = segments.indexOf("(tabs)");
  const activeTopSegment = tabsSegmentIndex >= 0 ? (segments[tabsSegmentIndex + 1] ?? "index") : "index";
  const allowedTopSegments = isGuardian
    ? new Set(["index", "calendar", "family", "announcements"])
    : isStaff
      ? new Set(["calendar", "announcements"])
      : new Set(["index", "calendar", "admin", "announcements"]);

  if (waiverStatus.status === "needs-signature" && isGuardian) {
    return <Redirect href="/(auth)/waiver" />;
  }

  if (!allowedTopSegments.has(activeTopSegment)) {
    return <Redirect href={roleHomeHref} />;
  }

  if (isStaff && activeTopSegment === "index") {
    return <Redirect href={roleHomeHref} />;
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
      {(isAdmin || isGuardian) && (
        <Tabs.Screen
          name="index"
          options={{
            title: isAdmin ? "Dashboard" : "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={isAdmin ? "grid-outline" : "home-outline"} size={size ?? 22} color={color} />
            ),
          }}
        />
      )}
      {(isAdmin || isGuardian || isStaff) && (
        <Tabs.Screen
          name="calendar"
          options={{
            title: isStaff ? "Home" : isAdmin ? "Roster" : "Calendar",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size ?? 22} color={color} />
            ),
          }}
        />
      )}
      {isGuardian && (
        <Tabs.Screen
          name="family/students"
          options={{
            title: "Students",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size ?? 22} color={color} />
            ),
          }}
        />
      )}
      {isAdmin && (
        <Tabs.Screen
          name="admin/attendance-alerts"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning-outline" size={size ?? 22} color={color} />
            ),
          }}
        />
      )}
      {(isAdmin || isGuardian || isStaff) && (
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
      <Tabs.Screen name="announcements/admin-create" options={{ href: null }} />
      <Tabs.Screen name="admin/roster-overview" options={{ href: null }} />
      {!isGuardian && <Tabs.Screen name="family/students" options={{ href: null }} />}
      {!isAdmin && <Tabs.Screen name="admin/attendance-alerts" options={{ href: null }} />}
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

