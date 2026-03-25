import { addDays, format, setHours, setMinutes, startOfDay } from "date-fns";
import { useEffect, useState } from "react";
import {
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
  showCurrentTimeMarker?: boolean;
};

/**
 * Day timeline bar + time labels (no glass wrapper). Used inside `LogWaterPanel` and the home screen.
 */
export function WaterDayProgressTrack({
  mode,
  style,
  showCurrentTimeMarker = false,
}: Props) {
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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!showCurrentTimeMarker || mode !== "today") return;
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [mode, showCurrentTimeMarker]);

  const start = startOfDay(labelDay);
  const wakeAt = setMinutes(setHours(start, wakeUp.hour), wakeUp.minute);
  let bedAt = setMinutes(setHours(start, bedtime.hour), bedtime.minute);
  if (bedAt <= wakeAt) {
    bedAt = addDays(bedAt, 1);
  }
  const spanMs = Math.max(1, bedAt.getTime() - wakeAt.getTime());
  const markerNow = mode === "today" ? now : labelDay;
  const markerFractionRaw =
    (markerNow.getTime() - wakeAt.getTime()) / spanMs;
  const markerFraction = Math.max(0, Math.min(1, markerFractionRaw));
  const markerLeftPct = markerFraction * 100;

  if (loading) {
    return null;
  }

  return (
    <View style={[{ alignSelf: "stretch" }, style]}>
      <View
        style={{ width: "100%" }}
        accessibilityLabel={`${pct} percent of daily goal. Track is divided into ${DAY_SEGMENTS} time segments from wake-up to bedtime; each notch is centered above a time label.`}
      >
        <View style={{ position: "relative", width: "100%", height: TRACK_H }}>
          <View
            style={[
              {
                height: TRACK_H,
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.2)",
                overflow: "hidden",
              },
              colorScheme === "light" && {
                backgroundColor: "rgba(13, 40, 64, 0.16)",
              },
            ]}
          >
            <View
              style={{
                height: "100%",
                width: `${trackFillPct}%`,
                backgroundColor: ON_GRADIENT,
              }}
            />
          </View>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: "row",
              alignItems: "stretch",
            }}
            pointerEvents="none"
          >
            {Array.from({ length: DAY_SEGMENTS }, (_, i) => (
              <View
                key={`notch-${i}`}
                style={[
                  {
                    flex: 1,
                    minWidth: 0,
                    position: "relative",
                    alignItems: "flex-end",
                    paddingHorizontal: 0,
                  },
                  { minHeight: TRACK_H },
                ]}
              >
                <View
                  style={[
                    {
                      width: StyleSheet.hairlineWidth,
                      height: TRACK_H,
                      backgroundColor: "rgba(255,255,255,0.32)",
                    },
                    colorScheme === "light" && {
                      backgroundColor: "rgba(13, 40, 64, 0.3)",
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          {showCurrentTimeMarker && mode === "today" ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${markerLeftPct}%`,
                justifyContent: "center",
                transform: [{ translateX: -1 }],
              }}
            >
              <View
                style={[
                  {
                    width: 2,
                    height: TRACK_H,
                    borderRadius: 1,
                    backgroundColor: "rgba(255,255,255,0.95)",
                  },
                  colorScheme === "light" && {
                    backgroundColor: "rgba(13, 40, 64, 0.86)",
                  },
                ]}
              />
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", marginTop: 4, width: "100%" }}>
          {segmentTimes.map((t, i) => (
            <View
              key={`${labelDayKey}-seg-${i}`}
              style={{
                flex: 1,
                minWidth: 0,
                position: "relative",
                alignItems: "flex-end",
                paddingHorizontal: 0,
              }}
            >
              <Text
                style={[
                  {
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 0.2,
                    textAlign: "right",
                    fontVariant: ["tabular-nums"],
                  },
                  colorScheme === "light"
                    ? {
                        color: glassLabelOnBrightLight,
                        textShadowColor: "rgba(255,255,255,0.35)",
                        textShadowOffset: { width: 0, height: 0.5 },
                        textShadowRadius: 1.5,
                      }
                    : {
                        color: ON_GRADIENT_SUBTLE,
                        textShadowColor: "rgba(0,0,0,0.26)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
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
