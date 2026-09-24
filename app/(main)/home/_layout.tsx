import { Stack } from "expo-router";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function HomeStackLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Stack screenOptions={{ contentStyle: { flex: 1 } }}>
      <Stack.Screen
        name="index"
        options={{
          title: "",
          headerShadowVisible: false,
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: colorScheme === "light" ? "#ffffff" : colors.text,
        }}
      />
    </Stack>
  );
}
