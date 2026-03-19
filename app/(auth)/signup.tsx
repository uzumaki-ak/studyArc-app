import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { Button, Input } from "@/components/ui";

export default function SignupScreen() {
  const c = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    if (!name || !email || !password) { setError("Fill in all fields"); return; }
    if (password.length < 8) { setError("Password must be 8+ characters"); return; }
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

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
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.xl }}>
          <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: FontSize.xxl, fontWeight: "700", color: c.text, marginBottom: 4 }}>
          Create account
        </Text>
        <Text style={{ fontSize: FontSize.base, color: c.textSecondary, marginBottom: Spacing.xl }}>
          Start your learning journey
        </Text>

        <View style={{ gap: Spacing.md }}>
          <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />

          {/* Role picker */}
          <View>
            <Text style={{ color: c.text, fontSize: FontSize.sm, fontWeight: "500", marginBottom: Spacing.sm }}>I am a</Text>
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              {(["student", "teacher"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r)}
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.md,
                    borderRadius: Radius.md,
                    alignItems: "center",
                    backgroundColor: role === r ? c.text : c.bgCard,
                    borderWidth: 1,
                    borderColor: role === r ? c.text : c.border,
                  }}
                >
                  <Text style={{
                    color: role === r ? c.accentFg : c.textSecondary,
                    fontWeight: "600",
                    fontSize: FontSize.sm,
                    textTransform: "capitalize",
                  }}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error ? (
            <Text style={{ color: c.danger, fontSize: FontSize.sm, textAlign: "center" }}>{error}</Text>
          ) : null}

          <Button label={loading ? "Creating..." : "Create account"} onPress={handleSignup} loading={loading} />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginTop: Spacing.xl }}>
          <Text style={{ color: c.textSecondary, fontSize: FontSize.sm }}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={{ color: c.text, fontSize: FontSize.sm, fontWeight: "600" }}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
