import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

const MODES = [
  {
    title: "Quiz Battle",
    desc: "Match with 2–5 players. Wager XP. Winner takes all.",
    icon: "◈",
    route: "/quiz/lobby",
    primary: true,
  },
  {
    title: "Boss Fight",
    desc: "Solo battle vs an AI boss. Answer fast or lose hearts.",
    icon: "◆",
    route: "/boss",
    primary: false,
  },
];

export default function BattleTab() {
  const c = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}>
        <View>
          <Text style={{ fontSize: FontSize.xl, fontWeight: "700", color: c.text }}>Battle</Text>
          <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, marginTop: 4 }}>
            Test your knowledge. Win XP.
          </Text>
        </View>

        <View style={{ gap: Spacing.md }}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.title}
              onPress={() => router.push(m.route as never)}
              activeOpacity={0.8}
              style={{
                backgroundColor: m.primary ? c.accent : c.bgCard,
                borderRadius: Radius.xl,
                padding: Spacing.xl,
                borderWidth: 1,
                borderColor: m.primary ? c.accent : c.border,
                gap: Spacing.sm,
              }}
            >
              <Text style={{ fontSize: 40, color: m.primary ? c.accentFg : c.text }}>{m.icon}</Text>
              <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: m.primary ? c.accentFg : c.text }}>
                {m.title}
              </Text>
              <Text style={{ fontSize: FontSize.sm, color: m.primary ? c.accentFg + "99" : c.textSecondary, lineHeight: 20 }}>
                {m.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats card */}
        <View style={{
          backgroundColor: c.bgCard,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: c.border,
          padding: Spacing.lg,
          gap: Spacing.sm,
        }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Battle tips
          </Text>
          {[
            "Voice answers work — speak your option aloud",
            "Wager 0 XP to practice for free",
            "Boss fight resets every attempt",
          ].map((tip, i) => (
            <View key={i} style={{ flexDirection: "row", gap: Spacing.sm, alignItems: "flex-start" }}>
              <Text style={{ color: c.textMuted, fontSize: FontSize.sm, marginTop: 1 }}>·</Text>
              <Text style={{ flex: 1, fontSize: FontSize.sm, color: c.textSecondary, lineHeight: 20 }}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
