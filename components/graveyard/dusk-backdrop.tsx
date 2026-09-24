import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

/** Quiet twilight wash behind the graveyard so its glass has something to refract. */
export function DuskBackdrop() {
  const dark = useColorScheme() === "dark";
  return (
    <LinearGradient
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      colors={dark ? ["#171a33", "#10131f", "#0b0d14"] : ["#e4e7f7", "#eef0f7", "#f4f1f4"]}
      locations={[0, 0.55, 1]}
    />
  );
}
