import { ThemedText } from "@/components/themed-text";
import { Colors, glassLabelOnBrightLight } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { isHealthUnauthorizedError } from "@/lib/health/errors";
import { saveWaterFlOz } from "@/lib/health/queries";
import {
  dayDate$,
  refreshDayMetrics,
  refreshTodayMetrics,
} from "@/lib/health/store";
import { scheduleNextReminder } from "@/lib/notifications";
import { prefs$ } from "@/lib/prefs";
import {
  buildAmountOptions,
  displayToFlOz,
  formatVolumeLabel,
} from "@/lib/volume";
import { Host, Picker, Text as SText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { parseISO, startOfDay } from "date-fns";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

function sampleDateForLog(dateStr: string | undefined): Date {
  const now = new Date();
  if (!dateStr) return now;
  const d = parseISO(dateStr);
  if (Number.isNaN(d.getTime())) return now;
  const t = new Date(d);
  t.setHours(
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
  return t;
}

type Props = {
  dateParam?: string;
};

/** Matches `WaterWidget` card `marginHorizontal` so the column aligns with the progress card. */
const COLUMN_MARGIN_H = 16;

/** Space between stacked log controls; `WaterWidget` bottom inset matches this above the panel. */
export const LOG_WATER_VERTICAL_STACK_GAP = 4;

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

  return (
    <View
      style={[
        { paddingTop: 0 },
        {
          backgroundColor: "transparent",
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <View style={{ marginHorizontal: COLUMN_MARGIN_H, alignSelf: "stretch" }}>
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={{
            borderRadius: 16,
            overflow: "hidden",
            alignSelf: "stretch",
          }}
        >
          <View
            style={{
              alignItems: "center",
              paddingTop: 4,
              paddingBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            <Host
              matchContents
              style={{
                width: "100%",
                minHeight: 200,
                alignSelf: "stretch",
              }}
            >
              <Picker
                selection={idx}
                onSelectionChange={(s) =>
                  setIdx(typeof s === "number" ? s : Number(s))
                }
                modifiers={[pickerStyle("wheel")]}
              >
                {options.map((opt, i) => (
                  <SText key={i} modifiers={[tag(i)]}>
                    {`${opt.toFixed(0)} ${label}`}
                  </SText>
                ))}
              </Picker>
            </Host>
          </View>
          <View
            style={[
              {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: "rgba(255,255,255,0.22)",
                marginHorizontal: 8,
              },
              colorScheme === "light" && {
                borderTopColor: "rgba(13,40,64,0.12)",
              },
            ]}
          />
          <Pressable
            style={({ pressed }) => [
              {
                paddingVertical: 14,
                alignItems: "center",
                alignSelf: "stretch",
              },
              pressed && { opacity: 0.85 },
            ]}
            onPress={onAdd}
          >
            <ThemedText
              style={[
                { fontSize: 17, fontWeight: "600" },
                {
                  color:
                    colorScheme === "light"
                      ? glassLabelOnBrightLight
                      : colors.tint,
                },
              ]}
            >
              Add
            </ThemedText>
          </Pressable>
        </GlassView>
      </View>
    </View>
  );
}
