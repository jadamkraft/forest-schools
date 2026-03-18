import { addDays, formatISO, startOfDay } from "date-fns";
import React, { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuthContext } from "@/lib/AuthProvider";
import { useClassesForRange } from "@/features/calendar";
import { CalendarDayList } from "@/features/calendar/components/CalendarDayList";

export default function AdminRosterOverviewScreen(): React.ReactElement {
  const { schoolId, role, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="mt-2 text-slate-900">Loading…</Text>
      </View>
    );
  }

  if (role !== "admin") {
    return <Redirect href="/(auth)/(tabs)" />;
  }

  const { start, end } = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = addDays(today, -7);
    const endDate = addDays(today, 30);
    return {
      start: formatISO(startDate),
      end: formatISO(endDate),
    };
  }, []);

  const {
    data: classes,
    isLoading: isClassesLoading,
    isError,
    error,
    refetch,
  } = useClassesForRange(schoolId, start, end);

  if (schoolId == null) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-lg text-slate-900">No school assigned.</Text>
      </View>
    );
  }

  if (isClassesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="mt-2 text-slate-900">Loading roster overview…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="mb-3 text-slate-900">
          {error instanceof Error ? error.message : "Failed to load roster overview."}
        </Text>
        <Text
          className="min-h-[60px] min-w-[140px] items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-4 py-3 text-center text-base font-semibold text-slate-900"
          onPress={() => {
            void refetch();
          }}
        >
          Try again
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="border-b border-slate-200 bg-white px-4 py-3">
        <Text className="text-xl font-bold text-slate-900">Roster overview</Text>
        <Text className="mt-1 text-base text-slate-700">
          See upcoming classes and who is on the schedule.
        </Text>
      </View>
      <CalendarDayList classes={classes ?? []} />
    </View>
  );
}

