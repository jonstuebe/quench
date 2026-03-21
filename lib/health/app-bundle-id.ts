import Constants from "expo-constants";
import { Platform } from "react-native";

/** Bundle id of this build (matches `HKSource` for samples Quench can delete). */
export function getHealthAppBundleIdentifier(): string | undefined {
  if (Platform.OS === "ios") {
    return Constants.expoConfig?.ios?.bundleIdentifier;
  }
  if (Platform.OS === "android") {
    return Constants.expoConfig?.android?.package;
  }
  return undefined;
}
