import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Animated, Vibration,
} from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

type Phase = "setup" | "battle" | "victory" | "defeat";

interface Question { q: string; options: string[]; answer: string; explanation: string }

export default function BossScreen() {
  const c = useTheme();
  const router = useRouter();
  const { userId, xp, setXP } = useGameStore();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL!;

  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("general knowledge");
  const [bossHP, setBossHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const bossAnim = React.useRef(new Animated.Value(0)).current;
  const playerAnim = React.useRef(new Animated.Value(0)).current;

  const TOPICS = ["Python", "Math", "History", "Science", "English", "General"];

  async function startBattle() {
    setLoading(true);
    const res = await fetch(`${apiUrl}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `Generate exactly 8 multiple choice questions about "${topic}". Return ONLY a JSON array:\n[{"q":"...","options":["A","B","C","D"],"answer":"A","explanation":"..."}]`,
        }],
        systemPrompt: "Return only valid JSON, no markdown.",
      }),
    });
    const data = await res.json();
    setLoading(false);

    try {
      const qs = JSON.parse(data.text.replace(/```json|```/g, "").trim());
      setQuestions(qs);
      setPhase("battle");
      setBossHP(100);
      setPlayerHP(5);
      setCurrentQ(0);
      setScore(0);
    } catch {
      setLoading(false);
    }
  }

  function shakeAnim(ref: Animated.Value) {
    Animated.sequence([
      Animated.timing(ref, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(ref, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(ref, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(ref, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function handleAnswer(opt: string) {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const q = questions[currentQ];
    const correct = opt === q.answer;

    if (correct) {
      shakeAnim(bossAnim);
      const dmg = 10 + Math.floor(Math.random() * 5);
      const newHP = Math.max(0, bossHP - dmg);
      setBossHP(newHP);
      setScore((s) => s + 1);
      if (newHP <= 0) { setTimeout(() => setPhase("victory"), 800); return; }
    } else {
      shakeAnim(playerAnim);
      Vibration.vibrate(150);
      const newHP = playerHP - 1;
      setPlayerHP(newHP);
      if (newHP <= 0) { setTimeout(() => setPhase("defeat"), 800); return; }
    }
  }

  function nextQuestion() {
    if (currentQ + 1 >= questions.length) {
      setPhase(bossHP > 0 ? "defeat" : "victory");
      return;
    }
    setCurrentQ((q) => q + 1);
    setSelected(null);
    setAnswered(false);
  }

  if (phase === "setup") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: FontSize.xxl, fontWeight: "700", color: c.text }}>Boss Fight</Text>

          <View style={{
            backgroundColor: c.danger, borderRadius: Radius.xl,
            padding: Spacing.xl, alignItems: "center", gap: Spacing.md,
          }}>
            <Text style={{ fontSize: 64, color: c.accentFg }}>◆</Text>
            <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: c.accentFg }}>
              The Knowledge Golem
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: c.accentFg + "CC" }}>100 HP · 8 questions · 5 hearts</Text>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.textSecondary }}>CHOOSE TOPIC</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
              {TOPICS.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTopic(t.toLowerCase())}
                  style={{
                    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
                    borderRadius: Radius.full, borderWidth: 1,
                    borderColor: topic === t.toLowerCase() ? c.text : c.border,
                    backgroundColor: topic === t.toLowerCase() ? c.text : "transparent",
                  }}
                >
                  <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: topic === t.toLowerCase() ? c.accentFg : c.textSecondary }}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={startBattle}
            disabled={loading}
            style={{
              backgroundColor: c.text, borderRadius: Radius.lg,
              padding: Spacing.lg, alignItems: "center",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Text style={{ color: c.accentFg, fontWeight: "700", fontSize: FontSize.md }}>
              {loading ? "Summoning boss..." : "Fight!"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === "battle") {
    const q = questions[currentQ];
    const bossPhase = bossHP > 70 ? 0 : bossHP > 30 ? 1 : 2;
    const phaseLabels = ["Warming Up", "Getting Serious", "Final Form"];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          {/* Boss + Player */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Animated.View style={{ alignItems: "center", transform: [{ translateX: bossAnim }] }}>
              <Text style={{ fontSize: 40 }}>◆</Text>
              <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>Boss</Text>
            </Animated.View>

            <Text style={{ fontSize: FontSize.xs, color: c.textMuted, fontFamily: "monospace" }}>
              Q{currentQ + 1}/{questions.length}
            </Text>

            <Animated.View style={{ alignItems: "center", transform: [{ translateX: playerAnim }] }}>
              <View style={{ flexDirection: "row" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Text key={i} style={{ fontSize: 14, color: i < playerHP ? c.danger : c.border }}>♥</Text>
                ))}
              </View>
              <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>You</Text>
            </Animated.View>
          </View>

          {/* Boss HP */}
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: FontSize.xs, color: c.textSecondary }}>{phaseLabels[bossPhase]}</Text>
              <Text style={{ fontSize: FontSize.xs, fontFamily: "monospace", color: c.text }}>{bossHP} HP</Text>
            </View>
            <View style={{ height: 10, backgroundColor: c.bgSecondary, borderRadius: 5, overflow: "hidden" }}>
              <View style={{
                width: `${bossHP}%`, height: "100%", borderRadius: 5,
                backgroundColor: bossHP > 50 ? c.text : bossHP > 20 ? c.danger : c.danger,
              }} />
            </View>
          </View>

          {/* Question */}
          <View style={{
            backgroundColor: c.bgCard, borderRadius: Radius.xl,
            borderWidth: 1, borderColor: c.border, padding: Spacing.xl, gap: Spacing.lg,
          }}>
            <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: c.text, lineHeight: 24 }}>
              {q?.q}
            </Text>

            <View style={{ gap: Spacing.sm }}>
              {q?.options?.map((opt: string) => {
                let bg = c.bgSecondary;
                let textCol = c.text;
                let border = c.border;

                if (answered) {
                  if (opt === q.answer) { bg = c.text; textCol = c.accentFg; border = c.text; }
                  else if (opt === selected) { bg = c.bgSecondary; textCol = c.textMuted; }
                } else if (selected === opt) {
                  bg = c.text; textCol = c.accentFg; border = c.text;
                }

                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => handleAnswer(opt)}
                    disabled={answered}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: bg, borderRadius: Radius.md,
                      borderWidth: 1.5, borderColor: border, padding: Spacing.lg,
                    }}
                  >
                    <Text style={{ fontSize: FontSize.base, color: textCol, fontWeight: "500" }}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {answered && (
              <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing.md, gap: Spacing.sm }}>
                <Text style={{ fontSize: FontSize.sm, color: c.textSecondary }}>{q?.explanation}</Text>
                <TouchableOpacity
                  onPress={nextQuestion}
                  style={{ backgroundColor: c.text, borderRadius: Radius.md, padding: Spacing.md, alignItems: "center" }}
                >
                  <Text style={{ color: c.accentFg, fontWeight: "600" }}>Next →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: Spacing.xl }}>
      <Text style={{ fontSize: 64, marginBottom: Spacing.lg }}>{phase === "victory" ? "★" : "●"}</Text>
      <Text style={{ fontSize: FontSize.xxl, fontWeight: "700", color: c.text, marginBottom: Spacing.sm }}>
        {phase === "victory" ? "Boss defeated!" : "Defeated..."}
      </Text>
      <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, marginBottom: Spacing.xl, textAlign: "center" }}>
        {phase === "victory"
          ? `${score}/8 correct — you drained the boss!`
          : `Boss survived with ${bossHP} HP`}
      </Text>
      {phase === "victory" && (
        <Text style={{ fontSize: FontSize.sm, color: c.textMuted, marginBottom: Spacing.xl }}>
          +{score * 15} XP earned
        </Text>
      )}
      <TouchableOpacity
        onPress={() => setPhase("setup")}
        style={{ backgroundColor: c.text, borderRadius: Radius.lg, padding: Spacing.lg, paddingHorizontal: Spacing.xxl }}
      >
        <Text style={{ color: c.accentFg, fontWeight: "700" }}>Fight again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
