import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/lib/AuthProvider";
import { useWaiverStatus } from "@/features/waivers/useWaiverStatus";
import type { Tables } from "@/src/types/supabase";
import { getSupabase } from "@/lib/supabase";

export default function WaiverScreen(): React.ReactElement {
  const { session, schoolId } = useAuthContext();
  const router = useRouter();
  const [typedName, setTypedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const waiverStatus = useWaiverStatus(schoolId ?? null, session?.user.id ?? null);
  const waiver = waiverStatus.status === "needs-signature" ? waiverStatus.waiver : null;

  const canSubmit = !!waiver && typedName.trim().length > 0 && !isSubmitting;

  async function handleAcceptAndSign() {
    if (!waiver || !session || !schoolId || !canSubmit) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabase();

      // For Phase 1, sign once per profile/school for the active waiver.
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id")
        .eq("school_id", schoolId)
        .limit(1)
        .returns<Pick<Tables<"students">, "id">[]>();

      if (studentsError || !students || students.length === 0) {
        console.error("No students found to attach waiver signature", studentsError);
        setIsSubmitting(false);
        return;
      }

      const studentId = students[0].id;

      const { error } = await supabase.from("waiver_signatures").insert({
        waiver_id: waiver.id,
        school_id: schoolId,
        profile_id: session.user.id,
        student_id: studentId,
        signature_display_name: typedName.trim(),
        signature_method: "typed",
      });

      if (error) {
        console.error("Failed to record waiver signature", error);
        setIsSubmitting(false);
        return;
      }

      router.replace("/(auth)/(tabs)");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Forest School Liability Waiver</Text>
        {waiver ? (
          <>
            <Text style={styles.title}>{waiver.title}</Text>
            <Text style={styles.body}>{waiver.body_md}</Text>
          </>
        ) : (
          <Text style={styles.body}>There is currently no active waiver configured.</Text>
        )}

        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Type your full name to sign:</Text>
          <TextInput
            style={styles.signatureInput}
            value={typedName}
            onChangeText={setTypedName}
            placeholder="Full name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="I Accept and Sign"
          style={[styles.acceptButton, !canSubmit && styles.acceptButtonDisabled]}
          onPress={handleAcceptAndSign}
          disabled={!canSubmit}
        >
          <Text style={styles.acceptButtonText}>I Accept &amp; Sign</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 80,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: "#020617",
  },
  signatureSection: {
    marginTop: 32,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 8,
  },
  signatureInput: {
    borderWidth: 1,
    borderColor: "#cbd5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#020617",
    backgroundColor: "#ffffff",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },
  acceptButton: {
    height: 60,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
});

