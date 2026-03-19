import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  user_id: string;
  role: "user" | "ai";
  content: string;
  created_at: string;
  users?: { name: string } | null;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export default function StudyRoomScreen() {
  const params = useLocalSearchParams<{ sessionId: string; topic: string }>();
  const c = useTheme();
  const router = useRouter();
  const { userId, userName } = useGameStore();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL!;

  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"chat" | "flashcards">("chat");
  const [sessionId, setSessionId] = useState<string | null>(params.sessionId ?? null);
  const [topic, setTopic] = useState(params.topic ?? "");
  const [loading, setLoading] = useState(!!params.sessionId);
  const [creating, setCreating] = useState(!params.sessionId);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (sessionId) {
      loadSession();
      subscribeToMessages();
    }
  }, [sessionId]);

  async function loadSession() {
    setLoading(true);
    const [{ data: msgs }, { data: parts }, { data: cards }] = await Promise.all([
      supabase
        .from("study_session_messages")
        .select("*, users(name)")
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: true })
        .limit(100),
      supabase
        .from("study_session_participants")
        .select("user_id, users(id, name)")
        .eq("session_id", sessionId!),
      supabase
        .from("study_flashcards")
        .select("*")
        .eq("session_id", sessionId!),
    ]);
    setMessages((msgs as Message[]) ?? []);
    setParticipants(parts ?? []);
    setFlashcards(cards ?? []);
    setLoading(false);
  }

  function subscribeToMessages() {
    const sub = supabase
      .channel(`study:${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "study_session_messages",
        filter: `session_id=eq.${sessionId}`,
      }, async (payload) => {
        const msg = payload.new as Message;
        // Fetch user name
        if (msg.role === "user" && msg.user_id !== userId) {
          const { data: u } = await supabase.from("users").select("name").eq("id", msg.user_id).single();
          setMessages((prev) => [...prev, { ...msg, users: u }]);
        } else if (msg.role === "ai") {
          setMessages((prev) => [...prev, msg]);
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "study_flashcards",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setFlashcards((prev) => [...prev, payload.new as Flashcard]);
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }

  async function createSession() {
    if (!topic.trim()) return;
    setCreating(false);
    setLoading(true);

    const { data: session, error } = await supabase
      .from("study_sessions")
      .insert({
        host_id: userId,
        topic: topic.trim(),
        status: "active",
        source_type: "text",
      })
      .select()
      .single();

    if (error || !session) { setLoading(false); return; }

    await supabase.from("study_session_participants").insert({
      session_id: session.id,
      user_id: userId,
    });

    // Send welcome AI message BEFORE setting sessionId so loadSession() picks it up
    await sendAIMessage(session.id, `Welcome to the study session on "${topic}"! I'm your AI tutor. Ask me anything, request practice questions, or say "generate flashcards" to get study cards.`);

    setSessionId(session.id);
  }

  async function sendAIMessage(sid: string, content: string) {
    await supabase.from("study_session_messages").insert({
      session_id: sid,
      user_id: userId,
      role: "ai",
      content,
    });
  }

  async function sendMessage() {
    if (!input.trim() || !sessionId || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Save user message
    await supabase.from("study_session_messages").insert({
      session_id: sessionId,
      user_id: userId,
      role: "user",
      content: text,
    });

    // Add to local state immediately
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      session_id: sessionId,
      user_id: userId!,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
      users: { name: userName ?? "You" },
    }]);

    // Check for flashcard command
    const wantsFlashcards = /flashcard|flash card|flash|cards/i.test(text);

    // Get AI response
    const history = messages.slice(-8).map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    }));

    const systemPrompt = wantsFlashcards
      ? `You are a study tutor for "${topic}". The student wants flashcards. Generate 5 flashcards as JSON array: [{"question":"...","answer":"..."}]. Then give a short message saying you've generated them. Start your response with the JSON array.`
      : `You are a helpful study tutor for "${topic}". Give concise, educational answers. If student asks a practice question, give it. If they answer, evaluate and explain. Keep responses under 200 words.`;

    const res = await fetch(`${apiUrl}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...history, { role: "user", content: text }],
        systemPrompt,
      }),
    });

    const data = await res.json();
    setSending(false);

    let aiText = data.text ?? "I couldn't process that. Try again.";

    // Parse flashcards if present
    if (wantsFlashcards) {
      try {
        const jsonMatch = aiText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const cards = JSON.parse(jsonMatch[0]);
          await supabase.from("study_flashcards").insert(
            cards.map((c: { question: string; answer: string }) => ({
              session_id: sessionId,
              question: c.question,
              answer: c.answer,
            }))
          );
          aiText = `Generated ${cards.length} flashcards! Switch to the Flashcards tab to study them.`;
        }
      } catch { /* keep original text */ }
    }

    // Save AI response
    await supabase.from("study_session_messages").insert({
      session_id: sessionId,
      user_id: userId,
      role: "ai",
      content: aiText,
    });

    setMessages((prev) => [...prev, {
      id: (Date.now() + 1).toString(),
      session_id: sessionId,
      user_id: userId!,
      role: "ai",
      content: aiText,
      created_at: new Date().toISOString(),
    }]);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // ── CREATE SESSION SCREEN ─────────────────────────────
  if (creating) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← Back</Text>
            </TouchableOpacity>

            <View>
              <Text style={{ fontSize: FontSize.xxl, fontWeight: "700", color: c.text }}>Study Room</Text>
              <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, marginTop: 4 }}>
                AI-powered group study with flashcard generation
              </Text>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.text }}>Topic</Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Python loops, World War II, Calculus..."
                placeholderTextColor={c.textMuted}
                style={{
                  backgroundColor: c.bgCard,
                  borderWidth: 1, borderColor: c.border,
                  borderRadius: Radius.md, padding: Spacing.lg,
                  color: c.text, fontSize: FontSize.base,
                }}
              />
            </View>

            <View style={{
              backgroundColor: c.bgSecondary,
              borderRadius: Radius.lg,
              padding: Spacing.lg,
              gap: Spacing.sm,
            }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.textSecondary }}>WHAT YOU CAN DO</Text>
              {[
                "Ask the AI tutor anything about your topic",
                "Say \"give me a practice question\"",
                "Say \"generate flashcards\" to create study cards",
                "Share the session with friends to study together",
              ].map((t, i) => (
                <View key={i} style={{ flexDirection: "row", gap: Spacing.sm }}>
                  <Text style={{ color: c.textMuted, fontSize: FontSize.sm }}>·</Text>
                  <Text style={{ flex: 1, fontSize: FontSize.sm, color: c.textSecondary }}>{t}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={createSession}
              disabled={!topic.trim()}
              style={{
                backgroundColor: c.text, borderRadius: Radius.lg,
                padding: Spacing.lg, alignItems: "center",
                opacity: !topic.trim() ? 0.5 : 1,
              }}
            >
              <Text style={{ color: c.accentFg, fontWeight: "700", fontSize: FontSize.md }}>
                Start session
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.text} />
      </SafeAreaView>
    );
  }

  // ── CHAT + FLASHCARDS ─────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
          borderBottomWidth: 1, borderBottomColor: c.border,
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← Exit</Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: FontSize.base, fontWeight: "700", color: c.text }}>{topic}</Text>
            <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>
              {participants.length} participant{participants.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={{ fontSize: FontSize.sm, color: c.textMuted }}>{flashcards.length} cards</Text>
        </View>

        {/* Tab switcher */}
        <View style={{
          flexDirection: "row", backgroundColor: c.bgSecondary,
          margin: Spacing.md, borderRadius: Radius.lg, padding: 3, gap: 3,
        }}>
          {(["chat", "flashcards"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1, paddingVertical: Spacing.sm,
                borderRadius: Radius.md,
                backgroundColor: tab === t ? c.bgCard : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: tab === t ? c.text : c.textMuted, textTransform: "capitalize" }}>
                {t === "chat" ? "AI Chat" : `Flashcards (${flashcards.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chat */}
        {tab === "chat" && (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.lg }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item: msg }) => {
                const isAI = msg.role === "ai";
                const isMe = msg.user_id === userId;
                return (
                  <View style={{
                    alignSelf: isAI ? "flex-start" : isMe ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    gap: 2,
                  }}>
                    {!isAI && !isMe && (
                      <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginLeft: Spacing.sm }}>
                        {msg.users?.name}
                      </Text>
                    )}
                    {isAI && (
                      <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginLeft: Spacing.sm }}>
                        AI Tutor
                      </Text>
                    )}
                    <View style={{
                      backgroundColor: isAI ? c.bgCard : isMe ? c.text : c.bgSecondary,
                      borderRadius: Radius.lg,
                      borderWidth: isAI ? 1 : 0,
                      borderColor: c.border,
                      padding: Spacing.md,
                      borderBottomLeftRadius: isAI ? Radius.sm : Radius.lg,
                      borderBottomRightRadius: isMe ? Radius.sm : Radius.lg,
                    }}>
                      <Text style={{
                        fontSize: FontSize.base,
                        color: isMe ? c.accentFg : c.text,
                        lineHeight: 22,
                      }}>
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", padding: Spacing.xl }}>
                  <Text style={{ color: c.textMuted, fontSize: FontSize.sm }}>
                    Starting session...
                  </Text>
                </View>
              }
            />

            {/* Input */}
            <View style={{
              flexDirection: "row", gap: Spacing.sm,
              paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
              borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing.md,
            }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask the AI tutor..."
                placeholderTextColor={c.textMuted}
                style={{
                  flex: 1, backgroundColor: c.bgCard,
                  borderWidth: 1, borderColor: c.border,
                  borderRadius: Radius.lg, paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm, color: c.text, fontSize: FontSize.base,
                }}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!input.trim() || sending}
                style={{
                  backgroundColor: c.text, borderRadius: Radius.lg,
                  width: 44, alignItems: "center", justifyContent: "center",
                  opacity: !input.trim() || sending ? 0.4 : 1,
                }}
              >
                {sending
                  ? <ActivityIndicator size="small" color={c.accentFg} />
                  : <Text style={{ color: c.accentFg, fontSize: 18 }}>→</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Flashcards */}
        {tab === "flashcards" && (
          <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
            {flashcards.length > 0 ? (
              flashcards.map((card, i) => (
                <FlashcardItem key={card.id} card={card} index={i} />
              ))
            ) : (
              <View style={{ alignItems: "center", padding: Spacing.xxl }}>
                <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>◈</Text>
                <Text style={{ fontSize: FontSize.base, fontWeight: "600", color: c.text, marginBottom: 4 }}>
                  No flashcards yet
                </Text>
                <Text style={{ fontSize: FontSize.sm, color: c.textMuted, textAlign: "center" }}>
                  In the chat, say "generate flashcards" to create study cards
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FlashcardItem({ card, index }: { card: Flashcard; index: number }) {
  const c = useTheme();
  const [flipped, setFlipped] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setFlipped((f) => !f)}
      activeOpacity={0.9}
      style={{
        backgroundColor: flipped ? c.text : c.bgCard,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: flipped ? c.text : c.border,
        padding: Spacing.xl,
        minHeight: 120,
        justifyContent: "center",
        gap: Spacing.sm,
      }}
    >
      <Text style={{ fontSize: FontSize.xs, color: flipped ? c.accentFg + "88" : c.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
        {flipped ? "Answer" : `Card ${index + 1} · tap to reveal`}
      </Text>
      <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: flipped ? c.accentFg : c.text, lineHeight: 24 }}>
        {flipped ? card.answer : card.question}
      </Text>
    </TouchableOpacity>
  );
}
