import { format, startOfDay } from "date-fns";
import { FlatList, Text, View } from "react-native";
import type { Class } from "../types";
import { CalendarDaySection } from "./CalendarDaySection";

interface CalendarDayListProps {
  classes: Class[];
}

interface GroupedDay {
  dateKey: string;
  date: Date;
  classes: Class[];
}

export function CalendarDayList({ classes }: CalendarDayListProps): React.ReactElement {
  const groups: Record<string, GroupedDay> = {};

  for (const item of classes) {
    const d = startOfDay(new Date(item.starts_at));
    const key = d.toISOString();
    if (!groups[key]) {
      groups[key] = { dateKey: key, date: d, classes: [] };
    }
    groups[key].classes.push(item);
  }

  const days = Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime());

  if (days.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-lg text-slate-900">No classes in this range.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={days}
      keyExtractor={(item) => item.dateKey}
      renderItem={({ item }) => (
        <CalendarDaySection
          key={item.dateKey}
          dateLabel={format(item.date, "EEE, MMM d")}
          classes={item.classes}
        />
      )}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

