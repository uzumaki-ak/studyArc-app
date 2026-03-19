import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const scheme = useColorScheme();
  const { clearUser } = useGameStore();


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuth = segments[0] === "(auth)";
      if (!session) {
        clearUser();
        if (!inAuth) router.replace("/(auth)/login");
      } else if (inAuth) {
        router.replace("/(tabs)");
      }
    });
    return () => subscription.unsubscribe();
  }, [segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="skill/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="challenge/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="quiz/lobby" options={{ presentation: "modal" }} />
        <Stack.Screen name="quiz/[roomId]" options={{ presentation: "card" }} />
        <Stack.Screen name="boss" options={{ presentation: "card" }} />
        <Stack.Screen name="focus" options={{ presentation: "modal" }} />
        <Stack.Screen name="friends" options={{ presentation: "card" }} />
        <Stack.Screen name="study-room" options={{ presentation: "card" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
