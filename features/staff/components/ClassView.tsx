import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthContext } from "@/lib/AuthProvider";
import { useLogAttendanceMutation, useStudents } from "@/features/attendance";
import type { Student } from "@/features/attendance";
import { StudentEmergencyCard } from "@/features/attendance/StudentEmergencyCard";

function StudentRow({
  student,
  checkedIn,
  onToggleCheckIn,
}: {
  student: Student;
  checkedIn: boolean;
  onToggleCheckIn: (id: string) => void;
}): React.ReactElement {
  const label = `${student.first_name} ${student.last_name}`;
  const handlePress = useCallback(() => onToggleCheckIn(student.id), [student.id, onToggleCheckIn]);

  return (
    <View className="min-h-[60px] flex-row items-center justify-between border-b border-slate-200 bg-white px-4">
      <View className="flex-1 pr-4">
        <Text className="text-lg text-slate-900" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handlePress}
        className={`min-h-[60px] min-w-[60px] items-center justify-center rounded-lg border-2 px-4 ${
          checkedIn ? "border-slate-900 bg-slate-900" : "border-slate-900 bg-white"
        }`}
        accessibilityLabel={checkedIn ? `${label} checked in` : `Check in ${label}`}
        accessibilityRole="button"
      >
        <Text className={`text-base font-semibold ${checkedIn ? "text-white" : "text-slate-900"}`}>
          {checkedIn ? "Checked In" : "Check In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function ClassView(): React.ReactElement {
  const { signOut, schoolId } = useAuthContext();
  const { data: students, isLoading, isError, error, refetch } = useStudents(schoolId);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(() => new Set());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const logAttendanceMutation = useLogAttendanceMutation(schoolId);

  const handleSignOut = useCallback((): void => {
    signOut().then(() => router.replace("/login"));
  }, [signOut]);

  const handleToggleCheckIn = useCallback(
    (id: string): void => {
      setCheckedInIds((prev) => {
        const next = new Set(prev);
        const wasCheckedIn = next.has(id);
        if (wasCheckedIn) {
          next.delete(id);
        } else {
          next.add(id);
        }

        const nextStatus = wasCheckedIn ? "absent" : "present";
        logAttendanceMutation.mutate({ studentId: id, status: nextStatus });

        return next;
      });
    },
    [logAttendanceMutation],
  );

  const roster = useMemo(() => students ?? [], [students]);
  const isEmergencyCardOpen = selectedStudent != null;

  const handleOpenEmergencyCard = useCallback((student: Student): void => {
    setSelectedStudent(student);
  }, []);

  const handleCloseEmergencyCard = useCallback((): void => {
    setSelectedStudent(null);
  }, []);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <Text className="text-2xl font-bold text-slate-900">Hello Staff</Text>
        <TouchableOpacity
          onPress={handleSignOut}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white"
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4 pt-6">
        <Text className="mb-4 text-lg font-semibold text-slate-900">Today&apos;s RSVPs & Attendance</Text>

        {schoolId == null ? (
          <Text className="text-slate-900">No school assigned.</Text>
        ) : isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#0f172a" />
            <Text className="mt-2 text-slate-900">Loading roster…</Text>
          </View>
        ) : isError ? (
          <View className="py-4">
            <Text className="text-slate-900">
              {error instanceof Error ? error.message : "Failed to load students."}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-3 min-h-[44px] items-center justify-center rounded-lg border-2 border-slate-900 bg-white"
              accessibilityLabel="Retry loading students"
              accessibilityRole="button"
            >
              <Text className="text-base font-semibold text-slate-900">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : roster.length === 0 ? (
          <Text className="text-slate-900">No students in this school.</Text>
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
            {roster.map((student) => (
              <TouchableOpacity
                key={student.id}
                activeOpacity={0.8}
                onPress={() => {
                  handleOpenEmergencyCard(student);
                }}
                accessibilityRole="button"
                accessibilityLabel={`View emergency details for ${student.first_name} ${student.last_name}`}
              >
                <StudentRow
                  student={student}
                  checkedIn={checkedInIds.has(student.id)}
                  onToggleCheckIn={handleToggleCheckIn}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal
        visible={isEmergencyCardOpen}
        transparent
        animationType="slide"
        onRequestClose={handleCloseEmergencyCard}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="px-2 pb-4 pt-8">
            {selectedStudent != null && (
              <StudentEmergencyCard student={selectedStudent} onClose={handleCloseEmergencyCard} />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

