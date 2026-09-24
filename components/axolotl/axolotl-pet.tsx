import { Canvas, Group } from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { moodVisuals, petAccessibilityLabel } from "@/lib/axolotl/visuals";
import type { PetMood } from "@/lib/streak/view";

import { AxolotlBody, type AxolotlMotion } from "./axolotl-body";
import { Egg } from "./egg";
import { VIEWBOX } from "./geometry";

const HATCH_MS = 1700;
/** Starting targets while still an egg, so the hatchling eases in from a happy baseline. */
const HATCHLING = moodVisuals("happy")!;
const MOOD_EASE = { duration: 900, easing: Easing.inOut(Easing.cubic) };

type Props = {
  mood: PetMood;
  name: string | null;
  size: number;
  /** Increment to play one drinking reaction (bubbles + bounce + haptic). */
  drinkToken: number;
  /** Stop the clock and blinking (screen unfocused / app backgrounded). */
  paused?: boolean;
  /** Set false when a wrapping control provides the accessibility element. */
  accessible?: boolean;
};

/**
 * Hero pet: an egg until the first goal-met day, then a mood-reactive axolotl. Plays a hatch
 * sequence when `mood` goes from "egg" to a living mood while mounted.
 */
export function AxolotlPet({
  mood,
  name,
  size,
  drinkToken,
  paused = false,
  accessible = true,
}: Props) {
  const reduced = useReducedMotion();
  const isEgg = mood === "egg";
  const v = moodVisuals(mood) ?? HATCHLING;

  const phase = useSharedValue(0);
  const tempo = useSharedValue(isEgg ? 1 : v.tempo);
  const amp = useSharedValue(reduced ? 0.15 : 1);
  const m: AxolotlMotion = {
    phase,
    amp,
    gillDroop: useSharedValue(v.gillDroop),
    saturation: useSharedValue(v.saturation),
    smile: useSharedValue(v.smile),
    blush: useSharedValue(v.blush),
    sparkle: useSharedValue(v.sparkles ? 1 : 0),
    sweat: useSharedValue(v.sweat ? 1 : 0),
    urgency: useSharedValue(v.urgency),
    drink: useSharedValue(0),
    blink: useSharedValue(1),
    appear: useSharedValue(1),
  };
  const hatch = useSharedValue(0);

  // Tempo-scaled clock, integrated on the UI thread so tempo changes never jump the phase.
  const clock = useFrameCallback((f) => {
    const dt = Math.min(0.05, (f.timeSincePreviousFrame ?? 16) / 1000);
    phase.value += dt * tempo.value;
  });

  useEffect(() => {
    amp.value = withTiming(reduced ? 0.15 : 1, { duration: 300 });
  }, [reduced, amp]);

  // Ease every mood parameter toward its new target.
  useEffect(() => {
    if (isEgg) return;
    const t = moodVisuals(mood);
    if (!t) return;
    tempo.value = withTiming(t.tempo, MOOD_EASE);
    m.gillDroop.value = withTiming(t.gillDroop, MOOD_EASE);
    m.saturation.value = withTiming(t.saturation, MOOD_EASE);
    m.smile.value = withTiming(t.smile, MOOD_EASE);
    m.blush.value = withTiming(t.blush, MOOD_EASE);
    m.sparkle.value = withTiming(t.sparkles ? 1 : 0, MOOD_EASE);
    m.sweat.value = withTiming(t.sweat ? 1 : 0, MOOD_EASE);
    m.urgency.value = withTiming(t.urgency, MOOD_EASE);
    // Shared values are stable refs; only the mood matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, isEgg]);

  useEffect(() => {
    clock.setActive(!paused);
  }, [paused, clock]);

  // Periodic blink (declarative repeat on the UI thread); stopped while paused.
  useEffect(() => {
    if (paused) {
      cancelAnimation(m.blink);
      m.blink.value = 1;
      return;
    }
    m.blink.value = withRepeat(
      withSequence(
        withDelay(3400, withTiming(0, { duration: 80 })),
        withTiming(1, { duration: 120 }),
        withDelay(260, withTiming(1, { duration: 0 })),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Drinking reaction.
  const lastDrink = useRef(drinkToken);
  useEffect(() => {
    if (drinkToken === lastDrink.current) return;
    lastDrink.current = drinkToken;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    if (isEgg) return;
    m.drink.value = 0;
    m.drink.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }, () => {
      m.drink.value = 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drinkToken, isEgg]);

  // Hatch: egg → alive while on screen.
  const prevEgg = useRef(isEgg);
  const [hatching, setHatching] = useState(false);
  useEffect(() => {
    const was = prevEgg.current;
    prevEgg.current = isEgg;
    if (!(was && !isEgg)) return;
    setHatching(true);
    hatch.value = 0;
    m.appear.value = 0;
    hatch.value = withTiming(1, { duration: reduced ? 500 : HATCH_MS });
    m.appear.value = withDelay(
      reduced ? 200 : HATCH_MS * 0.45,
      withSpring(1, { damping: 9, stiffness: 140 }),
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t = setTimeout(() => setHatching(false), (reduced ? 500 : HATCH_MS) + 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEgg]);

  const scale = size / VIEWBOX;
  return (
    <View
      accessible={accessible}
      accessibilityRole={accessible ? "image" : undefined}
      accessibilityLabel={accessible ? petAccessibilityLabel(name, mood) : undefined}
      style={{ width: size, height: size }}
    >
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale }]}>
          {!isEgg ? <AxolotlBody m={m} eyes={v.eyes} /> : null}
          {isEgg || hatching ? <Egg phase={phase} amp={amp} hatch={hatch} /> : null}
        </Group>
      </Canvas>
    </View>
  );
}
