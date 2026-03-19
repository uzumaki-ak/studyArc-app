import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useUser } from "@/hooks/useUser";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { HeartBar, XPBar, StreakBadge } from "@/components/game";
import { Card, SectionHeader } from "@/components/ui";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeTab() {
  const c = useTheme();
  const router = useRouter();
  const { profile, loading } = useUser();
  const { xp, streak, hearts, level } = useGameStore();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    if (!profile) return;
    const { data } = await supabase
      .from("enrollments")
      .select("*, courses(id, title, subject)")
      .eq("user_id", profile.id)
      .limit(4);
    setEnrollments(data ?? []);
  }

  useEffect(() => { loadData(); }, [profile?.id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: c.textMuted }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const levelNames = ["", "Novice", "Apprentice", "Explorer", "Scholar", "Adept", "Expert", "Veteran", "Master", "Grandmaster", "Legend"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: FontSize.xl, fontWeight: "700", color: c.text }}>
              Hi, {profile?.name?.split(" ")[0] ?? ""}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, marginTop: 2 }}>
              {levelNames[Math.min(level, 10)]}
            </Text>
          </View>
          <StreakBadge />
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: Spacing.md }}>
          <Card style={{ flex: 1, alignItems: "center" }} padding={Spacing.md}>
            <HeartBar />
            <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginTop: 4 }}>Hearts</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: "center" }} padding={Spacing.md}>
            <Text style={{ fontSize: FontSize.xl, fontWeight: "700", color: c.text, fontFamily: "monospace" }}>
              {xp.toLocaleString()}
            </Text>
            <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 }}>Total XP</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: "center" }} padding={Spacing.md}>
            <Text style={{ fontSize: FontSize.xl, fontWeight: "700", color: c.text }}>{streak}</Text>
            <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 }}>Day streak</Text>
          </Card>
        </View>

        {/* XP bar */}
        <Card padding={Spacing.md}>
          <XPBar />
        </Card>

        {/* Quick actions */}
        <View style={{ flexDirection: "row", gap: Spacing.md }}>
          <TouchableOpacity
            onPress={() => router.push("/quiz/lobby")}
            style={{
              flex: 1, backgroundColor: c.accent, borderRadius: Radius.lg,
              padding: Spacing.lg, alignItems: "center", gap: Spacing.sm,
            }}
          >
            <Text style={{ fontSize: 24, color: c.accentFg }}>◈</Text>
            <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.accentFg }}>Quiz Battle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/focus")}
            style={{
              flex: 1, backgroundColor: c.bgCard, borderRadius: Radius.lg,
              padding: Spacing.lg, alignItems: "center", gap: Spacing.sm,
              borderWidth: 1, borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: 24, color: c.text }}>⊗</Text>
            <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.text }}>Focus Mode</Text>
          </TouchableOpacity>
        </View>

        {/* Study Room */}
        <TouchableOpacity
          onPress={() => router.push("/study-room")}
          style={{
            backgroundColor: c.bgCard, borderRadius: Radius.lg,
            padding: Spacing.lg, borderWidth: 1, borderColor: c.border,
            flexDirection: "row", alignItems: "center", gap: Spacing.lg,
          }}
        >
          <Text style={{ fontSize: 28, color: c.text }}>◎</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FontSize.base, fontWeight: "700", color: c.text }}>Study Room</Text>
            <Text style={{ fontSize: FontSize.xs, color: c.textSecondary, marginTop: 2 }}>
              AI tutor + group study + flashcards
            </Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 18 }}>→</Text>
        </TouchableOpacity>

        {/* Enrolled courses */}
        <View>
          <SectionHeader title="Your courses" action="Browse" onAction={() => router.push("/(tabs)/courses")} />
          {enrollments.length > 0 ? (
            <View style={{ gap: Spacing.sm }}>
              {enrollments.map((e) => {
                const course = e.courses;
                return (
                  <Card
                    key={e.id}
                    onPress={() => router.push(`/course/${course.id}`)}
                    padding={Spacing.md}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: FontSize.base, fontWeight: "600", color: c.text }}>{course.title}</Text>
                        <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 }}>{course.subject}</Text>
                      </View>
                      <Text style={{ color: c.textMuted, fontSize: 18 }}>→</Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card padding={Spacing.xl}>
              <Text style={{ color: c.textMuted, fontSize: FontSize.sm, textAlign: "center" }}>
                No courses yet — browse and enroll
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
