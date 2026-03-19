import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "@/store/gameStore";
import { supabase } from "@/lib/supabase";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { Button, Input } from "@/components/ui";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizLobbyScreen() {
  const c = useTheme();
  const router = useRouter();
  const { userId, xp } = useGameStore();

  const [tab, setTab] = useState<"create" | "join">("create");
  const [skills, setSkills] = useState<any[]>([]);
  const [skillId, setSkillId] = useState("");
  const [wager, setWager] = useState(0);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("skills").select("id, name, courses(title)").limit(20)
      .then(({ data }) => setSkills(data ?? []));
  }, []);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL!;

  async function create() {
    setLoading(true); setError("");
    const res = await fetch(`${apiUrl}/api/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", userId, skillId: skillId || null, wagerXP: wager }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(`/quiz/${data.room.id}`);
  }

  async function join() {
    if (!joinCode.trim()) { setError("Enter a room code"); return; }
    setLoading(true); setError("");
    const res = await fetch(`${apiUrl}/api/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", userId, code: joinCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(`/quiz/${data.room.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: FontSize.xxl, fontWeight: "700", color: c.text }}>Quiz Battle</Text>
          <Text style={{ fontSize: FontSize.sm, color: c.textSecondary }}>
            Match with players · Wager XP · Winner takes all
          </Text>

          {/* Tab switcher */}
          <View style={{ flexDirection: "row", backgroundColor: c.bgSecondary, borderRadius: Radius.lg, padding: 4, gap: 4 }}>
            {(["create", "join"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={{
                  flex: 1,
                  paddingVertical: Spacing.sm,
                  borderRadius: Radius.md,
                  backgroundColor: tab === t ? c.bgCard : "transparent",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: tab === t ? c.text : c.textMuted, textTransform: "capitalize" }}>
                  {t === "create" ? "Create room" : "Join room"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === "create" ? (
            <View style={{ gap: Spacing.md }}>
              {/* Skill picker */}
              <View>
                <Text style={{ fontSize: FontSize.sm, fontWeight: "500", color: c.text, marginBottom: Spacing.sm }}>
                  Topic (optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 0 }}>
                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    <TouchableOpacity
                      onPress={() => setSkillId("")}
                      style={{
                        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                        borderRadius: Radius.full, borderWidth: 1,
                        borderColor: !skillId ? c.text : c.border,
                        backgroundColor: !skillId ? c.text : "transparent",
                      }}
                    >
                      <Text style={{ fontSize: FontSize.xs, fontWeight: "600", color: !skillId ? c.accentFg : c.textSecondary }}>
                        General
                      </Text>
                    </TouchableOpacity>
                    {skills.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => setSkillId(s.id)}
                        style={{
                          paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                          borderRadius: Radius.full, borderWidth: 1,
                          borderColor: skillId === s.id ? c.text : c.border,
                          backgroundColor: skillId === s.id ? c.text : "transparent",
                        }}
                      >
                        <Text style={{ fontSize: FontSize.xs, fontWeight: "600", color: skillId === s.id ? c.accentFg : c.textSecondary }}>
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Wager */}
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: "500", color: c.text }}>
                    XP Wager: {wager}
                  </Text>
                  <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>You have {xp} XP</Text>
                </View>
                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  {[0, 10, 25, 50, 100].map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setWager(Math.min(val, xp))}
                      style={{
                        flex: 1,
                        paddingVertical: Spacing.sm,
                        borderRadius: Radius.md,
                        borderWidth: 1,
                        borderColor: wager === val ? c.text : c.border,
                        backgroundColor: wager === val ? c.text : "transparent",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: FontSize.xs, fontWeight: "600", color: wager === val ? c.accentFg : c.textSecondary }}>
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {wager > 0 && (
                  <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginTop: Spacing.xs }}>
                    Winner takes {wager} × players XP
                  </Text>
                )}
              </View>

              {error ? <Text style={{ color: c.danger, fontSize: FontSize.sm }}>{error}</Text> : null}
              <Button label={loading ? "Creating..." : "Create room"} onPress={create} loading={loading} />
            </View>
          ) : (
            <View style={{ gap: Spacing.md }}>
              <View>
                <Text style={{ fontSize: FontSize.sm, fontWeight: "500", color: c.text, marginBottom: Spacing.sm }}>
                  Room code
                </Text>
                <TextInput
                  value={joinCode}
                  onChangeText={(t) => setJoinCode(t.toUpperCase())}
                  placeholder="ABC123"
                  placeholderTextColor={c.textMuted}
                  maxLength={6}
                  autoCapitalize="characters"
                  style={{
                    backgroundColor: c.bgCard,
                    borderWidth: 1.5,
                    borderColor: joinCode.length === 6 ? c.text : c.border,
                    borderRadius: Radius.md,
                    padding: Spacing.lg,
                    color: c.text,
                    fontSize: 28,
                    fontFamily: "monospace",
                    fontWeight: "700",
                    letterSpacing: 8,
                    textAlign: "center",
                  }}
                />
              </View>
              {error ? <Text style={{ color: c.danger, fontSize: FontSize.sm }}>{error}</Text> : null}
              <Button label={loading ? "Joining..." : "Join room"} onPress={join} loading={loading} disabled={joinCode.length < 6} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
