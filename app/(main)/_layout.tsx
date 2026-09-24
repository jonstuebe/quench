import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useStreakEngine } from "@/hooks/use-streak-engine";

/** Root native tab bar (system liquid glass on iOS 26). Each tab owns a Stack for its own header. */
export default function MainTabsLayout() {
  useStreakEngine();
  return (
    <NativeTabs minimizeBehavior="never">
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "drop", selected: "drop.fill" }} md="water_drop" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="graveyard">
        <NativeTabs.Trigger.Label>Graveyard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "leaf", selected: "leaf.fill" }} md="spa" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
