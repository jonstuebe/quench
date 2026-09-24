import { Stack } from "expo-router";

export default function GraveyardStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Graveyard", headerLargeTitle: true, headerShadowVisible: false }}
      />
    </Stack>
  );
}
