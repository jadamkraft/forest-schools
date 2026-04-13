import React, { useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthContext } from "@/lib/AuthProvider";
import { useClassById, useRsvpsForClasses, useStudentsByIds } from "@/features/calendar";
import { RsvpButtons } from "@/features/calendar/components/RsvpButtons";
import { useGuardianStudents } from "@/features/students";
import { useUpsertAttendanceLogMutation, type Student } from "@/features/attendance";
import { getSupabase } from "@/lib/supabase";
import type { RsvpStatus } from "@/features/calendar";

export default function CalendarEventDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { schoolId, user, role, isLoading } = useAuthContext();

  const classId = typeof id === "string" ? id : null;
  const profileId = user?.id ?? null;

  const isStaffOrAdmin = role === "staff" || role === "admin";
  const isGuardianView = !isStaffOrAdmin;

  const {
    data: cls,
    isLoading: isClassLoading,
    isError: isClassError,
    error: classError,
  } = useClassById(schoolId, classId);

  const {
    data: rsvps,
    isLoading: isRsvpsLoading,
    isError: isRsvpsError,
    error: rsvpsError,
  } = useRsvpsForClasses(schoolId, classId ? [classId] : []);

  const rsvpStatusByStudentId = useMemo(() => {
    const map = new Map<string, RsvpStatus>();
    for (const rsvp of rsvps ?? []) {
      map.set(rsvp.student_id, rsvp.status);
    }
    return map;
  }, [rsvps]);

  const rosterStudentIds = useMemo(() => {
    return Array.from(new Set((rsvps ?? []).map((r) => r.student_id)));
  }, [rsvps]);

  const {
    data: rosterStudents,
    isLoading: isRosterStudentsLoading,
    isError: isRosterStudentsError,
    error: rosterStudentsError,
  } = useStudentsByIds(isStaffOrAdmin ? schoolId : null, isStaffOrAdmin ? rosterStudentIds : []);

  const rosterStudentById = useMemo(() => {
    const map = new Map<string, Student>();
    for (const s of rosterStudents ?? []) {
      map.set(s.id, s);
    }
    return map;
  }, [rosterStudents]);

  const rosterRows = useMemo(() => {
    const rows: Array<{ student: Student; status: RsvpStatus }> = [];
    for (const r of rsvps ?? []) {
      const student = rosterStudentById.get(r.student_id);
      if (!student) continue;
      rows.push({ student, status: r.status });
    }
    return rows;
  }, [rsvps, rosterStudentById]);

  const { data: guardianStudents } = useGuardianStudents(
    isGuardianView ? schoolId : null,
    isGuardianView ? profileId : null,
  );

  const checkInMutation = useUpsertAttendanceLogMutation(schoolId);
  const queryClient = useQueryClient();

  const { data: latestAttendanceByStudentId } = useQuery({
    queryKey: ["event-detail-attendance", schoolId, rosterStudentIds],
    queryFn: async (): Promise<Map<string, "present" | "absent">> => {
      const client = getSupabase();
      const { data, error } = await client
        .from("attendance_logs")
        .select("student_id,status,check_in_time")
        .eq("school_id", schoolId!)
        .in("student_id", rosterStudentIds)
        .order("check_in_time", { ascending: false });

      if (error) {
        throw error;
      }

      const map = new Map<string, "present" | "absent">();
      for (const row of data ?? []) {
        if (!map.has(row.student_id)) {
          map.set(row.student_id, row.status as "present" | "absent");
        }
      }
      return map;
    },
    enabled: schoolId != null && isStaffOrAdmin && rosterStudentIds.length > 0,
  });

  const handleCheckIn = useCallback(
    (studentId: string) => {
      checkInMutation.mutate(
        { studentId, status: "present" },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["event-detail-attendance", schoolId] });
          },
        },
      );
    },
    [checkInMutation, queryClient, schoolId],
  );

  const startTime = cls ? new Date(cls.starts_at) : null;
  const endTime = cls?.ends_at ? new Date(cls.ends_at) : null;

  if (isLoading || isClassLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="mt-2 text-slate-900">Loading…</Text>
      </View>
    );
  }

  if (!schoolId || !classId) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-lg text-slate-900">Missing event or school.</Text>
      </View>
    );
  }

  if (isClassError || !cls) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-slate-900">
          {classError instanceof Error ? classError.message : "Event not found."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="mb-1 text-2xl font-bold text-slate-900">{cls.title}</Text>
      <Text className="text-base text-slate-700">
        {startTime ? format(startTime, "EEE, MMM d") : ""} ·{" "}
        {endTime ? `${format(startTime as Date, "p")}–${format(endTime, "p")}` : startTime ? format(startTime, "p") : ""}
      </Text>
      {cls.location ? (
        <Text className="mt-1 text-base text-slate-700">Location: {cls.location}</Text>
      ) : null}
      {cls.description ? (
        <Text className="mt-3 text-base text-slate-800">{cls.description}</Text>
      ) : null}

      <View className="mt-6 border-t border-slate-200 pt-4">
        {isGuardianView ? (
          <>
            <Text className="mb-3 text-lg font-semibold text-slate-900">RSVPs</Text>
            {isRsvpsLoading || !rsvps ? (
              <Text className="text-base text-slate-900">Loading RSVP status…</Text>
            ) : (
              <>
                {(guardianStudents ?? []).length === 0 ? (
                  <Text className="text-base text-slate-900">No students available for RSVP.</Text>
                ) : (
                  (guardianStudents ?? []).map((student) => (
                    <View
                      key={student.id}
                      className="mb-3 min-h-[60px] flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                          {student.first_name} {student.last_name}
                        </Text>
                      </View>
                      <RsvpButtons
                        classId={cls.id}
                        studentId={student.id}
                        currentStatus={rsvpStatusByStudentId.get(student.id) ?? null}
                      />
                    </View>
                  ))
                )}
              </>
            )}
            {isRsvpsError ? (
              <Text className="mt-2 text-base text-slate-900">
                {rsvpsError instanceof Error ? rsvpsError.message : "Failed to load RSVP status."}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text className="mb-3 text-lg font-semibold text-slate-900">Roster</Text>
            <Text className="mb-4 text-base text-slate-700">Students who have RSVP&apos;d</Text>

            {isRosterStudentsLoading || isRsvpsLoading ? (
              <Text className="text-base text-slate-900">Loading roster…</Text>
            ) : rosterRows.length === 0 ? (
              <Text className="text-base text-slate-900">No RSVPs yet.</Text>
            ) : (
              rosterRows.map(({ student, status }) => (
                <View key={student.id} className="mb-3 min-h-[60px] flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                      {student.first_name} {student.last_name}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-700 capitalize">{status}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleCheckIn(student.id)}
                    className={`min-h-[60px] min-w-[120px] items-center justify-center rounded-lg border-2 border-slate-900 px-3 ${
                      latestAttendanceByStudentId?.get(student.id) === "present" ? "bg-slate-900" : "bg-white"
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Check-in ${student.first_name} ${student.last_name}`}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        latestAttendanceByStudentId?.get(student.id) === "present" ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Check-in
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {isRosterStudentsError ? (
              <Text className="mt-2 text-base text-slate-900">
                {rosterStudentsError instanceof Error
                  ? rosterStudentsError.message
                  : "Failed to load roster."}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}

