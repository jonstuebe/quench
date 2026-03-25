import { isHealthUnauthorizedError } from "@/lib/health/errors";
import {
  deleteWaterSampleByUuid,
  getLastDeletableWaterSampleForDay,
} from "@/lib/health/queries";
import {
  dayDate$,
  refreshDayMetrics,
  refreshTodayMetrics,
} from "@/lib/health/store";
import type { WaterWidgetMode } from "@/hooks/use-water-shader-uniforms";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export function useWaterUndoLastDrink({
  mode,
  water,
  loading,
  /** When false, skip HealthKit checks (e.g. parent shows header undo instead). */
  enabled = true,
}: {
  mode: WaterWidgetMode;
  water: number;
  loading: boolean;
  enabled?: boolean;
}) {
  const undoDayKey = format(
    mode === "today" ? new Date() : dayDate$.get(),
    "yyyy-MM-dd",
  );
  const [canUndoDeletable, setCanUndoDeletable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!enabled || loading || water <= 0) {
      setCanUndoDeletable(false);
      return;
    }
    void (async () => {
      try {
        const d = mode === "today" ? new Date() : dayDate$.get();
        const last = await getLastDeletableWaterSampleForDay(d);
        if (!cancelled) {
          setCanUndoDeletable(!!last?.uuid);
        }
      } catch {
        if (!cancelled) setCanUndoDeletable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, loading, water, mode, undoDayKey]);

  const onUndo = useCallback(async () => {
    if (!enabled) return;
    try {
      const d = mode === "today" ? new Date() : dayDate$.get();
      const last = await getLastDeletableWaterSampleForDay(d);
      if (!last?.uuid) {
        setCanUndoDeletable(false);
        return;
      }
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
  }, [enabled, mode]);

  return { canUndo: canUndoDeletable, onUndo };
}
