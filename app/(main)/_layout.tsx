import { Stack } from "expo-router";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function MainLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Stack screenOptions={{ contentStyle: { flex: 1 } }}>
      <Stack.Screen
        name="home"
        options={{
          title: "",
          headerShadowVisible: false,
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: colorScheme === "light" ? "#ffffff" : colors.text,
        }}
      />
      <Stack.Screen
        name="insights"
        options={{
          title: "Insights",
          headerLargeTitle: true,
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="day/[date]" options={{ headerShown: false }} />
    </Stack>
  );
}
