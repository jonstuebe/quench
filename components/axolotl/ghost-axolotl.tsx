/**
 * Memorial rendition of a past axolotl: the same Skia body, driven by `ghostVisuals` (faded,
 * eyes closed, still), tinted a cool moonlit blue, translucent, with a halo.
 *
 * Static by default: no frame callback and no timers, so a long list of graves costs one
 * paint per canvas. Pass `float` for a single hero ghost that drifts gently.
 */
import {
  BlurMask,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  Oval,
  Paint,
} from "@shopify/react-native-skia";
import { useEffect } from "react";
import { View } from "react-native";
import { useFrameCallback, useReducedMotion, useSharedValue } from "react-native-reanimated";

import { ghostVisuals } from "@/lib/axolotl/visuals";

import { AxolotlBody, type AxolotlMotion } from "./axolotl-body";
import { CX, VIEWBOX } from "./geometry";

/** Pulls every channel toward a pale periwinkle (the "spirit" tint), keeps alpha. */
const GHOST_TINT = [
  0.55, 0.12, 0.08, 0, 0.1, 0.1, 0.58, 0.1, 0, 0.13, 0.1, 0.12, 0.62, 0, 0.2, 0, 0, 0, 1, 0,
];

const HALO = "#FFE9A8";
const AURA = "#BFD8FF";

type Props = {
  streakLength: number;
  size: number;
  /** Gently drift (detail screen only). Honours Reduce Motion. */
  float?: boolean;
};

export function GhostAxolotl({ streakLength, size, float = false }: Props) {
  const v = ghostVisuals(streakLength);
  const reduced = useReducedMotion();
  const animate = float && !reduced;

  const phase = useSharedValue(0);
  const m: AxolotlMotion = {
    phase,
    amp: useSharedValue(animate ? 0.8 : 0),
    gillDroop: useSharedValue(v.gillDroop),
    saturation: useSharedValue(v.saturation),
    smile: useSharedValue(v.smile),
    blush: useSharedValue(v.blush),
    sparkle: useSharedValue(0),
    sweat: useSharedValue(0),
    urgency: useSharedValue(0),
    drink: useSharedValue(0),
    blink: useSharedValue(1),
    appear: useSharedValue(1),
  };

  const clock = useFrameCallback((f) => {
    const dt = Math.min(0.05, (f.timeSincePreviousFrame ?? 16) / 1000);
    phase.value += dt * 0.45;
  }, false);
  useEffect(() => {
    clock.setActive(animate);
    return () => clock.setActive(false);
  }, [animate, clock]);

  const scale = size / VIEWBOX;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale }]}>
          {/* Soft moonlit aura behind the ghost */}
          <Circle cx={CX} cy={120} r={66} color={AURA} opacity={0.18 + 0.14 * v.halo}>
            <BlurMask blur={20} style="normal" />
          </Circle>
          <Group
            opacity={v.opacity}
            layer={
              <Paint>
                <ColorMatrix matrix={GHOST_TINT} />
              </Paint>
            }
          >
            <AxolotlBody m={m} eyes={v.eyes} />
          </Group>
          {/* Halo: glow + crisp ring, brighter for longer lives */}
          <Oval x={CX - 34} y={20} width={68} height={16} color={HALO} opacity={0.55 * v.halo}>
            <BlurMask blur={6} style="normal" />
          </Oval>
          <Oval
            x={CX - 30}
            y={22}
            width={60}
            height={12}
            color={HALO}
            style="stroke"
            strokeWidth={4.5}
            opacity={0.5 + 0.5 * v.halo}
          />
        </Group>
      </Canvas>
    </View>
  );
}
