import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const router = useRouter();
  const { userId } = useGameStore();

  const [course, setCourse] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: s }, { data: e }] = await Promise.all([
        supabase.from("courses").select("*, users(name)").eq("id", id!).single(),
        supabase
          .from("skills")
          .select("*, user_progress(crown_level)")
          .eq("course_id", id!)
          .order("order_index"),
        supabase.from("enrollments").select("id").eq("user_id", userId!).eq("course_id", id!).single(),
      ]);
      setCourse(c);
      setSkills(s ?? []);
      setEnrolled(!!e);
      setLoading(false);
    }
    if (userId && id) load();
  }, [id, userId]);

  async function toggleEnroll() {
    setEnrolling(true);
    if (enrolled) {
      await supabase.from("enrollments").delete().eq("user_id", userId!).eq("course_id", id!);
      setEnrolled(false);
    } else {
      await supabase.from("enrollments").insert({ user_id: userId!, course_id: id! });
      setEnrolled(true);
    }
    setEnrolling(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.text} />
      </SafeAreaView>
    );
  }

  // Zigzag positions
  const positions = ["center", "right", "center", "left"] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.lg }}>
          <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={{ marginBottom: Spacing.xl }}>
          <Text style={{ fontSize: FontSize.xs, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            {course?.subject}
          </Text>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: "700", color: c.text, marginBottom: 4 }}>
            {course?.title}
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, marginBottom: Spacing.lg }}>
            by {course?.users?.name}
          </Text>
          {course?.description ? (
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, lineHeight: 20, marginBottom: Spacing.lg }}>
              {course.description}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={toggleEnroll}
            disabled={enrolling}
            style={{
              backgroundColor: enrolled ? c.bgCard : c.text,
              borderWidth: enrolled ? 1 : 0,
              borderColor: c.border,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.xl,
              borderRadius: Radius.md,
              alignSelf: "flex-start",
              alignItems: "center",
            }}
          >
            <Text style={{ color: enrolled ? c.textSecondary : c.accentFg, fontWeight: "600", fontSize: FontSize.sm }}>
              {enrolling ? "..." : enrolled ? "Unenroll" : "Enroll free"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skill path */}
        <View style={{ alignItems: "center", paddingBottom: 40 }}>
          {/* Vertical line */}
          <View style={{
            position: "absolute",
            top: 0, bottom: 0,
            width: 2,
            backgroundColor: c.border,
            left: "50%",
            marginLeft: -1,
          }} />

          {skills.map((skill, idx) => {
            const progress = skill.user_progress as { crown_level: number }[] | null;
            const crownLevel = progress?.[0]?.crown_level ?? 0;
            const mastered = crownLevel === 5;
            const started = crownLevel > 0;
            const locked = !enrolled && idx > 0;

            const pos = positions[idx % 4];
            const offsetStyle = pos === "left"
              ? { alignSelf: "flex-start" as const, marginLeft: 24 }
              : pos === "right"
              ? { alignSelf: "flex-end" as const, marginRight: 24 }
              : { alignSelf: "center" as const };

            return (
              <View key={skill.id} style={[{ marginBottom: 32, alignItems: "center", width: 80 }, offsetStyle]}>
                <TouchableOpacity
                  onPress={() => !locked && router.push(`/skill/${skill.id}`)}
                  disabled={locked}
                  activeOpacity={0.8}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: mastered ? (c as any).warning : started ? (c as any).warning : c.bgCard,
                    borderWidth: 2,
                    borderBottomWidth: started || mastered ? 6 : 4,
                    borderColor: mastered ? "#CC7800" : started ? "#CC7800" : c.borderStrong, // Darker orange for 3D effect
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: locked ? 0.4 : 1,
                  }}
                >
                  {mastered ? (
                    <Text style={{ color: c.bg, fontSize: 24, fontWeight: "800" }}>★</Text>
                  ) : started ? (
                    <Text style={{ color: c.bg, fontSize: FontSize.md, fontWeight: "800" }}>
                      {crownLevel}/5
                    </Text>
                  ) : (
                    <Text style={{ color: c.textMuted, fontSize: 24 }}>★</Text>
                  )}
                </TouchableOpacity>

                <Text style={{
                  fontSize: 10,
                  color: locked ? c.textMuted : c.textSecondary,
                  textAlign: "center",
                  marginTop: 6,
                  fontWeight: "600",
                }} numberOfLines={2}>
                  {skill.name}
                </Text>

                {/* Stars */}
                <View style={{ flexDirection: "row", gap: 2, marginTop: 4 }}>
                  {[1, 3, 5].map((threshold) => (
                    <Text key={threshold} style={{ fontSize: 10, color: crownLevel >= threshold ? c.text : c.border }}>
                      ★
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
