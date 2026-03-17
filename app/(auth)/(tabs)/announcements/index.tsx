import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useCallback } from "react";
import { router } from "expo-router";
import { useAuthContext } from "@/lib/AuthProvider";
import { useAnnouncements } from "@/features/announcements/hooks/useAnnouncements";
import { useMarkAnnouncementRead } from "@/features/announcements/hooks/useMarkAnnouncementRead";
import { AnnouncementList } from "@/features/announcements/components/AnnouncementList";

export default function AnnouncementsScreen(): React.ReactElement {
  const { schoolId, role } = useAuthContext();
  const {
    data: announcements,
    isLoading,
    isError,
    error,
    refetch,
  } = useAnnouncements(schoolId, role);

  const markReadMutation = useMarkAnnouncementRead({ schoolId, role: role ?? null });

  const handlePressAnnouncement = useCallback(
    (announcementId: string): void => {
      markReadMutation.mutate({ announcementId });
    },
    [markReadMutation],
  );

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
        <Text className="mt-2 text-slate-900">
          Loading announcements…
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="mb-3 text-base text-slate-900">
          {error instanceof Error
            ? error.message
            : "Failed to load announcements."}
        </Text>
        <Text
          className="min-h-[44px] items-center justify-center rounded-lg border-2 border-slate-900 bg-white px-4 py-2 text-base font-semibold text-slate-900"
          onPress={() => {
            void refetch();
          }}
        >
          Try again
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <Text className="text-xl font-bold text-slate-900">
          Announcements
        </Text>
        {role === "admin" ? (
          <TouchableOpacity
            onPress={() => router.push("/(auth)/(tabs)/announcements/admin-create")}
            className="min-h-[44px] items-center justify-center rounded-lg border-2 border-slate-900 bg-white px-3"
            accessibilityRole="button"
            accessibilityLabel="Create announcement"
          >
            <Text className="text-sm font-semibold text-slate-900">
              New
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <AnnouncementList
        announcements={announcements ?? []}
        onPressAnnouncement={handlePressAnnouncement}
      />
    </View>
  );
}

