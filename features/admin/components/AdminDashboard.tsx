import React, { useCallback } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthContext } from "@/lib/AuthProvider";

export function AdminDashboard(): React.ReactElement {
  const { signOut } = useAuthContext();

  const handleSignOut = useCallback((): void => {
    signOut().then(() => router.replace("/login"));
  }, [signOut]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
        <View>
          <Text className="text-2xl font-bold text-slate-900">Hello Admin</Text>
          <Text className="mt-1 text-base text-slate-700">
            Review today&apos;s roster and school activity.
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white"
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4 pt-6">
        <TouchableOpacity
          className="mb-4 min-h-[60px] flex-row items-center justify-between rounded-xl border-2 border-slate-900 bg-white px-4"
          accessibilityRole="button"
          accessibilityLabel="View roster overview"
        >
          <View className="flex-1 pr-2">
            <Text className="text-lg font-semibold text-slate-900">Roster overview</Text>
            <Text className="mt-1 text-sm text-slate-700">
              See classes and student counts across your school.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 min-h-[60px] flex-row items-center justify-between rounded-xl border-2 border-slate-900 bg-white px-4"
          accessibilityRole="button"
          accessibilityLabel="Review attendance alerts"
        >
          <View className="flex-1 pr-2">
            <Text className="text-lg font-semibold text-slate-900">Attendance alerts</Text>
            <Text className="mt-1 text-sm text-slate-700">
              Quickly scan late or missing check-ins.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="min-h-[60px] flex-row items-center justify-between rounded-xl border-2 border-slate-900 bg-white px-4"
          accessibilityRole="button"
          accessibilityLabel="Announcements"
          onPress={() => router.push("/(auth)/(tabs)/announcements")}
        >
          <View className="flex-1 pr-2">
            <Text className="text-lg font-semibold text-slate-900">Announcements</Text>
            <Text className="mt-1 text-sm text-slate-700">
              Draft and review messages for staff and families.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

