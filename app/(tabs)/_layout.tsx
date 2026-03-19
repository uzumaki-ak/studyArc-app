import { Tabs } from "expo-router";
import { Text, View, useColorScheme } from "react-native";
import { Colors } from "@/lib/theme";

import { Ionicons } from "@expo/vector-icons";

export function TabIcon({ routeName, icon, focused }: { routeName: string; icon: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? Colors.dark : Colors.light;

  let activeColor = c.text;
  if (routeName === "index") activeColor = (c as any).success;
  if (routeName === "courses") activeColor = c.accent;
  if (routeName === "leaderboard") activeColor = "#FFD700";
  if (routeName === "battle") activeColor = (c as any).warning;
  if (routeName === "pets") activeColor = (c as any).danger;
  if (routeName === "profile") activeColor = "#A855F7"; // Vivid purple

  return (
    <View style={{
      alignItems: "center",
      justifyContent: "center",
      width: 50,
      height: 40,
      borderRadius: 12,
      borderWidth: focused ? 2 : 0,
      borderColor: focused ? activeColor : "transparent",
      backgroundColor: focused ? `${activeColor}1A` : "transparent",
      marginTop: 8,
    }}>
      <Ionicons name={icon} size={22} color={focused ? activeColor : c.textMuted} />
    </View>
  );
}

export default function TabsLayout() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          borderTopWidth: 2,
          height: 70,
          paddingBottom: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon routeName="index" icon={focused ? "home" : "home-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon routeName="courses" icon={focused ? "grid" : "grid-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon routeName="leaderboard" icon={focused ? "trophy" : "trophy-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon routeName="battle" icon={focused ? "shield" : "shield-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon routeName="pets" icon={focused ? "paw" : "paw-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon routeName="profile" icon={focused ? "person" : "person-outline"} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
