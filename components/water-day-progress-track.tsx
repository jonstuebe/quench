import { addDays, format, setHours, setMinutes, startOfDay } from "date-fns";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { glassLabelOnBrightLight } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  type WaterWidgetMode,
  useWaterShaderUniforms,
} from "@/hooks/use-water-shader-uniforms";
import { dayDate$ } from "@/lib/health/store";
import { prefs$ } from "@/lib/prefs";
import type { TimeParts } from "@/lib/types";
import { useValue } from "@legendapp/state/react";

const ON_GRADIENT = "#ffffff";
const ON_GRADIENT_SUBTLE = "rgba(255,255,255,0.55)";

const TIME_LABEL_TEXT_SHADOW = {
  textShadowColor: "rgba(0,0,0,0.26)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
};

/** Equal segments across your wake window; notches divide that span. */
const DAY_SEGMENTS = 6;
const TRACK_H = 16;

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
  mode: WaterWidgetMode;
  /** Outer padding matching the old `ProgressTrackGlass` inset. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Day timeline bar + time labels (no glass wrapper). Used inside `WaterWidget` and `LogWaterPanel`.
 */
export function WaterDayProgressTrack({ mode, style }: Props) {
  const colorScheme = useColorScheme();
  const { water, goalFlOz, loading } = useWaterShaderUniforms(mode);
  const wakeUp = useValue(prefs$.wakeUp);
  const bedtime = useValue(prefs$.bedtime);
  const dayDate = useValue(dayDate$);

  const labelDay = mode === "today" ? new Date() : dayDate;
  const segmentTimes = segmentEndTimeLabels(
    labelDay,
    DAY_SEGMENTS,
    wakeUp,
    bedtime,
  );
  const labelDayKey = format(labelDay, "yyyy-MM-dd");

  const pct = goalFlOz > 0 ? Math.round((water / goalFlOz) * 100) : 0;
  const trackFillPct = Math.min(100, pct);

  if (loading) {
    return null;
  }

  return (
    <View style={[styles.meterWrap, style]}>
      <View
        style={styles.meterColumn}
        accessibilityLabel={`${pct} percent of daily goal. Track is divided into ${DAY_SEGMENTS} time segments from wake-up to bedtime; each notch is centered above a time label.`}
      >
        <View style={styles.trackContainer}>
          <View
            style={[
              styles.track,
              colorScheme === "light" && styles.trackLight,
            ]}
          >
            <View style={[styles.trackFill, { width: `${trackFillPct}%` }]} />
          </View>
          <View style={styles.trackNotchOverlay} pointerEvents="none">
            {Array.from({ length: DAY_SEGMENTS }, (_, i) => (
              <View
                key={`notch-${i}`}
                style={[styles.segmentCell, styles.trackOverlaySegment]}
              >
                <View
                  style={[
                    styles.segmentNotchLine,
                    colorScheme === "light" && styles.segmentNotchLineLight,
                  ]}
                />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.notchAndLabelRow}>
          {segmentTimes.map((t, i) => (
            <View key={`${labelDayKey}-seg-${i}`} style={styles.segmentCell}>
              <Text
                style={[
                  styles.timeLabel,
                  colorScheme === "light"
                    ? styles.timeLabelLight
                    : styles.timeLabelDark,
                ]}
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
  );
}

const styles = StyleSheet.create({
  meterWrap: {
    alignSelf: "stretch",
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
  trackLight: {
    backgroundColor: "rgba(13, 40, 64, 0.16)",
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
  segmentNotchLine: {
    width: StyleSheet.hairlineWidth,
    height: TRACK_H,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  segmentNotchLineLight: {
    backgroundColor: "rgba(13, 40, 64, 0.3)",
  },
  notchAndLabelRow: {
    flexDirection: "row",
    marginTop: 4,
    width: "100%",
  },
  timeLabel: {
    width: "100%",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
    ...Platform.select({
      ios: { fontVariant: ["tabular-nums"] },
      default: {},
    }),
  },
  timeLabelDark: {
    color: ON_GRADIENT_SUBTLE,
    ...TIME_LABEL_TEXT_SHADOW,
  },
  timeLabelLight: {
    color: glassLabelOnBrightLight,
    textShadowColor: "rgba(255,255,255,0.35)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
});
