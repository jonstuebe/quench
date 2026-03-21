import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { NOTIFICATION_INTERVALS, type NotificationInterval } from "@/lib/types";
import { prefs$ } from "@/lib/prefs";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const wake = useValue(prefs$.wakeUp);
  const bed = useValue(prefs$.bedtime);
  const reminderMinutes = useValue(prefs$.reminderMinutes);

  const wakeDate = useMemo(() => partsToDate(wake.hour, wake.minute), [wake.hour, wake.minute]);
  const bedDate = useMemo(() => partsToDate(bed.hour, bed.minute), [bed.hour, bed.minute]);

  const grouped = colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF";
  const sectionLabel = colorScheme === "dark" ? "#8E8E93" : "#6D6D70";
  const separatorColor = colorScheme === "dark" ? "#38383A" : "#C6C6C8";
  const ctaLabel = colorScheme === "dark" ? colors.background : "#FFFFFF";

  function finish() {
    prefs$.onboardingComplete.set(true);
    router.replace("/home");
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title" style={styles.title}>
          Welcome to Quench
        </ThemedText>

        <ThemedText style={[styles.sectionHeader, { color: sectionLabel }]}>Schedule</ThemedText>
        {isIOS ? (
          <View style={[styles.grouped, { backgroundColor: grouped }]}>
            <View
              style={[
                styles.timeRow,
                styles.timeRowSeparator,
                { borderBottomColor: colors.icon + "44" },
              ]}
            >
              <ThemedText style={styles.rowLabel}>Wake up</ThemedText>
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
            <View style={styles.timeRow}>
              <ThemedText style={styles.rowLabel}>Bedtime</ThemedText>
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
            <View style={[styles.grouped, styles.androidTimeCard, { backgroundColor: grouped }]}>
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
            <View style={[styles.grouped, styles.androidTimeCard, { backgroundColor: grouped }]}>
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

        <ThemedText style={[styles.sectionHeader, { color: sectionLabel }]}>
          Reminders after you log
        </ThemedText>
        <View style={[styles.grouped, styles.reminderList, { backgroundColor: grouped }]}>
          {REMINDER_INTERVAL_OPTIONS.map((opt, index, arr) => {
            const selected =
              opt.value === undefined ? reminderMinutes == null : reminderMinutes === opt.value;
            return (
              <View key={String(opt.value ?? "off")}>
                <Pressable
                  onPress={() => prefs$.reminderMinutes.set(opt.value)}
                  style={({ pressed }) => [styles.reminderRow, pressed && { opacity: 0.55 }]}
                >
                  <ThemedText style={styles.reminderRowLabel}>{opt.label}</ThemedText>
                  {selected ? (
                    <SymbolView
                      name={{ ios: "checkmark", android: "check" }}
                      size={22}
                      tintColor={colors.tint}
                      resizeMode="scaleAspectFit"
                      accessibilityLabel="Selected"
                    />
                  ) : (
                    <View style={styles.reminderCheckPlaceholder} />
                  )}
                </Pressable>
                {index < arr.length - 1 ? (
                  <View style={[styles.reminderSeparator, { backgroundColor: separatorColor }]} />
                ) : null}
              </View>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          style={[styles.cta, { backgroundColor: colors.tint }]}
          onPress={finish}
        >
          <ThemedText style={[styles.ctaText, { color: ctaLabel }]}>Continue</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 8,
  },
  title: {
    marginBottom: 20,
    fontWeight: "700",
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: -0.08,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 6,
  },
  grouped: {
    borderRadius: 10,
    overflow: "hidden",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingLeft: 16,
    paddingVertical: isIOS ? 4 : 0,
  },
  timeRowSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 17,
    flexShrink: 0,
    paddingRight: 8,
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
  reminderList: {
    marginTop: 0,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  reminderRowLabel: {
    fontSize: 17,
    fontWeight: "400",
  },
  reminderCheckPlaceholder: {
    width: 22,
    height: 22,
  },
  reminderSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  cta: {
    marginTop: 28,
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
