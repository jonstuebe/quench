import { addDays, format, setHours, setMinutes, startOfDay } from "date-fns";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Alert,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { isHealthUnauthorizedError } from "@/lib/health/errors";
import { calculateWaterGoalFlOz } from "@/lib/health/goal";
import { deleteWaterSampleByUuid, getLastWaterSampleForDay } from "@/lib/health/queries";
import {
  dayDate$,
  exerciseDayMin$,
  exerciseDaySync$,
  refreshDayMetrics,
  refreshTodayMetrics,
  todayExerciseMin$,
  todayExerciseSync$,
  todayWaterFlOz$,
  todayWaterSync$,
  waterDayFlOz$,
  waterDaySync$,
  weightLb$,
  weightSync$,
} from "@/lib/health/store";
import { prefs$ } from "@/lib/prefs";
import type { TimeParts } from "@/lib/types";
import { flOzToDisplay, formatVolumeLabel } from "@/lib/volume";
import { useValue } from "@legendapp/state/react";

import { WaterWidgetBackground } from "./water-widget-background";

const ON_GRADIENT = "#ffffff";
const ON_GRADIENT_MUTED = "rgba(255,255,255,0.78)";
const ON_GRADIENT_SUBTLE = "rgba(255,255,255,0.55)";

/** Equal segments across your wake window; notches divide that span. */
const DAY_SEGMENTS = 6;
const TRACK_H = 16;

/** Wall-clock time at the end of each segment from wake-up through bedtime. */
function segmentEndTimeLabels(
  day: Date,
  segments: number,
  wake: TimeParts,
  bed: TimeParts,
): string[] {
  const start = startOfDay(day);
  const wakeAt = setMinutes(setHours(start, wake.hour), wake.minute);
  let bedAt = setMinutes(setHours(start, bed.hour), bed.minute);
  if (bedAt <= wakeAt) {
    bedAt = addDays(bedAt, 1);
  }
  const spanMs = bedAt.getTime() - wakeAt.getTime();
  const out: string[] = [];
  for (let i = 0; i < segments; i++) {
    const end = new Date(wakeAt.getTime() + ((i + 1) / segments) * spanMs);
    out.push(format(end, "ha").replace(/\s/g, "").toLowerCase());
  }
  return out;
}

type Props = {
  mode: "today" | "day";
};

