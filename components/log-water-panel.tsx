import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { isHealthUnauthorizedError } from "@/lib/health/errors";
import { saveWaterFlOz } from "@/lib/health/queries";
import { dayDate$, refreshDayMetrics, refreshTodayMetrics } from "@/lib/health/store";
import { prefs$ } from "@/lib/prefs";
import { scheduleNextReminder } from "@/lib/notifications";
import { buildAmountOptions, displayToFlOz, formatVolumeLabel } from "@/lib/volume";
import * as Haptics from "expo-haptics";
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

type Props = {
  dateParam?: string;
};

export function LogWaterPanel({ dateParam }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const unit = useValue(prefs$.unit);

  const options = useMemo(() => buildAmountOptions(unit), [unit]);
  const [idx, setIdx] = useState(0);
  const label = formatVolumeLabel(unit);

  useEffect(() => {
    setIdx((j) => Math.min(j, Math.max(0, options.length - 1)));
  }, [options]);

  const displayVal = options[idx] ?? options[0] ?? 0;

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
      if ((prefs$.remindersEnabled.get() ?? true) && rm != null) {
        await scheduleNextReminder({
          wakeUp: prefs$.wakeUp.get(),
          bedtime: prefs$.bedtime.get(),
          intervalMinutes: rm,
          afterLogAt: new Date(),
        });
      }
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

  const addButtonBg =
    colorScheme === "light"
      ? Platform.OS === "ios"
        ? PlatformColor("systemBlue")
        : "#007AFF"
      : colors.tint;
  const addButtonLabel = colorScheme === "dark" ? Colors.light.text : "#fff";

  const groupedBg = colorScheme === "dark" ? "#1C1C1E" : "#F2F2F7";

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <View style={styles.column}>
        <View style={[styles.grouped, { backgroundColor: groupedBg }]}>
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
                      {`${opt.toFixed(0)} ${label}`}
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
                  {displayVal.toFixed(0)} {label}
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
    </View>
  );
}

/** Matches `WaterWidget` card `marginHorizontal` so the column aligns with the progress card. */
const COLUMN_MARGIN_H = 16;

const styles = StyleSheet.create({
  root: {
    paddingTop: 0,
  },
  column: {
    marginHorizontal: COLUMN_MARGIN_H,
    alignSelf: "stretch",
  },
  grouped: {
    borderRadius: 12,
    overflow: "hidden",
  },
  body: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  pickerHost: {
    width: "100%",
    minHeight: 200,
    alignSelf: "stretch",
  },
  fallback: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: "100%",
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
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    alignSelf: "stretch",
  },
  addTxt: { fontSize: 17, fontWeight: "600" },
});
