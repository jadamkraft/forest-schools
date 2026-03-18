import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useAuthContext } from "@/lib/AuthProvider";
import { useCreateAnnouncement } from "@/features/announcements/hooks/useCreateAnnouncement";

type Audience = "all" | "staff" | "guardians";
type Priority = "normal" | "important" | "emergency";

export default function AdminCreateAnnouncementScreen(): React.ReactElement {
  const { schoolId, role, isLoading } = useAuthContext();
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [audience, setAudience] = useState<Audience>("guardians");
  const [priority, setPriority] = useState<Priority>("normal");

  const createMutation = useCreateAnnouncement({ schoolId, role });

  const handleSubmit = useCallback((): void => {
    if (role !== "admin") {
      Alert.alert("Not allowed", "Only admins can create announcements.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody) {
      Alert.alert("Missing information", "Please add a title and message.");
      return;
    }

    createMutation.mutate(
      {
        title: trimmedTitle,
        body: trimmedBody,
        audience,
        priority,
      },
      {
        onSuccess: () => {
          setTitle("");
          setBody("");
          router.back();
        },
        onError: (error) => {
          Alert.alert("Failed to post announcement", error.message);
        },
      },
    );
  }, [role, title, body, audience, priority, createMutation]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-base text-slate-900">Loading…</Text>
      </View>
    );
  }

  if (role !== "admin") {
    return <Redirect href="/(auth)/(tabs)" />;
  }

  if (schoolId == null) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-base text-slate-900">
          Only admins can create announcements.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="border-b border-slate-200 bg-white px-4 py-3">
        <Text className="text-xl font-bold text-slate-900">
          New announcement
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4">
          <Text className="mb-2 text-base font-semibold text-slate-900">
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Brief subject"
            placeholderTextColor="#94a3b8"
            className="min-h-[60px] rounded-xl border-2 border-slate-900 bg-white px-4 text-base text-slate-900"
            accessibilityLabel="Announcement title"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-base font-semibold text-slate-900">
            Message
          </Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Details for staff and families"
            placeholderTextColor="#94a3b8"
            className="min-h-[120px] rounded-xl border-2 border-slate-900 bg-white px-4 py-3 text-base text-slate-900"
            accessibilityLabel="Announcement message"
            multiline
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-base font-semibold text-slate-900">
            Audience
          </Text>
          <View className="flex-row gap-x-3">
            {(["guardians", "staff", "all"] as Audience[]).map((value) => {
              const isSelected = audience === value;
              const label =
                value === "guardians"
                  ? "Guardians"
                  : value === "staff"
                  ? "Staff"
                  : "Everyone";
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setAudience(value)}
                  className={`min-h-[60px] flex-1 items-center justify-center rounded-xl border-2 px-3 ${
                    isSelected
                      ? "border-slate-900 bg-slate-900"
                      : "border-slate-900 bg-white"
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Send to ${label}`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isSelected ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mb-6">
          <Text className="mb-2 text-base font-semibold text-slate-900">
            Priority
          </Text>
          <View className="flex-row gap-x-3">
            {(["normal", "important", "emergency"] as Priority[]).map((value) => {
              const isSelected = priority === value;
              const label =
                value === "normal"
                  ? "Normal"
                  : value === "important"
                  ? "Important"
                  : "Emergency";
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setPriority(value)}
                  className={`min-h-[60px] flex-1 items-center justify-center rounded-xl border-2 px-3 ${
                    isSelected
                      ? "border-slate-900 bg-slate-900"
                      : "border-slate-900 bg-white"
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`${label} priority`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isSelected ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isLoading}
          className="mb-4 min-h-[60px] items-center justify-center rounded-xl border-2 border-slate-900 bg-white"
          accessibilityRole="button"
          accessibilityLabel="Post announcement"
        >
          <Text className="text-base font-semibold text-slate-900">
            {createMutation.isLoading ? "Posting…" : "Post announcement"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

