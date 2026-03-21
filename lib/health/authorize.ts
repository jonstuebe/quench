import { isHealthDataAvailable, requestAuthorization } from "@kingstinct/react-native-healthkit";

import { HK_APPLE_EXERCISE_TIME, HK_BODY_MASS, HK_WATER } from "@/lib/health/ids";

export function healthKitAvailable(): boolean {
  return isHealthDataAvailable();
}

export async function ensureHealthKitAuthorization(): Promise<void> {
  await requestAuthorization({
    toRead: [HK_WATER, HK_APPLE_EXERCISE_TIME, HK_BODY_MASS],
    toShare: [HK_WATER],
  });
}
