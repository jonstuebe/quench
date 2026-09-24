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
    await refreshTodayMetrics();
    void evaluateStreakNow();
    const rm = prefs$.reminderMinutes.get();
    if ((prefs$.remindersEnabled.get() ?? true) && rm != null) {
      await scheduleNextReminder({
        wakeUp: prefs$.wakeUp.get(),
        bedtime: prefs$.bedtime.get(),
        intervalMinutes: rm,
        afterLogAt: new Date(),
      });
    }
    return true;
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
}
