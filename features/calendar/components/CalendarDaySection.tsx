import { Text, View } from "react-native";
import type { Class } from "../types";
import { ClassCard } from "./ClassCard";

interface CalendarDaySectionProps {
  dateLabel: string;
  classes: Class[];
}

export function CalendarDaySection({ dateLabel, classes }: CalendarDaySectionProps): React.ReactElement {
  return (
    <View className="mb-6">
      <Text className="px-4 pb-2 text-base font-semibold text-slate-900">{dateLabel}</Text>
      <View className="gap-3 px-4">
        {classes.map((cls) => (
          <ClassCard key={cls.id} classItem={cls} />
        ))}
      </View>
    </View>
  );
}

