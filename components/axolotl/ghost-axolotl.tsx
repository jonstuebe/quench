/**
 * Memorial rendition of a past axolotl: the same Skia body, driven by `ghostVisuals` (faded,
 * eyes closed, still), tinted a cool moonlit blue, translucent, with a halo.
 *
 * Static by default: no frame callback and no timers, so a long list of graves costs one
 * paint per canvas. `FloatingGhost` is the single hero ghost that drifts gently.
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
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  makeMutable,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { ghostVisuals } from "@/lib/axolotl/visuals";

import { AxolotlBody, type AxolotlMotion } from "./axolotl-body";
import { CX, VIEWBOX } from "./geometry";

/** Pulls every channel toward a pale periwinkle (the "spirit" tint), keeps alpha. */
const GHOST_TINT = [
  0.55, 0.12, 0.08, 0, 0.1, 0.1, 0.58, 0.1, 0, 0.13, 0.1, 0.12, 0.62, 0, 0.2, 0, 0, 0, 1, 0,
];

const HALO = "#FFE9A8";
const AURA = "#BFD8FF";

type Props = { streakLength: number; size: number };

const GV = ghostVisuals(1);
/** Motion inputs for `AxolotlBody`, all constant for a ghost except phase/amp. */
function ghostMotion(mk: <T>(v: T) => SharedValue<T>): AxolotlMotion {
  return {
    phase: mk(0),
    amp: mk(0),
    gillDroop: mk(GV.gillDroop),
    saturation: mk(GV.saturation),
    smile: mk(GV.smile),
    blush: mk(GV.blush),
    sparkle: mk(0),
    sweat: mk(0),
    urgency: mk(0),
    drink: mk(0),
    blink: mk(1),
    appear: mk(1),
  };
}
/** One frozen set shared by every static ghost: list rows allocate no shared values. */
const STATIC_MOTION = ghostMotion(makeMutable);

/** Still ghost for lists: no frame callback, no per-row shared values. */
export function GhostAxolotl({ streakLength, size }: Props) {
  return <GhostScene m={STATIC_MOTION} streakLength={streakLength} size={size} />;
}

/** Hero ghost (detail screen) that drifts gently; stills under Reduce Motion. */
export function FloatingGhost({ streakLength, size }: Props) {
  const reduced = useReducedMotion();
  const phase = useSharedValue(0);
  const amp = useSharedValue(reduced ? 0 : 0.8);
  const [m] = useState(() => ({ ...STATIC_MOTION, phase, amp }));

  const clock = useFrameCallback((f) => {
    const dt = Math.min(0.05, (f.timeSincePreviousFrame ?? 16) / 1000);
    phase.value += dt * 0.45;
  }, false);
  useEffect(() => {
    amp.value = withTiming(reduced ? 0 : 0.8, { duration: 300 });
    clock.setActive(!reduced);
    return () => clock.setActive(false);
  }, [reduced, clock, amp]);

  return <GhostScene m={m} streakLength={streakLength} size={size} />;
}

function GhostScene({ m, streakLength, size }: Props & { m: AxolotlMotion }) {
  const v = ghostVisuals(streakLength);
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
