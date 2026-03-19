import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, AppState,
  AppStateStatus, Vibration, Modal, TextInput, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

const SHAME_MESSAGES = [
  "I got distracted instead of studying. I'm weak and I know it.",
  "Sorry, I abandoned my study session like a coward.",
  "I was supposed to be studying but gave in to distraction.",
  "I failed my focus session and need you to forgive me.",
];

type FocusState = "idle" | "active" | "shame_required" | "waiting_unlock" | "done";

export default function FocusScreen() {
  const c = useTheme();
  const router = useRouter();
  const { userId } = useGameStore();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL!;

  const [focusState, setFocusState] = useState<FocusState>("idle");
  const [duration, setDuration] = useState(25);
  const [elapsed, setElapsed] = useState(0);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [shameMsg, setShameMsg] = useState(0);
  const [shameModalOpen, setShameModalOpen] = useState(false);
  const [shameLogId, setShameLogId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>("active");

  const totalSeconds = duration * 60;
  const pct = Math.min(100, (elapsed / totalSeconds) * 100);
  const remaining = totalSeconds - elapsed;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  useEffect(() => {
    loadFriends();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // AppState listener — detect app going to background during focus
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current === "active" && nextState !== "active" && focusState === "active") {
        // App went to background during focus session
        setFocusState("shame_required");
        setShameModalOpen(true);
        if (timerRef.current) clearInterval(timerRef.current);
        Vibration.vibrate([0, 200, 100, 200]);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [focusState]);

  async function loadFriends() {
    if (!userId) return;
    const { data } = await supabase
      .from("friends")
      .select("friend_id, users!friends_friend_id_fkey(id, name)")
      .eq("user_id", userId)
      .eq("status", "accepted");
    const list = data?.map((f: any) => f.users).filter(Boolean) ?? [];
    setFriends(list);
    if (list.length > 0) setSelectedFriend(list[0]);
  }

  function startSession() {
    setElapsed(0);
    setFocusState("active");
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSeconds) {
          clearInterval(timerRef.current!);
          setFocusState("done");
          return totalSeconds;
        }
        return e + 1;
      });
    }, 1000);
  }

  async function sendShame() {
    if (!selectedFriend) { Alert.alert("Select a friend first"); return; }
    setSending(true);
    const res = await fetch(`${apiUrl}/api/shame`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        friendId: selectedFriend.id,
        message: SHAME_MESSAGES[shameMsg],
        distractionApp: "mobile app",
        minutesWasted: Math.floor(elapsed / 60),
      }),
    });
    const data = await res.json();
    setSending(false);
    setShameModalOpen(false);

    if (res.ok) {
      setShameLogId(data.shameLogId);
      setFocusState("waiting_unlock");

      // Poll until friend reads
      pollRef.current = setInterval(async () => {
        const r = await fetch(`${apiUrl}/api/shame?userId=${userId}`);
        const d = await r.json();
        if (!d.locked) {
          clearInterval(pollRef.current!);
          setShameLogId(null);
          setFocusState("active");
          startSession(); // resume
        }
      }, 5000);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, alignItems: "center", gap: Spacing.xl }}>
        <View style={{ width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: c.text }}>Focus Mode</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Timer circle */}
        <View style={{ width: 200, height: 200, alignItems: "center", justifyContent: "center" }}>
          {/* Background circle */}
          <View style={{
            position: "absolute",
            width: 200, height: 200,
            borderRadius: 100,
            borderWidth: 6,
            borderColor: c.bgSecondary,
          }} />
          {/* Center text */}
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 42, fontWeight: "700", color: c.text, fontFamily: "monospace" }}>
              {mins}:{secs.toString().padStart(2, "0")}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: c.textMuted, textTransform: "capitalize" }}>
              {focusState === "idle" ? "ready" : focusState.replace("_", " ")}
            </Text>
          </View>
        </View>

        {/* Duration picker - only when idle */}
        {focusState === "idle" && (
          <View style={{ width: "100%", gap: Spacing.md }}>
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, textAlign: "center" }}>
              Duration: {duration} minutes
            </Text>
            <View style={{ flexDirection: "row", gap: Spacing.sm, justifyContent: "center" }}>
              {[15, 25, 45, 60].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setDuration(m)}
                  style={{
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.sm,
                    borderRadius: Radius.full,
                    borderWidth: 1,
                    borderColor: duration === m ? c.text : c.border,
                    backgroundColor: duration === m ? c.text : "transparent",
                  }}
                >
                  <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: duration === m ? c.accentFg : c.textSecondary }}>
                    {m}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Friend picker */}
        {focusState === "idle" && friends.length > 0 && (
          <View style={{ width: "100%", gap: Spacing.sm }}>
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, fontWeight: "600" }}>
              Shame friend
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
              {friends.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSelectedFriend(f)}
                  style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    borderRadius: Radius.full,
                    borderWidth: 1,
                    borderColor: selectedFriend?.id === f.id ? c.text : c.border,
                    backgroundColor: selectedFriend?.id === f.id ? c.text : "transparent",
                  }}
                >
                  <Text style={{ fontSize: FontSize.sm, color: selectedFriend?.id === f.id ? c.accentFg : c.textSecondary, fontWeight: "600" }}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* No friends warning */}
        {focusState === "idle" && friends.length === 0 && (
          <View style={{
            width: "100%",
            backgroundColor: c.bgSecondary,
            borderRadius: Radius.lg,
            padding: Spacing.lg,
          }}>
            <Text style={{ fontSize: FontSize.sm, color: c.textMuted, textAlign: "center" }}>
              Add friends to enable the shame blocker
            </Text>
          </View>
        )}

        {/* Action button */}
        {focusState === "idle" && (
          <TouchableOpacity
            onPress={startSession}
            style={{
              width: "100%", backgroundColor: c.text,
              borderRadius: Radius.lg, padding: Spacing.lg, alignItems: "center",
            }}
          >
            <Text style={{ color: c.accentFg, fontWeight: "700", fontSize: FontSize.md }}>
              Start session
            </Text>
          </TouchableOpacity>
        )}

        {focusState === "active" && (
          <TouchableOpacity
            onPress={() => {
              setFocusState("idle");
              if (timerRef.current) clearInterval(timerRef.current);
              setElapsed(0);
            }}
            style={{
              width: "100%", borderWidth: 1, borderColor: c.border,
              borderRadius: Radius.lg, padding: Spacing.lg, alignItems: "center",
            }}
          >
            <Text style={{ color: c.textSecondary, fontWeight: "600" }}>Abandon</Text>
          </TouchableOpacity>
        )}

        {focusState === "waiting_unlock" && (
          <View style={{
            width: "100%", backgroundColor: c.bgSecondary, borderRadius: Radius.lg,
            padding: Spacing.xl, alignItems: "center", gap: Spacing.md,
          }}>
            <Text style={{ fontSize: FontSize.base, fontWeight: "700", color: c.text }}>
              Waiting for {selectedFriend?.name}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: c.textMuted, textAlign: "center" }}>
              They need to read your shame message and tap Forgive
            </Text>
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: c.text,
                  opacity: 0.4 + i * 0.3,
                }} />
              ))}
            </View>
          </View>
        )}

        {focusState === "done" && (
          <View style={{ alignItems: "center", gap: Spacing.lg }}>
            <Text style={{ fontSize: 64 }}>★</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: "700", color: c.text }}>
              Session complete!
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary }}>
              {duration} minutes of focused study
            </Text>
            <TouchableOpacity
              onPress={() => { setFocusState("idle"); setElapsed(0); }}
              style={{
                backgroundColor: c.text, borderRadius: Radius.lg,
                padding: Spacing.lg, paddingHorizontal: Spacing.xxl,
              }}
            >
              <Text style={{ color: c.accentFg, fontWeight: "700" }}>Start another</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Shame Modal */}
      <Modal visible={shameModalOpen} transparent animationType="slide">
        <View style={{
          flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}>
          <View style={{
            backgroundColor: c.bgCard,
            borderTopLeftRadius: Radius.xl,
            borderTopRightRadius: Radius.xl,
            padding: Spacing.xl,
            gap: Spacing.lg,
          }}>
            <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: c.text }}>
              You left the session
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary }}>
              Send a shame message to {selectedFriend?.name ?? "your friend"}. They must read it before you can continue.
            </Text>

            <View style={{ gap: Spacing.sm }}>
              {SHAME_MESSAGES.map((msg, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setShameMsg(i)}
                  style={{
                    backgroundColor: shameMsg === i ? c.text : c.bgSecondary,
                    borderRadius: Radius.md,
                    padding: Spacing.md,
                    borderWidth: 1,
                    borderColor: shameMsg === i ? c.text : c.border,
                  }}
                >
                  <Text style={{ fontSize: FontSize.sm, color: shameMsg === i ? c.accentFg : c.textSecondary, fontStyle: "italic" }}>
                    "{msg}"
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={sendShame}
              disabled={sending}
              style={{
                backgroundColor: c.text,
                borderRadius: Radius.lg,
                padding: Spacing.lg,
                alignItems: "center",
                opacity: sending ? 0.5 : 1,
              }}
            >
              <Text style={{ color: c.accentFg, fontWeight: "700", fontSize: FontSize.md }}>
                {sending ? "Sending..." : "Send shame message"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
