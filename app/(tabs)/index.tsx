import { router } from "expo-router";
import { useAuthContext } from "../../lib/AuthProvider";
import { useStudents } from "../../features/attendance";
import type { Student } from "../../features/attendance";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCallback, useMemo, useState } from "react";

function StudentRow({
  student,
  checkedIn,
  onToggleCheckIn,
}: {
  student: Student;
  checkedIn: boolean;
  onToggleCheckIn: (id: string) => void;
}): React.ReactElement {
  const label = `${student.first_name} ${student.last_name}`;
  const handlePress = useCallback(() => onToggleCheckIn(student.id), [student.id, onToggleCheckIn]);

  return (
    <View
      className="min-h-[60px] flex-row items-center justify-between border-b border-slate-200 bg-white px-4"
      accessibilityRole="none"
    >
      <Text className="text-lg text-slate-900" numberOfLines={1}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={handlePress}
        className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border-2 px-4 ${
          checkedIn ? "border-slate-900 bg-slate-900" : "border-slate-900 bg-white"
        }`}
        accessibilityLabel={checkedIn ? `${label} checked in` : `Check in ${label}`}
        accessibilityRole="button"
      >
        <Text className={`text-base font-semibold ${checkedIn ? "text-white" : "text-slate-900"}`}>
          {checkedIn ? "Checked In" : "Check In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabsIndexScreen(): React.ReactElement {
  const { signOut, schoolId } = useAuthContext();
  const { data: students, isLoading, isError, error, refetch } = useStudents(schoolId);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(() => new Set());

  const handleSignOut = useCallback((): void => {
    signOut().then(() => router.replace("/login"));
  }, [signOut]);

  const handleToggleCheckIn = useCallback((id: string): void => {
    setCheckedInIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const roster = useMemo(() => students ?? [], [students]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <Text className="text-xl font-semibold text-slate-900">TAFS</Text>
        <TouchableOpacity
          onPress={handleSignOut}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-slate-900 px-4"
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <Text className="text-base font-medium text-white">Sign out</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4 pt-4">
        <Text className="mb-3 text-lg font-semibold text-slate-900">Attendance</Text>

        {schoolId == null ? (
          <Text className="text-slate-900">No school assigned.</Text>
        ) : isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#0f172a" />
            <Text className="mt-2 text-slate-900">Loading roster…</Text>
          </View>
        ) : isError ? (
          <View className="py-4">
            <Text className="text-slate-900">
              {error instanceof Error ? error.message : "Failed to load students."}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-3 min-h-[44px] items-center justify-center rounded-lg border-2 border-slate-900 bg-white"
              accessibilityLabel="Retry loading students"
              accessibilityRole="button"
            >
              <Text className="text-base font-semibold text-slate-900">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : roster.length === 0 ? (
          <Text className="text-slate-900">No students in this school.</Text>
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
            {roster.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                checkedIn={checkedInIds.has(student.id)}
                onToggleCheckIn={handleToggleCheckIn}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
