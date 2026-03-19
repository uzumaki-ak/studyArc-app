import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { CrownRow } from "@/components/game";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SkillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const router = useRouter();
  const { userId } = useGameStore();

  const [skill, setSkill] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [crownLevel, setCrownLevel] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: ch }, { data: prog }] = await Promise.all([
        supabase.from("skills").select("*, courses(id, title)").eq("id", id!).single(),
        supabase.from("challenges").select("id, type, difficulty, xp_reward").eq("skill_id", id!),
        supabase.from("user_progress").select("crown_level").eq("user_id", userId!).eq("skill_id", id!).single(),
      ]);
      setSkill(s);
      setChallenges(ch ?? []);
      setCrownLevel(prog?.crown_level ?? 0);
      setLoading(false);
    }
    if (userId && id) load();
  }, [id, userId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.text} />
      </SafeAreaView>
    );
  }

  const TYPE_LABELS: Record<string, string> = { mcq: "Multiple Choice", short: "Short Answer", code: "Code" };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← {skill?.courses?.title}</Text>
        </TouchableOpacity>

        {/* Header */}
        <View>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: "700", color: c.text, marginBottom: Spacing.sm }}>
            {skill?.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
            <CrownRow crownLevel={crownLevel} />
            {crownLevel === 5 && (
              <View style={{ backgroundColor: c.text, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 999 }}>
                <Text style={{ fontSize: FontSize.xs, color: c.accentFg, fontWeight: "700" }}>MASTERED</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ height: 6, backgroundColor: c.bgSecondary, borderRadius: 3, overflow: "hidden" }}>
          <View style={{ width: `${(crownLevel / 5) * 100}%`, height: "100%", backgroundColor: c.text, borderRadius: 3 }} />
        </View>

        {/* Challenges */}
        <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: c.text }}>
          Challenges ({challenges.length})
        </Text>

        <View style={{ gap: Spacing.sm }}>
          {challenges.map((ch, i) => (
            <TouchableOpacity
              key={ch.id}
              onPress={() => router.push(`/challenge/${ch.id}`)}
              activeOpacity={0.8}
              style={{
                backgroundColor: c.bgCard,
                borderRadius: Radius.lg,
                borderWidth: 1,
                borderColor: c.border,
                padding: Spacing.lg,
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
              }}
            >
              {/* Number */}
              <View style={{
                width: 28, height: 28, borderRadius: Radius.sm,
                backgroundColor: c.bgSecondary, alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, fontFamily: "monospace" }}>
                  {i + 1}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FontSize.base, fontWeight: "600", color: c.text }}>
                  {TYPE_LABELS[ch.type] ?? ch.type}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: 2 }}>
                  <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>
                    {"●".repeat(ch.difficulty)}{"○".repeat(5 - ch.difficulty)}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.text, fontFamily: "monospace" }}>
                  +{ch.xp_reward}
                </Text>
                <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>XP</Text>
              </View>

              <Text style={{ color: c.textMuted, fontSize: 18 }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
