import { SectionHeader, timePartsToDate } from "@/components/settings-layout";
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
import { PlatformColor, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

const REMINDER_INTERVAL_OPTIONS: { label: string; value: NotificationInterval | undefined }[] = [
  { label: "Disabled", value: undefined },
  ...NOTIFICATION_INTERVALS.map((m) => ({ label: `${m} min`, value: m })),
];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const wake = useValue(prefs$.wakeUp);
  const bed = useValue(prefs$.bedtime);
  const reminderMinutes = useValue(prefs$.reminderMinutes);
  const remindersEnabledRaw = useValue(prefs$.remindersEnabled);

  const wakeDate = useMemo(() => timePartsToDate(wake.hour, wake.minute), [wake.hour, wake.minute]);
  const bedDate = useMemo(() => timePartsToDate(bed.hour, bed.minute), [bed.hour, bed.minute]);

  const grouped = colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF";
  const sectionLabel = colorScheme === "dark" ? "#8E8E93" : "#6D6D70";
  const separatorColor = colorScheme === "dark" ? "#38383A" : "#C6C6C8";
  const ctaLabel = colorScheme === "dark" ? colors.background : "#FFFFFF";
  const ctaBackground = colorScheme === "light" ? PlatformColor("systemBlue") : colors.tint;

  function finish() {
    prefs$.onboardingComplete.set(true);
    router.replace("/home");
  }

  function onReminderOptionPress(opt: (typeof REMINDER_INTERVAL_OPTIONS)[number]) {
    void (async () => {
      if (opt.value == null) {
        prefs$.reminderMinutes.set(undefined);
        prefs$.remindersEnabled.set(false);
        await cancelScheduledReminders();
        return;
      }
      prefs$.reminderMinutes.set(opt.value);
      prefs$.remindersEnabled.set(true);
      await setupNotifications();
    })();
  }

  return (
    <SafeAreaView
      style={[{ flex: 1 }, { backgroundColor: colors.background }]}
      edges={["left", "right"]}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            {
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 40,
            },
            { paddingBottom: 16 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <SectionHeader color={sectionLabel} first>
            Schedule
          </SectionHeader>
          <View
            style={[
              {
                borderRadius: 10,
                overflow: "hidden",
              },
              {
                borderRadius: 10,
                marginBottom: 4,
                alignSelf: "stretch",
              },
              { backgroundColor: grouped },
            ]}
          >
            <View
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  minHeight: 44,
                },
                { borderBottomWidth: StyleSheet.hairlineWidth },
                { borderBottomColor: colors.icon + "44" },
              ]}
            >
              <ThemedText style={{ fontSize: 17, fontWeight: "400" }}>Wake up</ThemedText>
              <DateTimePicker
                value={wakeDate}
                mode="time"
                display="compact"
                onChange={(_, d) => {
                  if (d) {
                    prefs$.wakeUp.set({ hour: d.getHours(), minute: d.getMinutes() });
                  }
                }}
                style={{ marginRight: 8 }}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                paddingHorizontal: 16,
                minHeight: 44,
              }}
            >
              <ThemedText style={{ fontSize: 17, fontWeight: "400" }}>Bedtime</ThemedText>
              <DateTimePicker
                value={bedDate}
                mode="time"
                display="compact"
                onChange={(_, d) => {
                  if (d) {
                    prefs$.bedtime.set({ hour: d.getHours(), minute: d.getMinutes() });
                  }
                }}
                style={{ marginRight: 8 }}
              />
            </View>
          </View>

          <SectionHeader color={sectionLabel}>Reminders after you log</SectionHeader>
          <View
            collapsable={false}
            style={[
              {
                borderRadius: 10,
                marginBottom: 4,
                alignSelf: "stretch",
              },
              { backgroundColor: grouped },
            ]}
          >
            {REMINDER_INTERVAL_OPTIONS.map((opt, index, arr) => {
              const remindersOn = remindersEnabledRaw !== false;
              const selected =
                opt.value === undefined
                  ? reminderMinutes == null || !remindersOn
                  : reminderMinutes === opt.value && remindersOn;
              return (
                <View key={String(opt.value ?? "disabled")}>
                  <Pressable
                    onPress={() => onReminderOptionPress(opt)}
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
                    <ThemedText style={{ fontSize: 17, fontWeight: "400" }}>{opt.label}</ThemedText>
                    {selected ? (
                      <SymbolView
                        name="checkmark"
                        size={22}
                        tintColor={colors.tint}
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
        </ScrollView>

        <View
          style={[
            {
              paddingHorizontal: 20,
              paddingTop: 12,
            },
            { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            style={[
              {
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                minHeight: 50,
                justifyContent: "center",
              },
              { backgroundColor: ctaBackground },
            ]}
            onPress={finish}
          >
            <ThemedText style={[{ fontSize: 17, fontWeight: "600" }, { color: ctaLabel }]}>
              Continue
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
