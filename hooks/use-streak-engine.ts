import { subscribeToChanges } from "@kingstinct/react-native-healthkit";
import { addDays, startOfDay } from "date-fns";
import { useEffect } from "react";
import { AppState } from "react-native";

import { now$ } from "@/lib/clock";
import { HK_WATER } from "@/lib/health/ids";
import { evaluateStreakNow, onClockTick } from "@/lib/streak/engine";

const MINUTE_MS = 60_000;

/**
 * Keeps streak state current while the main UI is mounted: on launch, on foreground, on any
 * HealthKit water change (including our own logs), and at local midnight. Also ticks `now$`
 * each minute so the pace mood stays live.
 */
export function useStreakEngine() {
  useEffect(() => {
    void onClockTick();

    let midnightTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleMidnight = () => {
      clearTimeout(midnightTimer);
      const next = addDays(startOfDay(new Date()), 1).getTime() + 1_000;
      midnightTimer = setTimeout(() => {
        void onClockTick();
        scheduleMidnight();
      }, next - Date.now());
    };
    scheduleMidnight();

    const minuteTimer = setInterval(() => now$.set(Date.now()), MINUTE_MS);

    const appStateSub = AppState.addEventListener("change", (s) => {
      if (s !== "active") return;
      // Timers don't run while suspended: catch up on rollover and re-arm midnight.
      scheduleMidnight();
      void onClockTick();
    });

    const hkSub = subscribeToChanges(HK_WATER, () => {
      void evaluateStreakNow();
    });

    return () => {
      clearTimeout(midnightTimer);
      clearInterval(minuteTimer);
      appStateSub.remove();
      hkSub.remove();
    };
  }, []);
}
