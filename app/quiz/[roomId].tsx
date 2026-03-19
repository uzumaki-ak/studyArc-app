import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Vibration,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

type Phase = "waiting" | "playing" | "finished";

export default function QuizRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const c = useTheme();
  const router = useRouter();
  const { userId, userName, xp, setXP } = useGameStore();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL!;

  const [room, setRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [scores, setScores] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRoom();

    const roomSub = supabase
      .channel(`room:${roomId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "quiz_rooms",
        filter: `id=eq.${roomId}`,
      }, (payload) => {
        const updated = payload.new as any;
        setRoom(updated);
        if (updated.status === "active" && phase === "waiting") {
          // wait for notification with questions
        }
        if (updated.status === "finished") {
          setPhase("finished");
          loadScores();
        }
        if (updated.current_question !== currentQ && phase === "playing") {
          setCurrentQ(updated.current_question);
          setSelected(null);
          setAnswered(false);
          resetTimer();
        }
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "quiz_participants",
        filter: `room_id=eq.${roomId}`,
      }, () => loadParticipants())
      .subscribe();

    const notifSub = supabase
      .channel(`notif:quiz:${userId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const n = payload.new as any;
        if (n.type === "quiz_started" && n.payload?.room_id === roomId) {
          setQuestions(n.payload.questions ?? []);
          setPhase("playing");
          resetTimer();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSub);
      supabase.removeChannel(notifSub);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId, userId]);

  async function loadRoom() {
    const { data } = await supabase.from("quiz_rooms").select("*, skills(name)").eq("id", roomId!).single();
    setRoom(data);
    loadParticipants();
  }

  async function loadParticipants() {
    const { data } = await supabase
      .from("quiz_participants")
      .select("user_id, score, users(name)")
      .eq("room_id", roomId!);
    setParticipants(data ?? []);
  }

  async function loadScores() {
    const { data } = await supabase
      .from("quiz_participants")
      .select("user_id, score, users(name)")
      .eq("room_id", roomId!)
      .order("score", { ascending: false });
    setScores(data ?? []);
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(20);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!answered) handleAnswer("__timeout__");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  async function handleAnswer(ans: string) {
    if (answered) return;
    setSelected(ans);
    setAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const q = questions[currentQ];
    if (ans === q?.answer) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    } else {
      Vibration.vibrate(100);
    }

    await fetch(`${apiUrl}/api/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "answer", userId, roomId, questionIndex: currentQ, answer: ans }),
    });

    loadParticipants();
  }

  async function startQuiz() {
    await fetch(`${apiUrl}/api/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", roomId }),
    });
  }

  if (!room) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={c.text} />
    </SafeAreaView>
  );

  const isHost = userId === room.host_id;
  const q = questions[currentQ];
  const myScore = participants.find((p) => p.user_id === userId)?.score ?? 0;

  // ── WAITING ────────────────────────────────────────────
  if (phase === "waiting") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl, alignItems: "center" }}>
          <View style={{ backgroundColor: c.text, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: "center", width: "100%" }}>
            <Text style={{ fontSize: FontSize.xs, color: "#737373", letterSpacing: 2, textTransform: "uppercase", marginBottom: Spacing.sm }}>
              Room code
            </Text>
            <Text style={{ fontSize: 48, fontFamily: "monospace", fontWeight: "700", color: c.accentFg, letterSpacing: 8 }}>
              {room.code}
            </Text>
            {room.wager_xp > 0 && (
              <Text style={{ fontSize: FontSize.sm, color: "#737373", marginTop: Spacing.sm }}>
                {room.wager_xp} XP wagered per player
              </Text>
            )}
          </View>

          <View style={{ width: "100%", gap: Spacing.sm }}>
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
              Players ({participants.length})
            </Text>
            {participants.map((p) => (
              <View key={p.user_id} style={{
                flexDirection: "row", alignItems: "center", gap: Spacing.md,
                backgroundColor: c.bgCard, borderRadius: Radius.md,
                borderWidth: 1, borderColor: c.border, padding: Spacing.md,
              }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.bgSecondary, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: "700", color: c.text }}>
                    {((p.users as any)?.name ?? "?").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: FontSize.base, color: c.text, flex: 1 }}>
                  {(p.users as any)?.name}
                </Text>
                {p.user_id === room.host_id && (
                  <View style={{ backgroundColor: c.text, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 999 }}>
                    <Text style={{ fontSize: 10, color: c.accentFg, fontWeight: "700" }}>HOST</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {isHost ? (
            <TouchableOpacity
              onPress={startQuiz}
              style={{ backgroundColor: c.text, borderRadius: Radius.lg, padding: Spacing.lg, width: "100%", alignItems: "center" }}
            >
              <Text style={{ color: c.accentFg, fontWeight: "700", fontSize: FontSize.md }}>
                Start quiz ({participants.length} player{participants.length !== 1 ? "s" : ""})
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: c.textMuted, fontSize: FontSize.sm }}>Waiting for host to start...</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────
  if (phase === "playing" && q) {
    const isCorrect = selected === q.answer;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          {/* Top bar */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, fontFamily: "monospace" }}>
              Q{currentQ + 1}/{questions.length}
            </Text>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              borderWidth: 2,
              borderColor: timeLeft <= 5 ? c.danger : c.border,
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: FontSize.base, fontWeight: "700", color: timeLeft <= 5 ? c.danger : c.text }}>
                {timeLeft}
              </Text>
            </View>
            <Text style={{ fontSize: FontSize.sm, color: c.text, fontFamily: "monospace" }}>
              {myScore}pts
            </Text>
          </View>

          {/* Mini scoreboard */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              {participants.sort((a, b) => b.score - a.score).map((p) => (
                <View key={p.user_id} style={{
                  alignItems: "center", gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                  borderRadius: Radius.md, borderWidth: 1,
                  borderColor: p.user_id === userId ? c.text : c.border,
                  backgroundColor: p.user_id === userId ? c.bgSecondary : c.bgCard,
                }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.text }}>
                    {((p.users as any)?.name ?? "?").split(" ")[0]}
                  </Text>
                  <Text style={{ fontSize: FontSize.xs, fontFamily: "monospace", color: c.textSecondary }}>
                    {p.score}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Question */}
          <Animated.View style={{
            backgroundColor: c.bgCard,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: c.border,
            padding: Spacing.xl,
            gap: Spacing.lg,
            transform: [{ translateX: shakeAnim }],
          }}>
            <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: c.text, lineHeight: 24 }}>
              {q.q}
            </Text>

            <View style={{ gap: Spacing.sm }}>
              {q.options?.map((opt: string) => {
                let bg = c.bgSecondary;
                let textCol = c.text;
                let border = c.border;

                if (answered) {
                  if (opt === q.answer) { bg = c.text; textCol = c.accentFg; border = c.text; }
                  else if (opt === selected && !isCorrect) { bg = c.bgSecondary; textCol = c.textMuted; }
                } else if (selected === opt) {
                  bg = c.text; textCol = c.accentFg; border = c.text;
                }

                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => !answered && handleAnswer(opt)}
                    disabled={answered}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: bg, borderRadius: Radius.md,
                      borderWidth: 1.5, borderColor: border,
                      padding: Spacing.lg,
                    }}
                  >
                    <Text style={{ fontSize: FontSize.base, color: textCol, fontWeight: "500" }}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {answered && (
              <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing.md }}>
                <Text style={{ fontSize: FontSize.sm, fontWeight: "700", color: c.text }}>
                  {isCorrect ? "+1 point!" : `Answer: ${q.answer}`}
                </Text>
                <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, marginTop: 4 }}>
                  {q.explanation}
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────
  const winner = scores[0];
  const isWinner = winner?.user_id === userId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, alignItems: "center", gap: Spacing.xl }}>
        <Text style={{ fontSize: 64, marginTop: Spacing.xl }}>{isWinner ? "★" : "●"}</Text>
        <Text style={{ fontSize: FontSize.xxl, fontWeight: "700", color: c.text }}>
          {isWinner ? "You won!" : "Game over"}
        </Text>
        {isWinner && room.wager_xp > 0 && (
          <Text style={{ fontSize: FontSize.sm, color: c.textSecondary }}>
            +{room.wager_xp * scores.length} XP added
          </Text>
        )}

        <View style={{ width: "100%", gap: Spacing.sm }}>
          {scores.map((p, i) => (
            <View key={p.user_id} style={{
              flexDirection: "row", alignItems: "center", gap: Spacing.md,
              backgroundColor: i === 0 ? c.text : c.bgCard,
              borderRadius: Radius.lg, borderWidth: 1,
              borderColor: i === 0 ? c.text : c.border,
              padding: Spacing.lg,
            }}>
              <Text style={{ fontSize: FontSize.sm, color: i === 0 ? c.accentFg : c.textMuted, fontFamily: "monospace", width: 20 }}>
                #{i + 1}
              </Text>
              <Text style={{ flex: 1, fontSize: FontSize.base, fontWeight: "600", color: i === 0 ? c.accentFg : c.text }}>
                {(p.users as any)?.name}
              </Text>
              <Text style={{ fontSize: FontSize.sm, fontFamily: "monospace", fontWeight: "700", color: i === 0 ? c.accentFg : c.text }}>
                {p.score}pts
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push("/quiz/lobby")}
          style={{ backgroundColor: c.text, borderRadius: Radius.lg, padding: Spacing.lg, width: "100%", alignItems: "center" }}
        >
          <Text style={{ color: c.accentFg, fontWeight: "700", fontSize: FontSize.md }}>Play again</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
