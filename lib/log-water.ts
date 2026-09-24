import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";

import { isHealthUnauthorizedError } from "@/lib/health/errors";
import { saveWaterFlOz } from "@/lib/health/queries";
import { refreshTodayMetrics } from "@/lib/health/store";
import { scheduleNextReminder } from "@/lib/notifications";
import { prefs$ } from "@/lib/prefs";
import { evaluateStreakNow } from "@/lib/streak/engine";

/**
 * Save a drink to HealthKit, refresh today's totals, re-judge the streak and push the next
 * reminder. Returns whether the save succeeded (errors are surfaced as alerts).
 */
export async function logWaterFlOz(flOz: number): Promise<boolean> {
  try {
    await saveWaterFlOz(flOz, new Date());
  } catch (e) {
    if (isHealthUnauthorizedError(e)) {
      Alert.alert(
        "Health access needed",
        "Allow Quench to write water in Settings → Health → Data Access & Devices → Quench.",
      );
    } else {
      Alert.alert("Could not save", "Try again in a moment.");
    }
    return false;
  }
  // The drink is saved; everything below is best-effort and must not report a failure
  // (a false "Could not save" invites a re-tap and a double log).
  try {
    await refreshTodayMetrics();
  } catch (e) {
    console.warn("[log-water] refresh failed", e);
  }
  evaluateStreakNow().catch((e: unknown) => console.warn("[log-water] streak eval failed", e));
  try {
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
    console.warn("[log-water] reminder scheduling failed", e);
  }
  return true;
}

/** Wraps `logWaterFlOz` so overlapping taps can't log twice. */
export function useLogWater() {
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const log = useCallback(async (flOz: number) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setSaving(true);
    try {
      return await logWaterFlOz(flOz);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, []);
  return { log, saving };
}
