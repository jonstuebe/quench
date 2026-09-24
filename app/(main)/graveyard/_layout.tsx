import { Stack } from "expo-router";

export default function GraveyardStackLayout() {
  return (
    <Stack screenOptions={{ headerTransparent: true, headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: "Graveyard", headerLargeTitle: true }} />
      <Stack.Screen name="[id]" options={{ title: "", headerBackButtonDisplayMode: "minimal" }} />
    </Stack>
  );
}
