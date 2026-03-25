import Constants from "expo-constants";

/** Bundle id of this build (matches `HKSource` for samples Quench can delete). */
export function getHealthAppBundleIdentifier(): string | undefined {
  return Constants.expoConfig?.ios?.bundleIdentifier;
}
