import { Stack } from "expo-router";

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal", headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: "Settings", headerLargeTitle: true }} />
    </Stack>
  );
}
