import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { flex: 1 } }}>
      <Stack.Screen
        name="home"
        options={{
          title: "",
          headerShadowVisible: false,
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
          headerLargeTitle: true,
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="day/[date]" options={{ headerShown: false }} />
    </Stack>
  );
}
