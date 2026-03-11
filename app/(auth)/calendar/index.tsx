import { addDays, formatISO, startOfDay } from "date-fns";
import { ActivityIndicator, Text, View } from "react-native";
import { useMemo } from "react";
import { useAuthContext } from "../../../lib/AuthProvider";
import { useClassesForRange } from "../../../features/calendar";
import { CalendarDayList } from "../../../features/calendar/components/CalendarDayList";

export default function CalendarIndexScreen(): React.ReactElement {
  const { schoolId } = useAuthContext();

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
        <Text
          className="min-h-[44px] min-w-[120px] items-center justify-center rounded-lg border-2 border-slate-900 bg-white px-4 py-2 text-center text-base font-semibold text-slate-900"
          onPress={() => refetch()}
        >
          Retry
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <CalendarDayList classes={classes ?? []} />
    </View>
  );
}

