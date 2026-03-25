import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { GoalConfettiOverlay } from "@/components/goal-confetti-overlay";
import { LogWaterPanel } from "@/components/log-water-panel";
import { WaterDayProgressTrack } from "@/components/water-day-progress-track";
import { WaterHomeShaderBackdrop } from "@/components/water-home-shader-backdrop";
import { WaterWidget } from "@/components/water-widget";
import { useWaterShaderUniforms } from "@/hooks/use-water-shader-uniforms";
import { useWaterUndoLastDrink } from "@/hooks/use-water-undo-last-drink";
import { GlassView } from "expo-glass-effect";

function WaterWidgetProgressFooter() {
  const { loading } = useWaterShaderUniforms("today");
  if (loading) return null;
  return (
    <View style={styles.trackFooter}>
      <GlassView glassEffectStyle="regular" style={styles.trackGlassOuter}>
        <WaterDayProgressTrack mode="today" />
      </GlassView>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { water, loading, goalFlOz } = useWaterShaderUniforms("today");
  const prevWaterRef = useRef<number | null>(null);
  const [goalConfettiRun, setGoalConfettiRun] = useState(0);

  useEffect(() => {
    if (loading || goalFlOz <= 0) return;
    const prev = prevWaterRef.current;
    const prevAtGoal = prev !== null && prev >= goalFlOz;
    const nowAtGoal = water >= goalFlOz;
    prevWaterRef.current = water;
    if (prev !== null && !prevAtGoal && nowAtGoal) {
      setGoalConfettiRun((n) => n + 1);
    }
  }, [water, goalFlOz, loading]);

  const { canUndo, onUndo } = useWaterUndoLastDrink({
    mode: "today",
    water,
    loading,
  });
  const showUndoInHeader = water > 0 && !loading && canUndo;

  return (
    <>
      <Stack.Toolbar placement="left">
        {showUndoInHeader ? (
          <Stack.Toolbar.Button icon="arrow.uturn.backward" onPress={onUndo} />
        ) : null}
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="clock"
          onPress={() => router.push("/insights")}
        />
        <Stack.Toolbar.Button
          icon="gearshape"
          onPress={() => router.push("/settings")}
        />
      </Stack.Toolbar>
      <View style={{ flex: 1 }}>
        <WaterHomeShaderBackdrop />
        <View style={styles.widgetColumn}>
          <WaterWidget
            mode="today"
            surfaceStyle="immersive"
            showUndoInWidget={false}
          />
          <WaterWidgetProgressFooter />
        </View>
        <LogWaterPanel />
      </View>
      <GoalConfettiOverlay runId={goalConfettiRun} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, minHeight: 0 },
  widgetWrap: { flex: 1, minHeight: 0, alignSelf: "stretch" },
  widgetColumn: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  trackFooter: {
    alignSelf: "stretch",
  },
  trackGlassOuter: {
    alignSelf: "stretch",
    borderRadius: 16,
    overflow: "hidden",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
