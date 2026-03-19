import React from "react";
import { View, Text } from "react-native";
import { useTheme, Spacing, FontSize } from "@/lib/theme";
import { useGameStore } from "@/store/gameStore";
import { Ionicons } from "@expo/vector-icons";

export function HeartBar() {
  const c = useTheme();
  const { hearts } = useGameStore();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: 16, color: i < hearts ? c.danger : c.border }}>
          ♥
        </Text>
      ))}
    </View>
  );
}

export function XPBar({ compact }: { compact?: boolean }) {
  const c = useTheme();
  const { xp, level } = useGameStore();
  const thresholds = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
  const curr = thresholds[Math.min(level - 1, thresholds.length - 1)];
  const next = thresholds[Math.min(level, thresholds.length - 1)];
  const pct = Math.min(100, ((xp - curr) / (next - curr)) * 100);

  if (compact) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
        <Text style={{ fontSize: FontSize.xs, color: c.textSecondary, fontWeight: "600" }}>Lv.{level}</Text>
        <View style={{ flex: 1, height: 10, backgroundColor: c.bgSecondary, borderRadius: 5, overflow: "hidden" }}>
          <View style={{ width: `${pct}%`, height: "100%", backgroundColor: (c as any).warning || "#FF9600", borderRadius: 5 }} />
        </View>
        <Text style={{ fontSize: FontSize.xs, color: c.textMuted, fontFamily: "monospace" }}>{xp}xp</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: FontSize.sm, color: c.textSecondary }}>Level {level}</Text>
        <Text style={{ fontSize: FontSize.sm, color: c.textMuted, fontFamily: "monospace" }}>
          {xp - curr}/{next - curr} XP
        </Text>
      </View>
      <View style={{ height: 16, backgroundColor: c.bgSecondary, borderRadius: 8, overflow: "hidden" }}>
        <View style={{ width: `${pct}%`, height: "100%", backgroundColor: (c as any).warning || "#FF9600", borderRadius: 8 }} />
      </View>
    </View>
  );
}

export function StreakBadge() {
  const c = useTheme();
  const { streak } = useGameStore();
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.bgSecondary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: 999,
    }}>
      <Ionicons name="flame" size={16} color={(c as any).warning || "#FF9600"} />
      <Text style={{ fontSize: FontSize.sm, color: (c as any).warning || "#FF9600", fontWeight: "700", fontFamily: "monospace" }}>
        {streak}
      </Text>
    </View>
  );
}

export function CrownRow({ crownLevel }: { crownLevel: number }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: 12, color: i < crownLevel ? c.text : c.border }}>◆</Text>
      ))}
    </View>
  );
}
