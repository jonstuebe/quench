import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { isHealthUnauthorizedError } from "@/lib/health/errors";
import { saveWaterFlOz } from "@/lib/health/queries";
import { dayDate$, refreshDayMetrics, refreshTodayMetrics } from "@/lib/health/store";
import { prefs$ } from "@/lib/prefs";
import { scheduleNextReminder } from "@/lib/notifications";
import { buildAmountOptions, displayToFlOz, formatVolumeLabel } from "@/lib/volume";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Host, Picker, Text as SText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { parseISO, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, PlatformColor, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

function sampleDateForLog(dateStr: string | undefined): Date {
  const now = new Date();
  if (!dateStr) return now;
  const d = parseISO(dateStr);
  if (Number.isNaN(d.getTime())) return now;
  const t = new Date(d);
  t.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return t;
}

export default function LogWaterScreen() {
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const unit = useValue(prefs$.unit);
  const increment = useValue(prefs$.entryIncrementFlOz);

  const options = useMemo(() => buildAmountOptions(increment, unit), [increment, unit]);
  const [idx, setIdx] = useState(0);
  const label = formatVolumeLabel(unit);

  useEffect(() => {
    setIdx((j) => Math.min(j, Math.max(0, options.length - 1)));
  }, [options]);

  const displayVal = options[idx] ?? options[0] ?? increment;

  async function onAdd() {
    const flOz = displayToFlOz(displayVal, unit);
    const at = sampleDateForLog(dateParam);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await saveWaterFlOz(flOz, at);
      await refreshTodayMetrics();
      if (dateParam) {
        dayDate$.set(startOfDay(parseISO(dateParam)));
        await refreshDayMetrics();
      }
      const rm = prefs$.reminderMinutes.get();
      if (rm != null) {
        await scheduleNextReminder({
          wakeUp: prefs$.wakeUp.get(),
          bedtime: prefs$.bedtime.get(),
          intervalMinutes: rm,
          afterLogAt: new Date(),
        });
      }
      router.back();
    } catch (e) {
      if (isHealthUnauthorizedError(e)) {
        Alert.alert(
          "Health access needed",
          "Allow Quench to write water in Settings → Health → Data Access & Devices → Quench.",
        );
        return;
      }
      Alert.alert("Could not save", "Try again in a moment.");
    }
  }

  const useSwift = Platform.OS === "ios";

  const addButtonBg = colors.tint;
  const addButtonLabel = colorScheme === "dark" ? Colors.light.text : "#fff";

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + 12 },
      ]}
    >
      <View style={styles.sheetTop}>
        <View style={styles.header}>
          <View style={[styles.headerSide, styles.headerSideLeading]}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              {Platform.OS === "ios" ? (
                <SymbolView
                  name="xmark.circle.fill"
                  size={30}
                  tintColor={PlatformColor("label")}
                  resizeMode="scaleAspectFit"
                />
              ) : (
                <Ionicons name="close-circle" size={30} color={colors.text} />
              )}
            </Pressable>
          </View>
          <View style={styles.headerCenter}>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Log water
            </ThemedText>
          </View>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.body}>
          {useSwift ? (
            <Host matchContents style={styles.pickerHost}>
              <Picker
                selection={idx}
                onSelectionChange={(s) => setIdx(typeof s === "number" ? s : Number(s))}
                modifiers={[pickerStyle("wheel")]}
              >
                {options.map((opt, i) => (
                  <SText key={i} modifiers={[tag(i)]}>
                    {`${opt.toFixed(unit === "fl-oz" ? 1 : 0)} ${label}`}
                  </SText>
                ))}
              </Picker>
            </Host>
          ) : (
            <View style={styles.fallback}>
              <Pressable style={styles.step} onPress={() => setIdx((j) => Math.max(0, j - 1))}>
                <ThemedText style={styles.stepTxt}>−</ThemedText>
              </Pressable>
              <ThemedText style={styles.big}>
                {displayVal.toFixed(unit === "fl-oz" ? 1 : 0)} {label}
              </ThemedText>
              <Pressable
                style={styles.step}
                onPress={() => setIdx((j) => Math.min(options.length - 1, j + 1))}
              >
                <ThemedText style={styles.stepTxt}>+</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.add, { backgroundColor: addButtonBg }]}
        onPress={() => void onAdd()}
      >
        <ThemedText style={[styles.addTxt, { color: addButtonLabel }]}>Add</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: "space-between",
  },
  sheetTop: { flexShrink: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerSide: {
    flex: 1,
    minWidth: 0,
  },
  headerSideLeading: {
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  body: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 8,
  },
  pickerHost: {
    width: "100%",
    minHeight: 200,
    maxWidth: 320,
    alignSelf: "center",
  },
  fallback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  step: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#00000018",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTxt: { fontSize: 24, fontWeight: "500" },
  big: { fontSize: 28, fontWeight: "600", minWidth: 140, textAlign: "center" },
  add: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  addTxt: { fontSize: 17, fontWeight: "600" },
});
