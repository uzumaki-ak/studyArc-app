import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type TextInputProps,
} from "react-native";
import { useTheme, Spacing, Radius, FontSize } from "@/lib/theme";

// ── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = "primary", size = "md", loading, disabled, style }: ButtonProps) {
  const c = useTheme();

  const bg = {
    primary: c.accent,
    secondary: "transparent",
    ghost: "transparent",
    danger: "transparent",
  }[variant];

  const textColor = {
    primary: c.accentFg,
    secondary: c.text,
    ghost: c.textSecondary,
    danger: c.danger,
  }[variant];

  const borderColor = {
    primary: "transparent",
    secondary: c.border,
    ghost: "transparent",
    danger: c.danger,
  }[variant];

  const pad = size === "sm" ? Spacing.sm : size === "lg" ? Spacing.lg : Spacing.md;
  const fontSize = size === "sm" ? FontSize.sm : size === "lg" ? FontSize.md : FontSize.base;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[{
        backgroundColor: bg,
        paddingVertical: pad,
        paddingHorizontal: pad * 2,
        borderRadius: 16,
        borderWidth: borderColor === "transparent" ? 0 : 2,
        borderBottomWidth: variant === "ghost" ? 0 : 4,
        borderColor: variant === "primary" ? (c as any).borderStrong || "#1899D6" : c.borderStrong,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: Spacing.sm,
        opacity: disabled ? 0.5 : 1,
      }, style]}
    >
      {loading && <ActivityIndicator size="small" color={textColor} />}
      <Text style={{ color: textColor, fontSize, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
}

export function Card({ children, style, onPress, padding }: CardProps) {
  const c = useTheme();
  const inner = (
    <View style={[{
      backgroundColor: c.bgCard,
      borderRadius: 16,
      borderWidth: 2,
      borderBottomWidth: 4,
      borderColor: c.borderStrong,
      padding: padding ?? Spacing.lg,
    }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  style?: ViewStyle;
}

export function Input({ label, style, ...props }: InputProps) {
  const c = useTheme();
  return (
    <View style={style}>
      {label && (
        <Text style={{ color: c.text, fontSize: FontSize.sm, fontWeight: "500", marginBottom: Spacing.xs }}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={c.textMuted}
        style={{
          backgroundColor: c.bgCard,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: Radius.md,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.md,
          color: c.text,
          fontSize: FontSize.base,
        }}
        {...props}
      />
    </View>
  );
}

// ── Badge pill ────────────────────────────────────────────────────────────────
export function Pill({ label, color }: { label: string; color?: string }) {
  const c = useTheme();
  return (
    <View style={{
      backgroundColor: c.bgSecondary,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 3,
      alignSelf: "flex-start",
    }}>
      <Text style={{ fontSize: FontSize.xs, color: color ?? c.textSecondary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  const c = useTheme();
  return <View style={[{ height: 1, backgroundColor: c.border }, style]} />;
}

// ── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md }}>
      <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: c.text }}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontSize: FontSize.sm, color: c.textSecondary }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
