import { isHealthUnauthorizedError } from "@/lib/health/errors";
import { deleteWaterSampleByUuid, getLastDeletableWaterSampleForDay } from "@/lib/health/queries";
import { refreshTodayMetrics } from "@/lib/health/store";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export function useWaterUndoLastDrink({
  water,
  loading,
  /** When false, skip HealthKit checks (e.g. parent shows header undo instead). */
  enabled = true,
}: {
  water: number;
  loading: boolean;
  enabled?: boolean;
}) {
  const undoDayKey = format(new Date(), "yyyy-MM-dd");
  const [canUndoDeletable, setCanUndoDeletable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!enabled || loading || water <= 0) {
      setCanUndoDeletable(false);
      return;
    }
    void (async () => {
      try {
        const last = await getLastDeletableWaterSampleForDay(new Date());
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
  }, [enabled, loading, water, undoDayKey]);

  const onUndo = useCallback(async () => {
    if (!enabled) return;
    try {
      const last = await getLastDeletableWaterSampleForDay(new Date());
      if (!last?.uuid) {
        setCanUndoDeletable(false);
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteWaterSampleByUuid(last.uuid);
      await refreshTodayMetrics();
    } catch (e) {
      if (isHealthUnauthorizedError(e)) {
        Alert.alert(
          "Health access needed",
          "Allow Quench to write water in Settings → Health → Data Access & Devices → Quench.",
        );
      }
    }
  }, [enabled]);

  return { canUndo: canUndoDeletable, onUndo };
}
