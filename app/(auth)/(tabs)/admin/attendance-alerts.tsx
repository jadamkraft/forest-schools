import { startOfDay, addDays } from "date-fns";
import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/lib/AuthProvider";
import { getSupabase } from "@/lib/supabase";

interface AttendanceAlertRow {
  id: string;
  student_id: string;
  status: string;
  check_in_time: string;
  students?: {
    first_name: string;
    last_name: string;
  } | null;
}

async function fetchTodayAttendanceAlerts(schoolId: string): Promise<AttendanceAlertRow[]> {
  const client = getSupabase();
  const today = startOfDay(new Date());
  const start = today.toISOString();
  const end = addDays(today, 1).toISOString();

  const { data, error } = await client
    .from("attendance_logs")
    .select("id, student_id, status, check_in_time, students(first_name,last_name)")
    .eq("school_id", schoolId)
    .eq("status", "absent")
    .gte("check_in_time", start)
    .lt("check_in_time", end)
    .order("check_in_time", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AttendanceAlertRow[];
}

export default function AdminAttendanceAlertsScreen(): React.ReactElement {
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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-attendance-alerts", schoolId],
    queryFn: () => fetchTodayAttendanceAlerts(schoolId!),
    enabled: schoolId != null,
  });

  if (schoolId == null) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-base text-slate-900">
          No school assigned.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="mt-2 text-slate-900">Loading attendance alerts…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="mb-3 text-base text-slate-900">
          {error instanceof Error ? error.message : "Failed to load attendance alerts."}
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

  const alerts = data ?? [];

  return (
    <View className="flex-1 bg-white">
      <View className="border-b border-slate-200 bg-white px-4 py-3">
        <Text className="text-xl font-bold text-slate-900">Attendance alerts</Text>
        <Text className="mt-1 text-base text-slate-700">
          Today&apos;s absent check-ins by student.
        </Text>
      </View>

      {alerts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-slate-900">
            No attendance alerts for today. All set.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 }}
        >
          {alerts.map((row) => {
            const name =
              row.students != null
                ? `${row.students.first_name} ${row.students.last_name}`
                : row.student_id;
            return (
              <View
                key={row.id}
                className="mb-3 min-h-[60px] flex-row items-center justify-between rounded-xl border-2 border-slate-900 bg-white px-4"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                    {name}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-700">Marked absent</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

