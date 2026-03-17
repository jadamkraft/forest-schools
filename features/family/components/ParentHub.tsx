import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export function ParentHub(): React.ReactElement {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="border-b border-slate-200 bg-white px-4 py-4">
        <Text className="text-2xl font-bold text-slate-900">Hello Guardian</Text>
        <Text className="mt-1 text-base text-slate-700">
          Stay in sync with your student&apos;s forest days.
        </Text>
      </View>

      <View className="flex-1 px-4 pt-6">
        <TouchableOpacity
          className="mb-4 min-h-[60px] flex-row items-center justify-between rounded-xl border-2 border-slate-900 bg-white px-4"
          accessibilityRole="button"
          accessibilityLabel="View your students"
        >
          <View className="flex-1 pr-2">
            <Text className="text-lg font-semibold text-slate-900">Your students</Text>
            <Text className="mt-1 text-sm text-slate-700">
              See profiles, emergency contacts, and waiver status.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 min-h-[60px] flex-row items-center justify-between rounded-xl border-2 border-slate-900 bg-white px-4"
          accessibilityRole="button"
          accessibilityLabel="View calendar"
        >
          <View className="flex-1 pr-2">
            <Text className="text-lg font-semibold text-slate-900">Calendar</Text>
            <Text className="mt-1 text-sm text-slate-700">
              Check upcoming sessions and important dates.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="min-h-[60px] flex-row items-center justify-between rounded-xl border-2 border-slate-900 bg-white px-4"
          accessibilityRole="button"
          accessibilityLabel="Announcements"
        >
          <View className="flex-1 pr-2">
            <Text className="text-lg font-semibold text-slate-900">Announcements</Text>
            <Text className="mt-1 text-sm text-slate-700">
              Read messages from your school about forest days.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

