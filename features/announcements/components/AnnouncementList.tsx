import { FlatList, Text, View } from "react-native";
import type { Announcement } from "@/features/announcements/hooks/useAnnouncements";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";

interface AnnouncementListProps {
  announcements: Announcement[];
  onPressAnnouncement: (announcementId: string) => void;
}

export function AnnouncementList({
  announcements,
  onPressAnnouncement,
}: AnnouncementListProps): React.ReactElement {
  if (announcements.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-base text-slate-900">
          No announcements yet.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={announcements}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 16 }}
      renderItem={({ item }) => (
        <AnnouncementCard
          announcement={item}
          onPress={() => onPressAnnouncement(item.id)}
        />
      )}
    />
  );
}

