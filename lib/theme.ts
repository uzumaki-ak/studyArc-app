import { useColorScheme } from "react-native";

export const Colors = {
  light: {
    bg: "#FFFFFF",
    bgSecondary: "#F7F7F7",
    bgCard: "#FFFFFF",
    border: "#E5E5E5",
    borderStrong: "#CECECE",
    text: "#4B4B4B",
    textSecondary: "#777777",
    textMuted: "#AFAFAF",
    accent: "#1CB0F6", // Duolingo blue
    accentFg: "#FFFFFF",
    danger: "#FF4B4B", // Duolingo red
    success: "#58CC02", // Duolingo green
    warning: "#FF9600",
  },
  dark: {
    bg: "#131F24", // Duolingo dark mode bg
    bgSecondary: "#202F36", // Slightly lighter for sections
    bgCard: "#131F24", // Or same as bg if bordered
    border: "#37464F",
    borderStrong: "#4F636F",
    text: "#FFFFFF",
    textSecondary: "#A5B5BA",
    textMuted: "#637A86",
    accent: "#1CB0F6", // Vibrant blue
    accentFg: "#FFFFFF",
    danger: "#FF4B4B",
    success: "#58CC02", 
    warning: "#FF9600",
  },
};

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? Colors.dark : Colors.light;
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};
