import { format } from "date-fns";
import { Text, TouchableOpacity, View } from "react-native";
import type { Announcement } from "./hooks/useAnnouncements";

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress: () => void;
}

export function AnnouncementCard({
  announcement,
  onPress,
}: AnnouncementCardProps): React.ReactElement {
  const publishedAt = new Date(announcement.published_at);
  const publishedLabel = format(publishedAt, "MMM d, yyyy • p");

  const isUnread = !announcement.isRead;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mb-3 min-h-[60px] flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3"
      accessibilityRole="button"
      accessibilityLabel={`${announcement.title} announcement`}
    >
      <View className="mr-3">
        <View
          className={`h-3 w-3 rounded-full ${
            isUnread ? "bg-slate-900" : "bg-slate-300"
          }`}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base ${
            isUnread ? "font-bold" : "font-semibold"
          } text-slate-900`}
          numberOfLines={2}
        >
          {announcement.title}
        </Text>
        <Text
          className="mt-1 text-sm text-slate-700"
          numberOfLines={2}
        >
          {announcement.body}
        </Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-xs text-slate-600">{publishedLabel}</Text>
          <Text className="text-xs font-semibold text-slate-700">
            {announcement.priority.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

