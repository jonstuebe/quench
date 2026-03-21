import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

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
import { flOzToDisplay, formatVolumeLabel } from "@/lib/volume";
import { useValue } from "@legendapp/state/react";

const ON_GRADIENT = "#ffffff";
const ON_GRADIENT_MUTED = "rgba(255,255,255,0.88)";

type Props = {
  mode: "today" | "day";
};

export function WaterWidget({ mode }: Props) {
  const colorScheme = useColorScheme();
  const unit = useValue(prefs$.unit);

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

  const gradientStart = colorScheme === "dark" ? "#0d3558" : "#3b8ad6";
  const gradientEnd = colorScheme === "dark" ? "#061f36" : "#1e6bb8";

  return (
    <LinearGradient colors={[gradientStart, gradientEnd]} style={styles.card}>
      <View style={styles.topBar}>
        {water > 0 && !loading ? (
          <Pressable
            onPress={onUndo}
            style={({ pressed }) => [styles.undoBtn, pressed && styles.undoBtnPressed]}
            accessibilityLabel="Undo last drink"
          >
            <Ionicons name="arrow-undo" size={20} color={ON_GRADIENT} />
          </Pressable>
        ) : (
          <View style={styles.undoPlaceholder} />
        )}
      </View>

      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator color={ON_GRADIENT} size="large" />
        ) : (
          <>
            <View style={styles.heroRow}>
              <Text style={styles.heroPct}>{pct}</Text>
              <Text style={styles.heroPctSuffix}>%</Text>
            </View>
            <Text style={styles.volumeLine}>
              {displayed.toFixed(unit === "fl-oz" ? 1 : 0)} {label} of{" "}
              {displayedGoal.toFixed(unit === "fl-oz" ? 1 : 0)} {label}
            </Text>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${pct}%` }]} />
            </View>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    minHeight: 280,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: 44,
  },
  undoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.22)",
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  heroPct: {
    fontSize: 72,
    fontWeight: "700",
    color: ON_GRADIENT,
  },
  heroPctSuffix: {
    fontSize: 30,
    fontWeight: "600",
    color: ON_GRADIENT_MUTED,
    marginLeft: 2,
  },
  volumeLine: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: "500",
    color: ON_GRADIENT_MUTED,
    textAlign: "center",
  },
  track: {
    alignSelf: "stretch",
    marginTop: 20,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: ON_GRADIENT,
  },
});
