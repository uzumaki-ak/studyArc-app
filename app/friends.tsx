import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FriendsScreen() {
  const c = useTheme();
  const router = useRouter();
  const { userId } = useGameStore();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL!;

  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [shames, setShames] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (userId) loadAll();
  }, [userId]);

  async function loadAll() {
    const [{ data: f }, { data: p }, { data: s }] = await Promise.all([
      supabase
        .from("friends")
        .select("id, friend_id, users!friends_friend_id_fkey(id, name, total_xp, streak_count)")
        .eq("user_id", userId!)
        .eq("status", "accepted"),
      supabase
        .from("friends")
        .select("id, user_id, users!friends_user_id_fkey(id, name)")
        .eq("friend_id", userId!)
        .eq("status", "pending"),
      supabase
        .from("shame_logs")
        .select("id, user_id, message, sent_at, users!shame_logs_user_id_fkey(name)")
        .eq("friend_id", userId!)
        .is("read_at", null)
        .order("sent_at", { ascending: false }),
    ]);
    setFriends(f ?? []);
    setPending(p ?? []);
    setShames(s ?? []);
  }

  async function sendRequest() {
    if (!searchEmail.trim()) return;
    setSearching(true);
    const { data: target } = await supabase
      .from("users")
      .select("id, name")
      .eq("email", searchEmail.trim().toLowerCase())
      .single();
    if (!target) { Alert.alert("User not found"); setSearching(false); return; }
    if (target.id === userId) { Alert.alert("That's you!"); setSearching(false); return; }
    await supabase.from("friends").insert({ user_id: userId!, friend_id: target.id });
    Alert.alert("Request sent", `Friend request sent to ${target.name}`);
    setSearchEmail("");
    setSearching(false);
  }

  async function acceptRequest(id: string, fromId: string) {
    await supabase.from("friends").update({ status: "accepted" }).eq("id", id);
    await supabase.from("friends").upsert({ user_id: fromId, friend_id: userId!, status: "accepted" });
    loadAll();
  }

  async function acknowledgeShame(shameId: string) {
    const res = await fetch(`${apiUrl}/api/shame`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shameLogId: shameId, friendId: userId }),
    });
    if (res.ok) {
      setShames((s) => s.filter((x) => x.id !== shameId));
      Alert.alert("Forgiven", "You've freed them. For now.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: c.text }}>Friends</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Shame inbox */}
        {shames.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
              <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: c.text }}>Shame inbox</Text>
              <View style={{ backgroundColor: c.text, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 11, color: c.accentFg, fontWeight: "700" }}>{shames.length}</Text>
              </View>
            </View>
            {shames.map((s) => (
              <View key={s.id} style={{
                backgroundColor: c.bgCard, borderRadius: Radius.lg,
                borderWidth: 1, borderColor: c.border, padding: Spacing.lg,
                gap: Spacing.sm,
              }}>
                <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>
                  {s.users?.name} confesses:
                </Text>
                <Text style={{ fontSize: FontSize.sm, color: c.text, fontStyle: "italic" }}>
                  "{s.message}"
                </Text>
                <TouchableOpacity
                  onPress={() => acknowledgeShame(s.id)}
                  style={{
                    backgroundColor: c.text, borderRadius: Radius.md,
                    padding: Spacing.sm, alignItems: "center", alignSelf: "flex-end",
                    paddingHorizontal: Spacing.lg,
                  }}
                >
                  <Text style={{ color: c.accentFg, fontWeight: "600", fontSize: FontSize.sm }}>Forgive</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add friend */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: c.text }}>Add friend</Text>
          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <TextInput
              value={searchEmail}
              onChangeText={setSearchEmail}
              placeholder="friend@email.com"
              placeholderTextColor={c.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                flex: 1, backgroundColor: c.bgCard,
                borderWidth: 1, borderColor: c.border,
                borderRadius: Radius.md, paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.md, color: c.text, fontSize: FontSize.base,
              }}
              onSubmitEditing={sendRequest}
            />
            <TouchableOpacity
              onPress={sendRequest}
              disabled={searching || !searchEmail.trim()}
              style={{
                backgroundColor: c.text, borderRadius: Radius.md,
                paddingHorizontal: Spacing.lg, alignItems: "center", justifyContent: "center",
                opacity: !searchEmail.trim() ? 0.5 : 1,
              }}
            >
              <Text style={{ color: c.accentFg, fontWeight: "600" }}>
                {searching ? "..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending */}
        {pending.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: c.text }}>Pending ({pending.length})</Text>
            {pending.map((r) => (
              <View key={r.id} style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: c.bgCard, borderRadius: Radius.md,
                borderWidth: 1, borderColor: c.border, padding: Spacing.md, gap: Spacing.md,
              }}>
                <Text style={{ flex: 1, fontSize: FontSize.base, color: c.text }}>
                  {r.users?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => acceptRequest(r.id, r.user_id)}
                  style={{ backgroundColor: c.text, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs }}
                >
                  <Text style={{ color: c.accentFg, fontWeight: "600", fontSize: FontSize.sm }}>Accept</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Friends list */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: c.text }}>
            Friends ({friends.length})
          </Text>
          {friends.length > 0 ? friends.map((f) => {
            const u = f.users;
            return (
              <View key={f.id} style={{
                flexDirection: "row", alignItems: "center", gap: Spacing.md,
                backgroundColor: c.bgCard, borderRadius: Radius.lg,
                borderWidth: 1, borderColor: c.border, padding: Spacing.lg,
              }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgSecondary, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontWeight: "700", color: c.textSecondary, fontSize: FontSize.sm }}>
                    {u?.name?.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.base, fontWeight: "600", color: c.text }}>{u?.name}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>
                    {u?.total_xp?.toLocaleString()} XP · {u?.streak_count}d streak
                  </Text>
                </View>
              </View>
            );
          }) : (
            <Text style={{ fontSize: FontSize.sm, color: c.textMuted }}>No friends yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
