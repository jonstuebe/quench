import {
  BlurMask,
  Circle,
  Group,
  Oval,
  Path,
  RadialGradient,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { crackPath, EGG_SPECKLES, eggPath, shellBottomClip, shellTopClip } from "./geometry";
import { EGG } from "./palette";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

function Shell() {
  return (
    <>
      <Path path={eggPath}>
        <RadialGradient
          c={vec(104, 104)}
          r={120}
          colors={[EGG.light, EGG.mid, EGG.shade]}
          positions={[0, 0.5, 1]}
        />
      </Path>
      {EGG_SPECKLES.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} color={EGG.speckle} opacity={0.55} />
      ))}
      <Oval rect={Skia.XYWHRect(90, 76, 18, 30)} color="white" opacity={0.55}>
        <BlurMask blur={4} style="normal" />
      </Oval>
    </>
  );
}

/**
 * Speckled egg with a gentle rock and an occasional excited wiggle. `hatch` 0→1 cracks it
 * (0–0.45) and flings the shell halves apart (0.45–1).
 */
export function Egg({
  phase,
  amp,
  hatch,
}: {
  phase: SharedValue<number>;
  amp: SharedValue<number>;
  hatch: SharedValue<number>;
}) {
  const rock = useDerivedValue(() => {
    const p = phase.value;
    const a = amp.value;
    const gentle = Math.sin(p * TAU * 0.5) * 2.5;
    const burst = Math.pow(Math.max(0, Math.sin(p * TAU * 0.2)), 14) * Math.sin(p * TAU * 5) * 9;
    const h = hatch.value;
    const shake = h > 0 && h < 0.45 ? Math.sin(h * 90) * 8 * (h / 0.45) : 0;
    return [{ rotate: (gentle + burst + shake) * a * DEG }];
  });
  const crackEnd = useDerivedValue(() => Math.min(1, hatch.value / 0.35));
  const split = useDerivedValue(() => Math.max(0, (hatch.value - 0.45) / 0.55));
  const crackOpacity = useDerivedValue(() => (hatch.value > 0 ? 1 - split.value : 0));
  const topTransform = useDerivedValue(() => [
    { translateY: -70 * split.value },
    { translateX: -18 * split.value },
    { rotate: -28 * split.value * DEG },
  ]);
  const bottomTransform = useDerivedValue(() => [{ translateY: 26 * split.value }]);
  const shellOpacity = useDerivedValue(() => 1 - split.value);

  return (
    <Group transform={rock} origin={vec(120, 206)} opacity={shellOpacity}>
      <Oval rect={Skia.XYWHRect(72, 200, 96, 12)} color="black" opacity={0.12}>
        <BlurMask blur={5} style="normal" />
      </Oval>
      <Group transform={bottomTransform} origin={vec(120, 150)}>
        <Group clip={shellBottomClip}>
          <Shell />
        </Group>
      </Group>
      <Group transform={topTransform} origin={vec(120, 134)}>
        <Group clip={shellTopClip}>
          <Shell />
        </Group>
      </Group>
      <Path
        path={crackPath}
        color={EGG.crack}
        style="stroke"
        strokeWidth={2.4}
        strokeJoin="round"
        strokeCap="round"
        end={crackEnd}
        opacity={crackOpacity}
      />
    </Group>
  );
}
