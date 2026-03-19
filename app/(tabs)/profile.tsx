import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { Card, SectionHeader, Divider } from "@/components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Rarity } from "@/types";

const RARITY_COLOR: Record<Rarity, string> = {
  common: "#737373", rare: "#3b82f6", epic: "#8b5cf6", legendary: "#f59e0b",
};

export default function ProfileTab() {
  const c = useTheme();
  const router = useRouter();
  const { userId, userName, xp, level, streak, hearts, clearUser } = useGameStore();
  const [badges, setBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function load() {
      const [{ data: earned }, { data: all }] = await Promise.all([
        supabase.from("user_badges").select("badge_id, earned_at, badges(name, rarity, description)").eq("user_id", userId!),
        supabase.from("badges").select("*"),
      ]);
      setBadges(earned ?? []);
      setAllBadges(all ?? []);
    }
    load();
  }, [userId]);

  async function signOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          clearUser();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const earnedIds = new Set(badges.map((b) => b.badge_id));
  const initials = (userName ?? "??").slice(0, 2).toUpperCase();

  const LEVEL_NAMES: Record<number, string> = {
    1: "Novice", 2: "Apprentice", 3: "Explorer", 4: "Scholar",
    5: "Adept", 6: "Expert", 7: "Veteran", 8: "Master", 9: "Grandmaster", 10: "Legend",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
        {/* Avatar card */}
        <Card>
          <View style={{ alignItems: "center", gap: Spacing.md }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: c.text, alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: FontSize.xl, fontWeight: "700", color: c.accentFg }}>{initials}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: c.text }}>{userName}</Text>
              <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, marginTop: 2 }}>
                {LEVEL_NAMES[Math.min(level, 10)]} · Level {level}
              </Text>
            </View>

            <Divider style={{ width: "100%" }} />

            <View style={{ flexDirection: "row", width: "100%" }}>
              {[
                { label: "Total XP", value: xp.toLocaleString() },
                { label: "Streak", value: `${streak}d` },
                { label: "Hearts", value: `${hearts}/5` },
              ].map((s, i) => (
                <View key={s.label} style={{ flex: 1, alignItems: "center" }}>
                  {i > 0 && <View style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 1, backgroundColor: c.border }} />}
                  <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: c.text, fontFamily: "monospace" }}>{s.value}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Badges */}
        <View>
          <SectionHeader title={`Badges (${badges.length}/${allBadges.length})`} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
            {allBadges.map((badge) => {
              const earned = earnedIds.has(badge.id);
              const color = RARITY_COLOR[badge.rarity as Rarity];
              return (
                <View
                  key={badge.id}
                  style={{
                    width: "30%",
                    backgroundColor: c.bgCard,
                    borderRadius: Radius.lg,
                    borderWidth: 1.5,
                    borderColor: earned ? color + "55" : c.border,
                    padding: Spacing.md,
                    alignItems: "center",
                    opacity: earned ? 1 : 0.4,
                  }}
                >
                  <Text style={{ fontSize: 24, color: earned ? color : c.textMuted, marginBottom: 4 }}>◆</Text>
                  <Text style={{ fontSize: FontSize.xs, fontWeight: "600", color: c.text, textAlign: "center" }} numberOfLines={2}>
                    {badge.name}
                  </Text>
                  <Text style={{ fontSize: 9, color: color, textTransform: "capitalize", marginTop: 2 }}>{badge.rarity}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View>
          <SectionHeader title="Settings" />
          <Card padding={0}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.lg }}>
              <Text style={{ fontSize: FontSize.base, color: c.text }}>Push notifications</Text>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ true: c.text }}
              />
            </View>
            <Divider />
            <TouchableOpacity
              onPress={() => router.push("/friends")}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.lg }}
            >
              <Text style={{ fontSize: FontSize.base, color: c.text }}>Friends & Shame inbox</Text>
              <Text style={{ color: c.textMuted }}>→</Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              onPress={signOut}
              style={{ padding: Spacing.lg }}
            >
              <Text style={{ fontSize: FontSize.base, color: c.danger, fontWeight: "600" }}>Sign out</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
