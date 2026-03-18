import { addDays, formatISO, startOfDay } from "date-fns";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useMemo, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthContext } from "@/lib/AuthProvider";
import { useClassesForRange } from "@/features/calendar";
import { CalendarDayList } from "@/features/calendar/components/CalendarDayList";

export default function CalendarIndexScreen(): React.ReactElement {
  const { schoolId, role, signOut } = useAuthContext();

  const handleStaffSignOut = useCallback((): void => {
    signOut().then(() => router.replace("/login"));
  }, [signOut]);

  const { start, end } = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = addDays(today, -7);
    const endDate = addDays(today, 30);
    return {
      start: formatISO(startDate),
      end: formatISO(endDate),
    };
  }, []);

  const { data: classes, isLoading, isError, error, refetch } = useClassesForRange(schoolId, start, end);

  if (schoolId == null) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-lg text-slate-900">No school assigned.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="mt-2 text-slate-900">Loading classes…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="mb-3 text-slate-900">
          {error instanceof Error ? error.message : "Failed to load classes."}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="min-h-[60px] min-w-[140px] items-center justify-center rounded-lg border-2 border-slate-900 bg-white px-4 py-3"
          accessibilityRole="button"
          accessibilityLabel="Retry loading classes"
        >
          <Text className="text-base font-semibold text-slate-900">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isStaff = role === "staff";

  return (
    <View className="flex-1 bg-white">
      {isStaff && (
        <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <Text className="text-2xl font-bold text-slate-900">Hello Staff</Text>
          <TouchableOpacity
            onPress={handleStaffSignOut}
            className="min-h-[60px] min-w-[60px] items-center justify-center rounded-full bg-white"
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={28} color="#0f172a" />
          </TouchableOpacity>
        </View>
      )}
      <CalendarDayList classes={classes ?? []} />
    </View>
  );
}

