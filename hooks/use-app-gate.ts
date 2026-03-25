import { syncState, when } from "@legendapp/state";
import { useValue } from "@legendapp/state/react";
import { useEffect, useState } from "react";

import { ensureHealthKitAuthorization, healthKitAvailable } from "@/lib/health/authorize";
import { prefs$ } from "@/lib/prefs";

export function useAppGate() {
  const [ready, setReady] = useState(false);
  const persistLoaded = useValue(() => syncState(prefs$).isPersistLoaded.get());
  const onboardingComplete = useValue(prefs$.onboardingComplete);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await when(syncState(prefs$).isPersistLoaded);
        if (healthKitAvailable()) {
          await ensureHealthKitAuthorization();
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const iosOk = healthKitAvailable();
  const showUnsupported = ready && persistLoaded && !iosOk;
  const showOnboarding = ready && persistLoaded && iosOk && !onboardingComplete;
  const showMain = ready && persistLoaded && iosOk && onboardingComplete;

  return { ready, showUnsupported, showOnboarding, showMain };
}
