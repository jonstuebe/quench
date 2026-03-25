import { NativeTabs } from "expo-router/unstable-native-tabs";

/** Settings-only native tab bar (nested under the main stack). See https://docs.expo.dev/versions/latest/sdk/router/native-tabs/ */
export default function SettingsTabsLayout() {
  return (
    <NativeTabs blurEffect="systemChromeMaterial">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>General</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "slider.horizontal.3", selected: "slider.horizontal.3" }}
          md="tune"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reminders" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Reminders</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bell", selected: "bell.fill" }}
          md="notifications"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
