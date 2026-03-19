import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { Button, Input } from "@/components/ui";

export default function LoginScreen() {
  const c = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) { setError("Fill in all fields"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: Spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: Spacing.xxl }}>
          <View style={{
            width: 56, height: 56, borderRadius: Radius.lg,
            backgroundColor: c.text, alignItems: "center", justifyContent: "center",
            marginBottom: Spacing.lg,
          }}>
            <Text style={{ color: c.accentFg, fontSize: 24 }}>◆</Text>
          </View>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: "700", color: c.text, letterSpacing: -0.5 }}>
            StudyArc
          </Text>
          <Text style={{ fontSize: FontSize.base, color: c.textSecondary, marginTop: 4 }}>
            Sign in to continue your streak
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: Spacing.md }}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          {error ? (
            <Text style={{ color: c.danger, fontSize: FontSize.sm, textAlign: "center" }}>{error}</Text>
          ) : null}

          <Button label={loading ? "Signing in..." : "Sign in"} onPress={handleLogin} loading={loading} />
        </View>

        {/* Footer */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginTop: Spacing.xl }}>
          <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>No account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={{ color: c.text, fontSize: FontSize.sm, fontWeight: "600" }}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
