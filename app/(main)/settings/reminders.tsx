import {
  cancelScheduledReminders,
  scheduleNextReminder,
  setupNotifications,
} from "@/lib/notifications";
import { prefs$ } from "@/lib/prefs";
import { NOTIFICATION_INTERVALS, type NotificationInterval } from "@/lib/types";
import { SymbolView } from "expo-symbols";
import { useCallback } from "react";
import { PlatformColor, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

import { SectionHeader } from "@/components/settings-layout";

const REMINDER_INTERVAL_OPTIONS: { label: string; value: NotificationInterval | undefined }[] = [
  { label: "Disabled", value: undefined },
  ...NOTIFICATION_INTERVALS.map((m) => ({ label: `${m} min`, value: m })),
];

export default function SettingsRemindersScreen() {
  const insets = useSafeAreaInsets();

  const pageBg = PlatformColor("systemGroupedBackground");
  const groupBg = PlatformColor("secondarySystemGroupedBackground");
  const secondaryLabel = PlatformColor("secondaryLabel");
  const labelColor = PlatformColor("label");
  const tintColor = PlatformColor("tint");
  const separatorColor = PlatformColor("separator");

  const remindersEnabledRaw = useValue(prefs$.remindersEnabled);
  const reminder = useValue(prefs$.reminderMinutes);

  const reschedule = useCallback(async () => {
    const m = prefs$.reminderMinutes.get();
    if (m == null || prefs$.remindersEnabled.get() === false) return;
    await setupNotifications();
    await scheduleNextReminder({
      wakeUp: prefs$.wakeUp.get(),
      bedtime: prefs$.bedtime.get(),
      intervalMinutes: m,
      afterLogAt: new Date(),
    });
  }, []);

  return (
    <ScrollView
      style={[{ flex: 1 }, { backgroundColor: pageBg }]}
      contentInsetAdjustmentBehavior="never"
      removeClippedSubviews={false}
      contentContainerStyle={[
        {
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 40,
        },
        { paddingBottom: Math.max(48, insets.bottom + 88) },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={{ zIndex: 1 }}>
        <SectionHeader color={secondaryLabel} first>
          Reminder after logging
        </SectionHeader>
        <Text
          style={[
            {
              fontSize: 13,
              lineHeight: 18,
              marginTop: 2,
              marginBottom: 16,
            },
            { color: secondaryLabel },
          ]}
        >
          Follow-up nudges after you log water. Choose Disabled to stop reminder notifications.
        </Text>
        <View
          collapsable={false}
          style={[
            {
              borderRadius: 10,
              marginBottom: 4,
              alignSelf: "stretch",
            },
            { backgroundColor: groupBg },
          ]}
        >
          {REMINDER_INTERVAL_OPTIONS.map((opt, index, arr) => {
            const remindersOn = remindersEnabledRaw !== false;
            const selected =
              opt.value === undefined
                ? reminder == null || !remindersOn
                : reminder === opt.value && remindersOn;
            return (
              <View key={String(opt.value ?? "disabled")}>
                <Pressable
                  onPress={async () => {
                    if (opt.value == null) {
                      prefs$.reminderMinutes.set(undefined);
                      prefs$.remindersEnabled.set(false);
                      await cancelScheduledReminders();
                      return;
                    }
                    prefs$.reminderMinutes.set(opt.value);
                    prefs$.remindersEnabled.set(true);
                    await reschedule();
                  }}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      minHeight: 44,
                    },
                    pressed && { opacity: 0.55 },
                  ]}
                >
                  <Text style={[{ fontSize: 17, fontWeight: "400" }, { color: labelColor }]}>
                    {opt.label}
                  </Text>
                  {selected ? (
                    <SymbolView
                      name="checkmark"
                      size={22}
                      tintColor={tintColor}
                      resizeMode="scaleAspectFit"
                      accessibilityLabel="Selected"
                    />
                  ) : (
                    <View style={{ width: 22, height: 22 }} />
                  )}
                </Pressable>
                {index < arr.length - 1 ? (
                  <View
                    style={[
                      {
                        height: StyleSheet.hairlineWidth,
                        marginLeft: 16,
                      },
                      { backgroundColor: separatorColor },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
