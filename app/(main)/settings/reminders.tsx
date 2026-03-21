import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  cancelScheduledReminders,
  scheduleNextReminder,
  setupNotifications,
} from "@/lib/notifications";
import { prefs$ } from "@/lib/prefs";
import { NOTIFICATION_INTERVALS, type NotificationInterval } from "@/lib/types";
import { DatePicker, Divider, Host, Toggle, VStack } from "@expo/ui/swift-ui";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo } from "react";
import { Platform, PlatformColor, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

import { SectionHeader, styles, timePartsToDate } from "./settings-shared";

const REMINDER_INTERVAL_OPTIONS: { label: string; value: NotificationInterval | undefined }[] = [
  { label: "Off", value: undefined },
  ...NOTIFICATION_INTERVALS.map((m) => ({ label: `${m} min`, value: m })),
];

export default function SettingsRemindersScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const pageBg = PlatformColor("systemGroupedBackground");
  const groupBg = PlatformColor("secondarySystemGroupedBackground");
  const secondaryLabel = PlatformColor("secondaryLabel");
  const labelColor = PlatformColor("label");
  const tintColor = PlatformColor("tint");
  const separatorColor = PlatformColor("separator");

  const remindersEnabledRaw = useValue(prefs$.remindersEnabled);
  const remindersEnabled = remindersEnabledRaw ?? true;
  const wake = useValue(prefs$.wakeUp);
  const bed = useValue(prefs$.bedtime);
  const reminder = useValue(prefs$.reminderMinutes);

  const wakeDate = useMemo(() => timePartsToDate(wake.hour, wake.minute), [wake.hour, wake.minute]);
  const bedDate = useMemo(() => timePartsToDate(bed.hour, bed.minute), [bed.hour, bed.minute]);

  const reschedule = useCallback(async () => {
    if (prefs$.remindersEnabled.get() === false) return;
    const m = prefs$.reminderMinutes.get();
    if (m == null) return;
    await setupNotifications();
    await scheduleNextReminder({
      wakeUp: prefs$.wakeUp.get(),
      bedtime: prefs$.bedtime.get(),
      intervalMinutes: m,
      afterLogAt: new Date(),
    });
  }, []);

  const onRemindersEnabledChange = useCallback(
    async (isOn: boolean) => {
      prefs$.remindersEnabled.set(isOn);
      if (!isOn) {
        await cancelScheduledReminders();
        return;
      }
      await reschedule();
    },
    [reschedule],
  );

  return (
    <ScrollView
      style={[styles.safe, { backgroundColor: pageBg }]}
      contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "never" : undefined}
      removeClippedSubviews={false}
      contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(48, insets.bottom + 88) }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <SectionHeader color={secondaryLabel} first>
        Reminders
      </SectionHeader>
      <Text style={[styles.sectionCaption, { color: secondaryLabel }]}>
        Follow-up nudges after you log water. Turn off to stop all reminder notifications.
      </Text>
      <View style={[styles.group, { backgroundColor: groupBg }]}>
        <View style={styles.groupInner}>
          <Host matchContents colorScheme={colorScheme} style={styles.hostFill}>
            <Toggle
              label="Enable reminders"
              isOn={remindersEnabled}
              onIsOnChange={(isOn) => void onRemindersEnabledChange(isOn)}
            />
          </Host>
        </View>
      </View>

      {remindersEnabled ? (
        <>
          <View style={{ zIndex: 1 }}>
            <SectionHeader color={secondaryLabel}>Reminder after logging</SectionHeader>
            <View collapsable={false} style={[styles.checklistGroup, { backgroundColor: groupBg }]}>
              {REMINDER_INTERVAL_OPTIONS.map((opt, index, arr) => {
                const selected =
                  opt.value === undefined ? reminder == null : reminder === opt.value;
                return (
                  <View key={String(opt.value ?? "off")}>
                    <Pressable
                      onPress={async () => {
                        prefs$.reminderMinutes.set(opt.value);
                        if (opt.value == null) {
                          await cancelScheduledReminders();
                          return;
                        }
                        await reschedule();
                      }}
                      style={({ pressed }) => [styles.checklistRow, pressed && { opacity: 0.55 }]}
                    >
                      <Text style={[styles.checklistLabel, { color: labelColor }]}>
                        {opt.label}
                      </Text>
                      {selected ? (
                        <SymbolView
                          name={{ ios: "checkmark", android: "check" }}
                          size={22}
                          tintColor={tintColor}
                          resizeMode="scaleAspectFit"
                          accessibilityLabel="Selected"
                        />
                      ) : (
                        <View style={styles.checklistCheckPlaceholder} />
                      )}
                    </Pressable>
                    {index < arr.length - 1 ? (
                      <View
                        style={[styles.checklistSeparator, { backgroundColor: separatorColor }]}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          <SectionHeader color={secondaryLabel}>Wake & bedtime</SectionHeader>
          <Text style={[styles.sectionCaption, { color: secondaryLabel }]}>
            Reminder window — times apply to follow-up reminders after you log.
          </Text>
          <View style={[styles.group, { backgroundColor: groupBg }]}>
            <View style={styles.groupInnerTight}>
              <Host matchContents colorScheme={colorScheme} style={styles.hostFill}>
                <VStack spacing={10} alignment="leading">
                  <DatePicker
                    title="Wake up"
                    selection={wakeDate}
                    displayedComponents={["hourAndMinute"]}
                    onDateChange={(d) => {
                      prefs$.wakeUp.set({ hour: d.getHours(), minute: d.getMinutes() });
                      void reschedule();
                    }}
                  />
                  <Divider />
                  <DatePicker
                    title="Bedtime"
                    selection={bedDate}
                    displayedComponents={["hourAndMinute"]}
                    onDateChange={(d) => {
                      prefs$.bedtime.set({ hour: d.getHours(), minute: d.getMinutes() });
                      void reschedule();
                    }}
                  />
                </VStack>
              </Host>
            </View>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
