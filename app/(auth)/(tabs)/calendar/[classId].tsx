import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useMemo } from "react";
import { format } from "date-fns";
import { useAuthContext } from "@/lib/AuthProvider";
import { useClassesForRange } from "@/features/calendar";
import { RsvpButtons } from "@/features/calendar/components/RsvpButtons";
import type { Student } from "@/features/attendance";
import { useStudents } from "@/features/attendance";

export default function ClassDetailScreen(): React.ReactElement {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const { schoolId } = useAuthContext();
  const { data: students } = useStudents(schoolId);

  const { start, end } = useMemo(() => {
    const now = new Date();
    const isoNow = now.toISOString();
    return { start: isoNow, end: isoNow };
  }, []);

  const { data: classes, isLoading, isError, error } = useClassesForRange(schoolId, start, end);
  const cls = classes?.find((c) => c.id === classId);

  if (!classId || schoolId == null) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-lg text-slate-900">Missing class or school.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="mt-2 text-slate-900">Loading class…</Text>
      </View>
    );
  }

  if (isError || !cls) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-slate-900">
          {error instanceof Error ? error.message : "Class not found."}
        </Text>
      </View>
    );
  }

  const startTime = new Date(cls.starts_at);
  const endTime = cls.ends_at ? new Date(cls.ends_at) : null;

  const children: Student[] = students ?? [];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="mb-1 text-2xl font-bold text-slate-900">{cls.title}</Text>
      <Text className="text-base text-slate-700">
        {format(startTime, "EEE, MMM d")} ·{" "}
        {endTime ? `${format(startTime, "p")}–${format(endTime, "p")}` : format(startTime, "p")}
      </Text>
      {cls.location ? (
        <Text className="mt-1 text-base text-slate-700">Location: {cls.location}</Text>
      ) : null}
      {cls.description ? (
        <Text className="mt-3 text-base text-slate-800">{cls.description}</Text>
      ) : null}

      <View className="mt-6 border-t border-slate-200 pt-4">
        <Text className="mb-3 text-lg font-semibold text-slate-900">RSVPs</Text>
        {children.length === 0 ? (
          <Text className="text-base text-slate-900">No students available for RSVP.</Text>
        ) : (
          children.map((student) => (
            <View
              key={student.id}
              className="mb-3 min-h-[60px] flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4"
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                  {student.first_name} {student.last_name}
                </Text>
              </View>
              <RsvpButtons classId={cls.id} studentId={student.id} />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

