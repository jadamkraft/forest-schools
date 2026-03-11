import { useRouter } from "expo-router";
import { format } from "date-fns";
import { Text, TouchableOpacity, View } from "react-native";
import type { Class } from "../types";

interface ClassCardProps {
  classItem: Class;
}

export function ClassCard({ classItem }: ClassCardProps): React.ReactElement {
  const router = useRouter();
  const start = new Date(classItem.starts_at);
  const end = classItem.ends_at ? new Date(classItem.ends_at) : null;
  const timeLabel = end
    ? `${format(start, "p")}–${format(end, "p")}`
    : format(start, "p");

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/(auth)/calendar/${classItem.id}`)}
      className="min-h-[80px] rounded-xl border border-slate-200 bg-white px-4 py-3"
      accessibilityRole="button"
      accessibilityLabel={`Open details for ${classItem.title}`}
    >
      <Text className="mb-1 text-lg font-semibold text-slate-900" numberOfLines={2}>
        {classItem.title}
      </Text>
      <Text className="text-sm text-slate-700">{timeLabel}</Text>
      {classItem.location ? (
        <Text className="mt-1 text-sm text-slate-700" numberOfLines={1}>
          {classItem.location}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

