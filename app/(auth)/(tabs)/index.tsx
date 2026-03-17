import { ActivityIndicator, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuthContext } from "@/lib/AuthProvider";
import type { AppRole } from "@/features/auth/types";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";
import { ClassView } from "@/features/staff/components/ClassView";
import { ParentHub } from "@/features/family/components/ParentHub";

function RoleHome({ role }: { role: AppRole | null }): React.ReactElement {
  if (role === "admin") {
    return <AdminDashboard />;
  }

  if (role === "staff") {
    // Staff should land on the Classes list (calendar tab)
    return <Redirect href="/(auth)/(tabs)/calendar" />;
  }

  return <ParentHub />;
}

export default function TabsIndexScreen(): React.ReactElement {
  const { role, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="mt-2 text-slate-900">Loading your dashboard…</Text>
      </View>
    );
  }

  return <RoleHome role={role} />;
}

