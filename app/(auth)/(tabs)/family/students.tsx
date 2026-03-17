import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuthContext } from "@/lib/AuthProvider";
import { useGuardianStudents, useCreateStudent } from "@/features/students";

export default function GuardianStudentsScreen(): React.ReactElement {
  const { schoolId, user } = useAuthContext();
  const profileId = user?.id ?? null;
  const {
    data: students,
    isLoading,
    isError,
    error,
    refetch,
  } = useGuardianStudents(schoolId ?? null, profileId);
  const createMutation = useCreateStudent({ schoolId: schoolId ?? null, profileId });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || !trimmedLast) {
      Alert.alert("Missing information", "Please add a first and last name.");
      return;
    }

    createMutation.mutate(
      {
        first_name: trimmedFirst,
        last_name: trimmedLast,
        date_of_birth: dob.trim() || null,
      },
      {
        onSuccess: () => {
          setFirstName("");
          setLastName("");
          setDob("");
          setLastError(null);
          void refetch();
        },
        onError: (err) => {
          Alert.alert("Could not add student", err.message);
          setLastError(err.message ?? "Could not add student. Please try again.");
        },
      },
    );
  }, [firstName, lastName, dob, createMutation, refetch]);

  if (schoolId == null || profileId == null) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-base text-slate-900">
          We could not find your school or profile. Please sign out and sign in again.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="border-b border-slate-200 bg-white px-4 py-3">
        <Text className="text-xl font-bold text-slate-900">My students</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-4">
          <Text className="mb-3 text-base font-semibold text-slate-900">Add a student</Text>

          <View className="mb-3">
            <Text className="mb-1 text-base text-slate-900">First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor="#94a3b8"
              className="min-h-[60px] rounded-xl border-2 border-slate-900 bg-white px-4 text-base text-slate-900"
            />
          </View>

          <View className="mb-3">
            <Text className="mb-1 text-base text-slate-900">Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor="#94a3b8"
              className="min-h-[60px] rounded-xl border-2 border-slate-900 bg-white px-4 text-base text-slate-900"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-base text-slate-900">Date of birth (optional)</Text>
            <TextInput
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              className="min-h-[60px] rounded-xl border-2 border-slate-900 bg-white px-4 text-base text-slate-900"
            />
          </View>

          {lastError != null ? (
            <Text className="mb-3 text-sm text-red-600">{lastError}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={createMutation.isLoading}
            className="min-h-[60px] items-center justify-center rounded-xl border-2 border-slate-900 bg-white"
            accessibilityRole="button"
            accessibilityLabel="Add student"
          >
            <Text className="text-base font-semibold text-slate-900">
              {createMutation.isLoading ? "Adding…" : "Add student"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-2">
          <Text className="mb-3 text-base font-semibold text-slate-900">Your students</Text>

          {isLoading ? (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color="#0f172a" />
              <Text className="mt-2 text-slate-900">Loading students…</Text>
            </View>
          ) : isError ? (
            <View>
              <Text className="text-base text-slate-900">
                {error instanceof Error ? error.message : "Could not load students."}
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="mt-3 min-h-[60px] items-center justify-center rounded-xl border-2 border-slate-900 bg-white"
                accessibilityRole="button"
                accessibilityLabel="Try loading students again"
              >
                <Text className="text-base font-semibold text-slate-900">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (students ?? []).length === 0 ? (
            <Text className="text-base text-slate-900">
              You have not added any students yet. Use the form above to add your first student.
            </Text>
          ) : (
            (students ?? []).map((student) => (
              <View
                key={student.id}
                className="mb-3 min-h-[60px] flex-row items-center justify-between rounded-xl border-2 border-slate-900 bg-white px-4"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-slate-900">
                    {student.first_name} {student.last_name}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

