import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Animated, Vibration, ActivityIndicator, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { HeartBar } from "@/components/game";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const router = useRouter();
  const { userId, hearts, setHearts, xp, setXP } = useGameStore();

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; explanation: string; xpEarned?: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);

  // Animations
  const xpAnim = useRef(new Animated.Value(0)).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;
  const heartShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("challenges")
        .select("*, skills(name, course_id)")
        .eq("id", id!)
        .single();
      setChallenge(data);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  function triggerXPPop(amount: number) {
    xpOpacity.setValue(1);
    Animated.sequence([
      Animated.timing(xpAnim, { toValue: -60, duration: 600, useNativeDriver: true }),
      Animated.timing(xpOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => xpAnim.setValue(0));
  }

  function triggerHeartShake() {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(heartShake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(heartShake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(heartShake, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(heartShake, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(heartShake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function submitAnswer(answer: string) {
    if (answered || !answer.trim()) return;
    setSubmitting(true);
    setSelected(answer);

    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const res = await fetch(`${apiUrl}/api/xp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        challengeId: challenge.id,
        answer,
        correctAnswer: challenge.correct_answer,
        xpReward: challenge.xp_reward,
        skillId: challenge.skill_id,
      }),
    });

    const data = await res.json();
    setSubmitting(false);
    setAnswered(true);
    setResult(data);

    if (data.correct) {
      triggerXPPop(data.xpEarned ?? challenge.xp_reward);
      setXP(data.newXP ?? xp + challenge.xp_reward);
    } else {
      triggerHeartShake();
      setHearts(Math.max(0, hearts - 1));
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.text} />
      </SafeAreaView>
    );
  }

  const q = challenge?.question_data;
  const skill = challenge?.skills;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* XP Pop */}
      <Animated.View style={{
        position: "absolute",
        top: 120,
        alignSelf: "center",
        zIndex: 100,
        transform: [{ translateY: xpAnim }],
        opacity: xpOpacity,
      }}>
        <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: c.text }}>
          +{result?.xpEarned ?? challenge?.xp_reward} XP
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg, flexGrow: 1 }}>
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← {skill?.name}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: FontSize.xs, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
              {challenge?.type}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary }}>
              {"●".repeat(challenge?.difficulty ?? 1)}{"○".repeat(5 - (challenge?.difficulty ?? 1))}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ translateX: heartShake }] }}>
            <HeartBar />
          </Animated.View>
          <View style={{
            backgroundColor: c.bgSecondary,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs,
            borderRadius: Radius.full,
          }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.text, fontFamily: "monospace" }}>
              +{challenge?.xp_reward} XP
            </Text>
          </View>
        </View>

        {/* Question card */}
        <View style={{
          backgroundColor: c.bgCard,
          borderRadius: Radius.xl,
          borderWidth: 1,
          borderColor: c.border,
          padding: Spacing.xl,
          gap: Spacing.lg,
        }}>
          <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: c.text, lineHeight: 24 }}>
            {q?.text}
          </Text>

          {/* MCQ Options */}
          {challenge?.type === "mcq" && q?.options && (
            <View style={{ gap: Spacing.sm }}>
              {q.options.map((opt: string, i: number) => {
                let bg = c.bgSecondary;
                let textCol = c.text;
                let borderCol = c.border;

                if (answered) {
                  if (opt === challenge.correct_answer) { bg = c.text; textCol = c.accentFg; borderCol = c.text; }
                  else if (opt === selected) { bg = c.bgSecondary; textCol = c.textMuted; }
                } else if (selected === opt) {
                  bg = c.text; textCol = c.accentFg; borderCol = c.text;
                }

                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => !answered && submitAnswer(opt)}
                    disabled={answered || submitting}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: bg,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderBottomWidth: answered ? 2 : 4,
                      borderColor: borderCol,
                      padding: Spacing.lg,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.md,
                    }}
                  >
                    <Text style={{ fontSize: FontSize.xs, color: textCol === c.accentFg ? c.accentFg : c.textMuted, fontFamily: "monospace", fontWeight: "700" }}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                    <Text style={{ fontSize: FontSize.base, color: textCol, flex: 1, fontWeight: "500" }}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Short answer */}
          {challenge?.type !== "mcq" && (
            <View style={{ gap: Spacing.sm }}>
              <TextInput
                value={shortAnswer}
                onChangeText={setShortAnswer}
                placeholder="Type your answer..."
                placeholderTextColor={c.textMuted}
                editable={!answered}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: c.bgSecondary,
                  borderRadius: Radius.md,
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: Spacing.md,
                  color: c.text,
                  fontSize: FontSize.base,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
              />
              {!answered && (
                <TouchableOpacity
                  onPress={() => submitAnswer(shortAnswer)}
                  disabled={!shortAnswer.trim() || submitting}
                  style={{
                    backgroundColor: c.text,
                    borderRadius: Radius.md,
                    padding: Spacing.md,
                    alignItems: "center",
                    opacity: !shortAnswer.trim() ? 0.4 : 1,
                  }}
                >
                  <Text style={{ color: c.accentFg, fontWeight: "600" }}>
                    {submitting ? "Checking..." : "Submit"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Voice answer button */}
          {!answered && (
            <TouchableOpacity
              onPress={() => {}}
              style={{
                borderWidth: 1,
                borderColor: listening ? c.text : c.border,
                borderRadius: Radius.md,
                padding: Spacing.md,
                alignItems: "center",
                backgroundColor: listening ? c.bgSecondary : "transparent",
              }}
            >
              <Text style={{ fontSize: FontSize.sm, color: listening ? c.text : c.textMuted }}>
                {listening ? "Listening... speak your answer" : "Speak answer"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Feedback */}
          {answered && result && (
            <View style={{
              borderTopWidth: 1,
              borderTopColor: c.border,
              paddingTop: Spacing.lg,
              gap: Spacing.sm,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: result.correct ? c.text : c.bgSecondary,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 12, color: result.correct ? c.accentFg : c.textMuted }}>
                    {result.correct ? "✓" : "✗"}
                  </Text>
                </View>
                <Text style={{ fontSize: FontSize.base, fontWeight: "700", color: c.text }}>
                  {result.correct ? `Correct! +${result.xpEarned} XP` : "Not quite"}
                </Text>
              </View>
              {result.explanation ? (
                <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, lineHeight: 20 }}>
                  {result.explanation}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  backgroundColor: c.text,
                  borderRadius: Radius.md,
                  padding: Spacing.md,
                  alignItems: "center",
                  marginTop: Spacing.sm,
                }}
              >
                <Text style={{ color: c.accentFg, fontWeight: "600" }}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Hint */}
        {q?.hints?.length > 0 && !answered && (
          <TouchableOpacity style={{
            borderWidth: 1, borderColor: c.border, borderRadius: Radius.md,
            padding: Spacing.md, alignItems: "center",
          }}>
            <Text style={{ fontSize: FontSize.sm, color: c.textMuted }}>Show hint</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
