import { SectionHeader, styles as settingsStyles } from "@/app/(main)/settings/settings-shared";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { cancelScheduledReminders, setupNotifications } from "@/lib/notifications";
import { prefs$ } from "@/lib/prefs";
import { NOTIFICATION_INTERVALS, type NotificationInterval } from "@/lib/types";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
import { Platform, PlatformColor, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

const isIOS = Platform.OS === "ios";

const REMINDER_INTERVAL_OPTIONS: { label: string; value: NotificationInterval | undefined }[] = [
  { label: "Off", value: undefined },
  ...NOTIFICATION_INTERVALS.map((m) => ({ label: `${m} min`, value: m })),
];

function partsToDate(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const wake = useValue(prefs$.wakeUp);
  const bed = useValue(prefs$.bedtime);
  const reminderMinutes = useValue(prefs$.reminderMinutes);

  const wakeDate = useMemo(() => partsToDate(wake.hour, wake.minute), [wake.hour, wake.minute]);
  const bedDate = useMemo(() => partsToDate(bed.hour, bed.minute), [bed.hour, bed.minute]);

  const grouped = colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF";
  const sectionLabel = colorScheme === "dark" ? "#8E8E93" : "#6D6D70";
  const separatorColor = colorScheme === "dark" ? "#38383A" : "#C6C6C8";
  const ctaLabel = colorScheme === "dark" ? colors.background : "#FFFFFF";
  const ctaBackground =
    isIOS && colorScheme === "light" ? PlatformColor("systemBlue") : colors.tint;

  function finish() {
    prefs$.onboardingComplete.set(true);
    router.replace("/home");
  }

  function onReminderOptionPress(opt: (typeof REMINDER_INTERVAL_OPTIONS)[number]) {
    void (async () => {
      if (opt.value == null) {
        prefs$.reminderMinutes.set(undefined);
        await cancelScheduledReminders();
        return;
      }
      prefs$.reminderMinutes.set(opt.value);
      await setupNotifications();
    })();
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["left", "right"]}
    >
      <View style={styles.body}>
        <ScrollView
          style={styles.scrollView}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[settingsStyles.scroll, { paddingBottom: 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          <SectionHeader color={sectionLabel} first>
            Schedule
          </SectionHeader>
          {isIOS ? (
            <View
              style={[
                settingsStyles.group,
                settingsStyles.checklistGroup,
                { backgroundColor: grouped },
              ]}
            >
              <View
                style={[
                  settingsStyles.checklistRow,
                  styles.timeRowSeparator,
                  { borderBottomColor: colors.icon + "44" },
                ]}
              >
                <ThemedText style={settingsStyles.checklistLabel}>Wake up</ThemedText>
                <DateTimePicker
                  value={wakeDate}
                  mode="time"
                  display="compact"
                  onChange={(_, d) => {
                    if (d) {
                      prefs$.wakeUp.set({ hour: d.getHours(), minute: d.getMinutes() });
                    }
                  }}
                  style={styles.timePickerCompact}
                />
              </View>
              <View style={settingsStyles.checklistRow}>
                <ThemedText style={settingsStyles.checklistLabel}>Bedtime</ThemedText>
                <DateTimePicker
                  value={bedDate}
                  mode="time"
                  display="compact"
                  onChange={(_, d) => {
                    if (d) {
                      prefs$.bedtime.set({ hour: d.getHours(), minute: d.getMinutes() });
                    }
                  }}
                  style={styles.timePickerCompact}
                />
              </View>
            </View>
          ) : (
            <View style={styles.androidSchedule}>
              <View
                style={[
                  settingsStyles.group,
                  settingsStyles.checklistGroup,
                  styles.androidTimeCard,
                  { backgroundColor: grouped },
                ]}
              >
                <ThemedText style={[styles.androidTimeHeading, { color: sectionLabel }]}>
                  Wake up
                </ThemedText>
                <DateTimePicker
                  value={wakeDate}
                  mode="time"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) {
                      prefs$.wakeUp.set({ hour: d.getHours(), minute: d.getMinutes() });
                    }
                  }}
                  style={styles.androidSpinner}
                />
              </View>
              <View
                style={[
                  settingsStyles.group,
                  settingsStyles.checklistGroup,
                  styles.androidTimeCard,
                  { backgroundColor: grouped },
                ]}
              >
                <ThemedText style={[styles.androidTimeHeading, { color: sectionLabel }]}>
                  Bedtime
                </ThemedText>
                <DateTimePicker
                  value={bedDate}
                  mode="time"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) {
                      prefs$.bedtime.set({ hour: d.getHours(), minute: d.getMinutes() });
                    }
                  }}
                  style={styles.androidSpinner}
                />
              </View>
            </View>
          )}

          <SectionHeader color={sectionLabel}>Reminders after you log</SectionHeader>
          <View
            collapsable={false}
            style={[settingsStyles.checklistGroup, { backgroundColor: grouped }]}
          >
            {REMINDER_INTERVAL_OPTIONS.map((opt, index, arr) => {
              const selected =
                opt.value === undefined ? reminderMinutes == null : reminderMinutes === opt.value;
              return (
                <View key={String(opt.value ?? "off")}>
                  <Pressable
                    onPress={() => onReminderOptionPress(opt)}
                    style={({ pressed }) => [
                      settingsStyles.checklistRow,
                      pressed && { opacity: 0.55 },
                    ]}
                  >
                    <ThemedText style={settingsStyles.checklistLabel}>{opt.label}</ThemedText>
                    {selected ? (
                      <SymbolView
                        name={{ ios: "checkmark", android: "check" }}
                        size={22}
                        tintColor={colors.tint}
                        resizeMode="scaleAspectFit"
                        accessibilityLabel="Selected"
                      />
                    ) : (
                      <View style={settingsStyles.checklistCheckPlaceholder} />
                    )}
                  </Pressable>
                  {index < arr.length - 1 ? (
                    <View
                      style={[
                        settingsStyles.checklistSeparator,
                        { backgroundColor: separatorColor },
                      ]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View
          style={[
            styles.ctaFooter,
            { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            style={[styles.cta, { backgroundColor: ctaBackground }]}
            onPress={finish}
          >
            <ThemedText style={[styles.ctaText, { color: ctaLabel }]}>Continue</ThemedText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  timeRowSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timePickerCompact: {
    marginRight: 8,
  },
  androidSchedule: {
    gap: 12,
  },
  androidTimeCard: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  androidTimeHeading: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  androidSpinner: {
    height: 160,
    width: "100%",
  },
  ctaFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cta: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
