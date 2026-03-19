import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";

interface LeaderboardUser {
  id: string;
  name: string;
  total_xp: number;
  streak_count: number;
  level: number;
}

const LEAGUE_COLORS = ["#58CC02", "#1CB0F6", "#9B59B6", "#FF9600"];
const LEAGUE_NAMES = ["Bronze League", "Silver League", "Gold League", "Diamond League"];

function getMedalColor(rank: number) {
  if (rank === 1) return "#FFD700"; // Gold
  if (rank === 2) return "#C0C0C0"; // Silver
  if (rank === 3) return "#CD7F32"; // Bronze
  return null;
}

export default function LeaderboardTab() {
  const c = useTheme();
  const { userId, level } = useGameStore();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const leagueIndex = Math.min(Math.floor((level - 1) / 3), 3);
  const leagueName = LEAGUE_NAMES[leagueIndex];
  const leagueColor = LEAGUE_COLORS[leagueIndex];

  async function loadLeaderboard() {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, total_xp, streak_count, level")
      .order("total_xp", { ascending: false })
      .limit(50);
    if (error) console.error("Leaderboard fetch error:", error.message);
    setUsers((data as LeaderboardUser[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadLeaderboard(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  }

  const myRank = users.findIndex((u) => u.id === userId) + 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
        alignItems: "center",
        gap: Spacing.xs,
      }}>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: Spacing.sm,
          backgroundColor: `${leagueColor}22`,
          paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
          borderRadius: Radius.full, borderWidth: 1.5, borderColor: leagueColor,
        }}>
          <Ionicons name="trophy" size={16} color={leagueColor} />
          <Text style={{ color: leagueColor, fontWeight: "700", fontSize: FontSize.sm }}>
            {leagueName}
          </Text>
        </View>
        <Text style={{ fontSize: FontSize.xxl, fontWeight: "800", color: c.text, marginTop: Spacing.xs }}>
          Leaderboard
        </Text>
        <Text style={{ fontSize: FontSize.sm, color: c.textSecondary }}>
          Top learners ranked by XP
        </Text>
        {myRank > 0 && (
          <Text style={{ fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 }}>
            Your rank:{" "}
            <Text style={{ color: leagueColor, fontWeight: "700" }}>#{myRank}</Text>
          </Text>
        )}
      </View>

      {/* Weekly XP reset notice */}
      <View style={{
        marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
        backgroundColor: c.bgSecondary, borderRadius: Radius.md,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        flexDirection: "row", gap: Spacing.sm, alignItems: "center",
      }}>
        <Ionicons name="time-outline" size={14} color={c.textMuted} />
        <Text style={{ fontSize: FontSize.xs, color: c.textMuted, flex: 1 }}>
          Top 10 advance to the next league at week's end. Bottom 5 drop down.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: Spacing.xxl }} color={leagueColor} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={leagueColor} />}
        >
          {/* Top 3 podium */}
          {users.length >= 3 && (
            <View style={{
              flexDirection: "row", alignItems: "flex-end",
              justifyContent: "center", gap: Spacing.sm,
              marginBottom: Spacing.lg,
            }}>
              {/* 2nd place */}
              <PodiumCard user={users[1]} rank={2} isMe={users[1].id === userId} leagueColor={leagueColor} />
              {/* 1st place */}
              <PodiumCard user={users[0]} rank={1} isMe={users[0].id === userId} leagueColor={leagueColor} tall />
              {/* 3rd place */}
              <PodiumCard user={users[2]} rank={3} isMe={users[2].id === userId} leagueColor={leagueColor} />
            </View>
          )}

          {/* Full list from 4th onwards (or all of them) */}
          {users.slice(users.length >= 3 ? 3 : 0).map((user, idx) => {
            const rank = (users.length >= 3 ? 3 : 0) + idx + 1;
            const isMe = user.id === userId;
            return (
              <LeaderboardRow
                key={user.id}
                user={user}
                rank={rank}
                isMe={isMe}
                leagueColor={leagueColor}
              />
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PodiumCard({
  user, rank, isMe, leagueColor, tall,
}: {
  user: LeaderboardUser; rank: number; isMe: boolean; leagueColor: string; tall?: boolean;
}) {
  const c = useTheme();
  const medalColor = getMedalColor(rank)!;
  const heights = { 1: 110, 2: 75, 3: 60 };
  const podiumHeight = heights[rank as 1 | 2 | 3];

  return (
    <View style={{ alignItems: "center", flex: 1, gap: Spacing.xs }}>
      {/* Crown for 1st */}
      {rank === 1 && (
        <Ionicons name="ribbon" size={24} color="#FFD700" style={{ marginBottom: 2 }} />
      )}
      {/* Avatar circle */}
      <View style={{
        width: tall ? 60 : 50, height: tall ? 60 : 50, borderRadius: 999,
        backgroundColor: `${medalColor}33`,
        borderWidth: 2.5, borderColor: isMe ? leagueColor : medalColor,
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: tall ? 24 : 20, fontWeight: "700", color: isMe ? leagueColor : medalColor }}>
          {user.name?.charAt(0).toUpperCase() ?? "?"}
        </Text>
      </View>
      <Text style={{ fontSize: FontSize.xs, fontWeight: "600", color: isMe ? leagueColor : c.text, textAlign: "center" }} numberOfLines={1}>
        {isMe ? "You" : user.name?.split(" ")[0]}
      </Text>
      <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>{user.total_xp.toLocaleString()} XP</Text>
      {/* Podium base */}
      <View style={{
        width: "100%", height: podiumHeight,
        backgroundColor: `${medalColor}22`,
        borderTopLeftRadius: Radius.sm, borderTopRightRadius: Radius.sm,
        borderWidth: 1.5, borderColor: `${medalColor}55`,
        alignItems: "center", justifyContent: "flex-start", paddingTop: Spacing.sm,
      }}>
        <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: medalColor }}>
          {rank}
        </Text>
      </View>
    </View>
  );
}

function LeaderboardRow({
  user, rank, isMe, leagueColor,
}: {
  user: LeaderboardUser; rank: number; isMe: boolean; leagueColor: string;
}) {
  const c = useTheme();
  const medalColor = getMedalColor(rank);

  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: Spacing.md,
      backgroundColor: isMe ? `${leagueColor}18` : c.bgCard,
      borderRadius: Radius.lg, padding: Spacing.md,
      borderWidth: isMe ? 2 : 1,
      borderColor: isMe ? leagueColor : c.border,
    }}>
      {/* Rank */}
      <View style={{ width: 28, alignItems: "center" }}>
        {medalColor ? (
          <Ionicons name="medal" size={20} color={medalColor} />
        ) : (
          <Text style={{ fontSize: FontSize.sm, fontWeight: "700", color: c.textMuted }}>
            {rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View style={{
        width: 40, height: 40, borderRadius: 999,
        backgroundColor: `${leagueColor}22`,
        borderWidth: 1.5, borderColor: isMe ? leagueColor : c.border,
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: isMe ? leagueColor : c.textSecondary }}>
          {user.name?.charAt(0).toUpperCase() ?? "?"}
        </Text>
      </View>

      {/* Name + streak */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FontSize.base, fontWeight: isMe ? "700" : "600", color: isMe ? leagueColor : c.text }}>
          {isMe ? "You" : (user.name ?? "Unknown")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Ionicons name="flame" size={12} color="#FF9600" />
          <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>
            {user.streak_count ?? 0} day streak
          </Text>
        </View>
      </View>

      {/* XP */}
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: FontSize.base, fontWeight: "700", color: isMe ? leagueColor : c.text }}>
          {user.total_xp?.toLocaleString() ?? 0}
        </Text>
        <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>XP</Text>
      </View>
    </View>
  );
}
