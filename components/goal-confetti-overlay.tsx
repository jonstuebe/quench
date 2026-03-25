import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Confetti } from "react-native-fast-confetti";

import { useColorScheme } from "@/hooks/use-color-scheme";

const FALL_MS = 7000;
/** Extra time after fall so fade-out can finish before unmount. */
const UNMOUNT_BUFFER_MS = 450;

type Props = {
  /**
   * Increment when the user crosses from below goal to at/above goal.
   * `0` means “never run yet” (initial mount).
   */
  runId: number;
};

export function GoalConfettiOverlay({ runId }: Props) {
  const { width, height } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const [visible, setVisible] = useState(false);

  const colors =
    colorScheme === "dark"
      ? ["#4fd4cf", "#2a9aaa", "#ffffff", "#1e7ec8", "#7aa8d4"]
      : ["#4fd4cf", "#1e7ec8", "#ffffff", "#2a9aaa", "#7aa8d4"];

  useEffect(() => {
    if (runId < 1) return;
    setVisible(true);
    const totalMs = FALL_MS + UNMOUNT_BUFFER_MS;
    const t = setTimeout(() => setVisible(false), totalMs);
    return () => clearTimeout(t);
  }, [runId]);

  if (!visible) return null;

  /** Negative Y pulls spawns above the top edge; pieces then fall through the default animation. */
  const spawnYMin = -Math.max(160, height * 0.18);

  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          overflow: "visible",
        },
        { zIndex: 999 },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Confetti
        key={runId}
        autoplay
        isInfinite={false}
        colors={colors}
        count={520}
        fadeOutOnEnd
        fallDuration={FALL_MS}
        flakeSize={{ width: 9, height: 18 }}
        height={height}
        randomOffset={{
          x: { min: -55, max: 55 },
          y: { min: spawnYMin, max: 60 },
        }}
        sizeVariation={0.14}
        verticalSpacing={18}
        width={width}
        containerStyle={{ zIndex: 999 }}
      />
    </View>
  );
}
