import { Linking, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Student } from "./types";

interface StudentEmergencyCardProps {
  student: Student;
  onClose: () => void;
}

function sanitizePhone(phone: string | null | undefined): string | null {
  if (phone == null) return null;
  const trimmed = phone.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

async function callPhoneNumber(phone: string | null | undefined): Promise<void> {
  const sanitized = sanitizePhone(phone);
  if (sanitized == null) return;

  const url = `tel:${sanitized}`;
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  } catch (error) {
    // Best-effort; log for debugging but avoid crashing the UI.
    // eslint-disable-next-line no-console
    console.error("Failed to open dialer", error);
  }
}

export function StudentEmergencyCard({ student, onClose }: StudentEmergencyCardProps): React.ReactElement {
  const fullName = `${student.first_name} ${student.last_name}`;
  const hasMedicalInfo = student.medical_info != null && student.medical_info.trim().length > 0;
  const primaryPhone = sanitizePhone(student.primary_contact_phone ?? null);
  const secondaryPhone = sanitizePhone(student.secondary_contact_phone ?? null);

  return (
    <View className="w-full rounded-t-2xl bg-white px-6 pb-8 pt-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-xl font-bold text-slate-900" numberOfLines={2}>
            {fullName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white"
          accessibilityLabel="Close emergency contact details"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {hasMedicalInfo && (
        <View className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <View className="mb-1 flex-row items-center">
            <Ionicons name="medkit-outline" size={18} color="#dc2626" />
            <Text className="ml-2 text-sm font-semibold text-red-600">Medical Alerts</Text>
          </View>
          <Text className="text-base text-red-600">{student.medical_info}</Text>
        </View>
      )}

      <View className="space-y-4">
        <View>
          <Text className="mb-1 text-sm font-semibold text-slate-900">Primary Contact</Text>
          <Text className="text-base text-slate-900">
            {student.primary_contact_name ?? "Not provided"}
          </Text>
          <Text className="text-base text-slate-900">
            {primaryPhone ?? "No phone number on file"}
          </Text>
        </View>

        <View>
          <Text className="mb-1 text-sm font-semibold text-slate-900">Secondary Contact</Text>
          <Text className="text-base text-slate-900">
            {student.secondary_contact_name ?? "Not provided"}
          </Text>
          <Text className="text-base text-slate-900">
            {secondaryPhone ?? "No phone number on file"}
          </Text>
        </View>
      </View>

      <View className="mt-6 space-y-3">
        {primaryPhone != null && (
          <TouchableOpacity
            onPress={() => {
              void callPhoneNumber(primaryPhone);
            }}
            className="min-h-[60px] items-center justify-center rounded-lg border-2 border-slate-900 bg-white"
            accessibilityLabel={`Call primary contact for ${fullName}`}
            accessibilityRole="button"
          >
            <Text className="text-base font-semibold text-slate-900">Call Primary</Text>
          </TouchableOpacity>
        )}

        {secondaryPhone != null && (
          <TouchableOpacity
            onPress={() => {
              void callPhoneNumber(secondaryPhone);
            }}
            className="min-h-[60px] items-center justify-center rounded-lg border-2 border-slate-900 bg-white"
            accessibilityLabel={`Call secondary contact for ${fullName}`}
            accessibilityRole="button"
          >
            <Text className="text-base font-semibold text-slate-900">Call Secondary</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