export function WaterWidget({ mode }: Props) {
  const colorScheme = useColorScheme();
  const unit = useValue(prefs$.unit);
  const wakeUp = useValue(prefs$.wakeUp);
  const bedtime = useValue(prefs$.bedtime);
  const dayDate = useValue(dayDate$);

  const water = useValue(mode === "today" ? todayWaterFlOz$ : waterDayFlOz$);
  const exerciseMin = useValue(mode === "today" ? todayExerciseMin$ : exerciseDayMin$);
  const weight = useValue(weightLb$);

  const waterLoaded = useValue(() =>
    mode === "today" ? todayWaterSync$.isLoaded.get() : waterDaySync$.isLoaded.get(),
  );
  const exerciseLoaded = useValue(() =>
    mode === "today" ? todayExerciseSync$.isLoaded.get() : exerciseDaySync$.isLoaded.get(),
  );
  const weightLoaded = useValue(() => weightSync$.isLoaded.get());
  const loading = !waterLoaded || !exerciseLoaded || !weightLoaded;

  const goalFlOz = calculateWaterGoalFlOz(weight, exerciseMin);
  const displayed = flOzToDisplay(water, unit);
  const displayedGoal = flOzToDisplay(goalFlOz, unit);
  const pct = goalFlOz > 0 ? Math.min(100, Math.round((water / goalFlOz) * 100)) : 0;
  const label = formatVolumeLabel(unit);

  async function onUndo() {
    try {
      const d = mode === "today" ? new Date() : dayDate$.get();
      const last = await getLastWaterSampleForDay(d);
      if (!last?.uuid) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteWaterSampleByUuid(last.uuid);
      if (mode === "today") await refreshTodayMetrics();
      else await refreshDayMetrics();
    } catch (e) {
      if (isHealthUnauthorizedError(e)) {
        Alert.alert(
          "Health access needed",
          "Allow Quench to write water in Settings → Health → Data Access & Devices → Quench.",
        );
      }
    }
  }

  /** Underwater palette: turquoise → sapphire → deep (Skia shader + web gradient). */
  const colorTurquoise = colorScheme === "dark" ? "#2a9aaa" : "#4fd4cf";
  const colorSapphire = colorScheme === "dark" ? "#0d4a6e" : "#1e7ec8";
  const colorDeep = colorScheme === "dark" ? "#081a2e" : "#1e6ec4";
  /** Area above the water line (empty tank). */
  const colorAir = colorScheme === "dark" ? "#0c1624" : "#7aa8d4";

  const fillFraction = goalFlOz > 0 ? Math.min(1, water / goalFlOz) : 0;

  const kickerLabel = mode === "today" ? "Today" : format(dayDate, "EEE, MMM d");

  const labelDay = mode === "today" ? new Date() : dayDate;
  const segmentTimes = segmentEndTimeLabels(labelDay, DAY_SEGMENTS, wakeUp, bedtime);
  const labelDayKey = format(labelDay, "yyyy-MM-dd");

  const [bgLayout, setBgLayout] = useState({ width: 0, height: 0 });
  const onCardInnerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBgLayout({ width, height });
  };

  return (
    <View style={styles.cardOuter}>
      <View style={styles.cardInner} onLayout={onCardInnerLayout}>
        <WaterWidgetBackground
          width={bgLayout.width}
          height={bgLayout.height}
          fillFraction={fillFraction}
          colorTurquoise={colorTurquoise}
          colorSapphire={colorSapphire}
          colorDeep={colorDeep}
          colorAir={colorAir}
        />
        <View style={styles.cardForeground}>
          <View style={styles.topBar}>
            {water > 0 && !loading ? (
              <Pressable
                onPress={onUndo}
                style={({ pressed }) => [styles.undoBtn, pressed && styles.undoBtnPressed]}
                accessibilityLabel="Undo last drink"
              >
                <SymbolView
                  name={{ ios: "arrow.uturn.backward", android: "undo" }}
                  size={20}
                  tintColor={ON_GRADIENT}
                  resizeMode="scaleAspectFit"
                />
              </Pressable>
            ) : (
              <View style={styles.undoPlaceholder} />
            )}
          </View>

          <View style={styles.body}>
            {loading ? (
              <View style={styles.heroCenter}>
                <ActivityIndicator color={ON_GRADIENT} size="large" />
              </View>
            ) : (
              <>
                <View style={styles.heroCenter}>
                  <Text style={styles.kicker}>{kickerLabel}</Text>
                  <View style={styles.heroRow}>
                    <Text
                      style={[
                        styles.heroPct,
                        Platform.OS === "ios" && {
                          fontVariant: ["tabular-nums"],
                        },
                      ]}
                    >
                      {pct}
                    </Text>
                    <Text style={styles.heroPctSuffix}>%</Text>
                  </View>
                  <Text style={styles.volumeLine}>
                    {displayed.toFixed(unit === "fl-oz" ? 1 : 0)} {label} of{" "}
                    {displayedGoal.toFixed(unit === "fl-oz" ? 1 : 0)} {label}
                  </Text>
                </View>

                <View style={styles.trackFooter}>
                  <View
                    style={styles.meterColumn}
                    accessibilityLabel={`${pct} percent of daily goal. Track is divided into ${DAY_SEGMENTS} time segments from wake-up to bedtime; each notch is centered above a time label.`}
                  >
                    <View style={styles.trackContainer}>
                      <View style={styles.track}>
                        <View style={[styles.trackFill, { width: `${pct}%` }]} />
                      </View>
                      <View style={styles.trackNotchOverlay} pointerEvents="none">
                        {Array.from({ length: DAY_SEGMENTS }, (_, i) => (
                          <View
                            key={`notch-${i}`}
                            style={[styles.segmentCell, styles.trackOverlaySegment]}
                          >
                            <View style={styles.segmentNotchLine} />
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.notchAndLabelRow}>
                      {segmentTimes.map((t, i) => (
                        <View key={`${labelDayKey}-seg-${i}`} style={styles.segmentCell}>
                          <Text
                            style={styles.timeLabel}
                            numberOfLines={1}
                            {...Platform.select({
                              ios: {
                                adjustsFontSizeToFit: true,
                                minimumFontScale: 0.75,
                              },
                              default: {},
                            })}
                          >
                            {t}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardInner: {
    flex: 1,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },
  cardForeground: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    minHeight: 44,
  },
  undoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  undoBtnPressed: {
    opacity: 0.85,
  },
  undoPlaceholder: {
    width: 44,
    height: 44,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  heroCenter: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  trackFooter: {
    alignSelf: "stretch",
  },
  kicker: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: ON_GRADIENT_SUBTLE,
    marginBottom: 4,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  heroPct: {
    fontSize: 64,
    fontWeight: "600",
    letterSpacing: Platform.OS === "ios" ? -1.5 : 0,
    color: ON_GRADIENT,
  },
  heroPctSuffix: {
    fontSize: 26,
    fontWeight: "600",
    color: ON_GRADIENT_MUTED,
    marginLeft: 1,
  },
  volumeLine: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "500",
    color: ON_GRADIENT_MUTED,
    textAlign: "center",
    letterSpacing: Platform.OS === "ios" ? -0.2 : 0,
  },
  meterColumn: {
    width: "100%",
  },
  trackContainer: {
    position: "relative",
    width: "100%",
    height: TRACK_H,
  },
  track: {
    height: TRACK_H,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    backgroundColor: ON_GRADIENT,
  },
  trackNotchOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "stretch",
  },
  trackOverlaySegment: {
    minHeight: TRACK_H,
  },
  segmentCell: {
    flex: 1,
    minWidth: 0,
    position: "relative",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  /** Centered in the segment column via flex (avoids left:50% rounding drift on iOS). */
  segmentNotchLine: {
    width: StyleSheet.hairlineWidth,
    height: TRACK_H,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  notchAndLabelRow: {
    flexDirection: "row",
    marginTop: 4,
    width: "100%",
  },
  timeLabel: {
    width: "100%",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
    color: ON_GRADIENT_SUBTLE,
    textAlign: "center",
    ...Platform.select({
      ios: { fontVariant: ["tabular-nums"] },
      default: {},
    }),
  },
});
