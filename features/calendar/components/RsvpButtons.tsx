import { useAuthContext } from "@/lib/AuthProvider";
import { useUpsertRsvpMutation } from "../api";
import type { RsvpStatus } from "../types";
import { Text, TouchableOpacity, View } from "react-native";
import { useCallback } from "react";

interface RsvpButtonsProps {
  classId: string;
  studentId: string;
  currentStatus?: RsvpStatus | null;
}

const STATUSES: RsvpStatus[] = ["attending", "excused", "late"];

export function RsvpButtons({ classId, studentId, currentStatus = null }: RsvpButtonsProps): React.ReactElement {
  const { schoolId, user } = useAuthContext();
  const profileId = user?.id ?? null;

  const mutation = useUpsertRsvpMutation({
    schoolId,
    classId,
    profileId,
    studentId,
  });

  const handlePress = useCallback(
    (status: RsvpStatus) => {
      mutation.mutate({ status });
    },
    [mutation],
  );

  return (
    <View className="flex-row gap-2">
      {STATUSES.map((status) => (
        <TouchableOpacity
          key={status}
          onPress={() => handlePress(status)}
          className={`min-h-[60px] flex-1 items-center justify-center rounded-lg border-2 border-slate-900 px-2 ${
            currentStatus === status ? "bg-slate-900" : "bg-white"
          }`}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${status} for this class`}
        >
          <Text className={`text-base font-semibold capitalize ${currentStatus === status ? "text-white" : "text-slate-900"}`}>
            {status}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

