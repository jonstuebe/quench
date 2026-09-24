/**
 * The living axolotl, drawn in Skia. Every animated value is a Reanimated shared value
 * consumed directly by Skia props, so frames are produced on the UI thread.
 */
import {
  BlurMask,
  Circle,
  ColorMatrix,
  Group,
  Oval,
  Paint,
  Path,
  RadialGradient,
  Skia,
  usePathInterpolation,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import type { EyeStyle } from "@/lib/axolotl/visuals";

import {
  BODY,
  CX,
  EYE_DX,
  EYE_Y,
  GILL_SHAPES,
  GILLS,
  HEAD,
  closedEyePath,
  joyEyePath,
  MOUTH_Y,
  SPARKLES,
  sparklePath,
  sweatPath,
  tailFinPath,
  tailPath,
} from "./geometry";
import { AXOLOTL as C } from "./palette";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const ovalRect = (cx: number, cy: number, rx: number, ry: number) =>
  Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2);

export type AxolotlMotion = {
  /** Seconds of accumulated, tempo-scaled animation time. */
  phase: SharedValue<number>;
  /** 1 normally; small under Reduce Motion. */
  amp: SharedValue<number>;
  gillDroop: SharedValue<number>;
  saturation: SharedValue<number>;
  smile: SharedValue<number>;
  blush: SharedValue<number>;
  sparkle: SharedValue<number>;
  sweat: SharedValue<number>;
  urgency: SharedValue<number>;
  /** 0 → 1 over one drinking reaction; 0 at rest. */
  drink: SharedValue<number>;
  /** 1 open, 0 closed. */
  blink: SharedValue<number>;
  /** 0 → 1 pop-in scale when hatching (1 at rest). */
  appear: SharedValue<number>;
};

function Gill({ i, m }: { i: number; m: AxolotlMotion }) {
  const g = GILLS[i];
  const shape = GILL_SHAPES[i];
  const transform = useDerivedValue(() => {
    const droop = m.gillDroop.value;
    const sway =
      Math.sin(m.phase.value * TAU * 0.45 + i * 1.1) * 5 * m.amp.value * (1 - droop * 0.5);
    // Drinking fans the gills up for a moment.
    const perk = Math.sin(Math.min(1, m.drink.value * 1.6) * Math.PI) * -10;
    const angle = g.angle + droop * (48 - i * 6) + sway + perk;
    return [{ translateX: g.x }, { translateY: g.y }, { rotate: angle * DEG }];
  });
  return (
    <Group transform={transform}>
      <Path path={shape.fronds} color={C.frond} />
      <Path path={shape.stalk} color={C.gill} />
    </Group>
  );
}

function Gills({ m }: { m: AxolotlMotion }) {
  const gills = GILLS.map((_, i) => <Gill key={i} i={i} m={m} />);
  return (
    <>
      <Group>{gills}</Group>
      <Group transform={[{ translateX: CX * 2 }, { scaleX: -1 }]}>{gills}</Group>
    </>
  );
}

/** Sad / worried brows (left, right): inner end raised. */
const BROWS = [
  Skia.Path.MakeFromSVGString("M-8 -9 L 6 -14")!,
  Skia.Path.MakeFromSVGString("M8 -9 L -6 -14")!,
];

function Eye({ x, style, side }: { x: number; style: EyeStyle; side: -1 | 1 }) {
  if (style === "joy" || style === "closed") {
    return (
      <Group transform={[{ translateX: x }, { translateY: EYE_Y }]}>
        <Path
          path={style === "joy" ? joyEyePath : closedEyePath}
          color={C.eye}
          style="stroke"
          strokeWidth={3.4}
          strokeCap="round"
        />
      </Group>
    );
  }
  const r = style === "worried" ? 7 : style === "sad" ? 5.6 : 6.6;
  // Sad / worried brows: inner end (towards the centre line) raised.
  const brow = style === "sad" || style === "worried" ? BROWS[side < 0 ? 0 : 1] : null;
  return (
    <Group transform={[{ translateX: x }, { translateY: EYE_Y + (style === "sad" ? 1.5 : 0) }]}>
      <Circle cx={0} cy={0} r={r} color={C.eye} />
      <Circle cx={-2.2} cy={-2.4} r={r * 0.36} color="white" />
      <Circle cx={2.2} cy={2.2} r={r * 0.15} color="white" opacity={0.8} />
      {brow ? (
        <Path
          path={brow}
          color={C.mouth}
          style="stroke"
          strokeWidth={2.6}
          strokeCap="round"
          opacity={0.75}
        />
      ) : null}
    </Group>
  );
}

const mouthCurve = (s: number) =>
  Skia.Path.MakeFromSVGString(
    `M${CX - 17} ${MOUTH_Y} Q ${CX} ${MOUTH_Y + s * 11} ${CX + 17} ${MOUTH_Y}`,
  )!;
/** Frown → flat → grin; interpolated on the UI thread (no per-frame path parsing). */
const MOUTH_CURVES = [mouthCurve(-1), mouthCurve(0), mouthCurve(1)];
const OPEN_MOUTH = Skia.Path.MakeFromSVGString(
  `M${CX - 15} ${MOUTH_Y} Q ${CX} ${MOUTH_Y + 18} ${CX + 15} ${MOUTH_Y} Q ${CX} ${MOUTH_Y + 5} ${CX - 15} ${MOUTH_Y} Z`,
)!;

function Mouth({ m, open }: { m: AxolotlMotion; open: boolean }) {
  const sip = useDerivedValue(() => Math.sin(Math.min(1, m.drink.value * 1.4) * Math.PI));
  const path = usePathInterpolation(m.smile, [-1, 0, 1], MOUTH_CURVES);
  const curveOpacity = useDerivedValue(() => 1 - sip.value);
  // While sipping, the curve gives way to a small puckered "o".
  const pucker = useDerivedValue(() => sip.value);
  if (open) {
    return (
      <>
        <Path path={OPEN_MOUTH} color={C.mouth} />
        <Oval rect={ovalRect(CX, MOUTH_Y + 9, 6, 3.5)} color={C.tongue} />
      </>
    );
  }
  return (
    <>
      <Path
        path={path}
        color={C.mouth}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
        opacity={curveOpacity}
      />
      <Oval rect={ovalRect(CX, MOUTH_Y + 2, 5, 4.5)} color={C.mouth} opacity={pucker} />
    </>
  );
}

function Sparkle({ i, m }: { i: number; m: AxolotlMotion }) {
  const s = SPARKLES[i];
  const transform = useDerivedValue(() => {
    const tw = 0.55 + 0.45 * Math.sin(m.phase.value * TAU * 0.9 + i * 1.7);
    const k = s.s * tw * m.sparkle.value;
    return [
      { translateX: s.x },
      { translateY: s.y },
      { rotate: m.phase.value * 0.6 * m.amp.value },
      { scale: Math.max(0.001, k) },
    ];
  });
  return (
    <Group transform={transform}>
      <Path path={sparklePath} color={C.sparkle}>
        <BlurMask blur={0.6} style="solid" />
      </Path>
    </Group>
  );
}

function Bubble({ i, m }: { i: number; m: AxolotlMotion }) {
  const dx = [-6, 8, -12, 4, 12, -2][i];
  const r = [4, 3, 2.6, 5, 2.2, 3.4][i];
  const cy = useDerivedValue(() => {
    const t = Math.max(0, Math.min(1, (m.drink.value - i * 0.07) / 0.6));
    return MOUTH_Y - 4 - t * 104;
  });
  const cx = useDerivedValue(() => {
    const t = Math.max(0, (m.drink.value - i * 0.07) / 0.6);
    return CX + dx + Math.sin(t * 9 + i) * 5;
  });
  const opacity = useDerivedValue(() => {
    const t = (m.drink.value - i * 0.07) / 0.6;
    if (t <= 0 || t >= 1) return 0;
    return Math.sin(t * Math.PI) * 0.9;
  });
  return (
    <Circle
      cx={cx}
      cy={cy}
      r={r}
      color={C.bubble}
      style="stroke"
      strokeWidth={1.6}
      opacity={opacity}
    />
  );
}

export function AxolotlBody({ m, eyes }: { m: AxolotlMotion; eyes: EyeStyle }) {
  // Whole-pet motion: bob, breathe, celebratory hop, urgent wobble, drinking bounce, hatch pop.
  const petTransform = useDerivedValue(() => {
    const p = m.phase.value;
    const a = m.amp.value;
    const bob = Math.sin(p * TAU * 0.35) * 4 * a;
    const hop = -Math.abs(Math.sin(p * TAU * 0.8)) * 12 * m.sparkle.value * a;
    const wobble = Math.sin(p * TAU * 1.7) * 3.5 * m.urgency.value * a;
    const d = m.drink.value;
    const gulp = d > 0 && d < 1 ? Math.sin(d * Math.PI * 3) * Math.exp(-d * 3) : 0;
    const breathe = 1 + Math.sin(p * TAU * 0.35 + 1) * 0.012 * a;
    const pop = m.appear.value;
    return [
      { translateY: bob + hop - gulp * 10 * a },
      { rotate: wobble * DEG },
      { scaleX: pop * (breathe + gulp * 0.05 * a) },
      { scaleY: pop * (2 - breathe - gulp * 0.03 * a) },
    ];
  });

  const tailTransform = useDerivedValue(() => [
    { rotate: Math.sin(m.phase.value * TAU * 0.4) * 6 * DEG * m.amp.value },
  ]);

  const eyeTransform = useDerivedValue(() => [{ scaleY: Math.max(0.08, m.blink.value) }]);

  // Saturation (+ a touch of dimming when faded) applied to the whole pet.
  const matrix = useDerivedValue(() => {
    const s = m.saturation.value;
    const lr = 0.2126 * (1 - s);
    const lg = 0.7152 * (1 - s);
    const lb = 0.0722 * (1 - s);
    const b = 0.9 + 0.1 * Math.min(1, s);
    return [
      (lr + s) * b,
      lg * b,
      lb * b,
      0,
      0,
      lr * b,
      (lg + s) * b,
      lb * b,
      0,
      0,
      lr * b,
      lg * b,
      (lb + s) * b,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
    ];
  });

  const haloOpacity = useDerivedValue(
    () => m.urgency.value * (0.45 + 0.25 * Math.sin(m.phase.value * TAU * 1.1)),
  );
  const sweatTransform = useDerivedValue(() => {
    const t = (m.phase.value * 0.7) % 1;
    return [{ translateX: 184 }, { translateY: 58 + t * 16 * m.amp.value }];
  });
  const sweatOpacity = useDerivedValue(() => {
    const t = (m.phase.value * 0.7) % 1;
    return m.sweat.value * (t < 0.8 ? 1 : (1 - t) * 5);
  });

  return (
    <Group>
      <Circle cx={CX} cy={128} r={96} color={C.urgentHalo} opacity={haloOpacity}>
        <BlurMask blur={26} style="normal" />
      </Circle>

      <Group transform={petTransform} origin={vec(CX, 196)}>
        <Group
          layer={
            <Paint>
              <ColorMatrix matrix={matrix} />
            </Paint>
          }
        >
          {/* Soft contact shadow */}
          <Oval rect={ovalRect(CX, 204, 52, 7)} color="black" opacity={0.12}>
            <BlurMask blur={5} style="normal" />
          </Oval>

          <Group transform={tailTransform} origin={vec(150, 172)}>
            <Path path={tailPath} color={C.tail} />
            <Path path={tailFinPath} color={C.tailFin} opacity={0.9} />
          </Group>

          {/* Back legs peeking out */}
          <Oval rect={ovalRect(CX - 36, 180, 10, 7)} color={C.bodyShade} />
          <Oval rect={ovalRect(CX + 36, 180, 10, 7)} color={C.bodyShade} />

          <Oval rect={ovalRect(BODY.cx, BODY.cy, BODY.rx, BODY.ry)}>
            <RadialGradient c={vec(110, 150)} r={52} colors={[C.body, C.bodyShade]} />
          </Oval>
          <Oval rect={ovalRect(CX, 172, 24, 19)} color={C.belly} opacity={0.9} />

          {/* Front stubby legs with little toes */}
          {[-1, 1].map((sd) => (
            <Group key={sd}>
              <Oval rect={ovalRect(CX + sd * 22, 192, 11, 8)} color={C.limb} />
              <Circle cx={CX + sd * 16} cy={197} r={2.6} color={C.headLight} opacity={0.7} />
              <Circle cx={CX + sd * 22} cy={198.5} r={2.6} color={C.headLight} opacity={0.7} />
              <Circle cx={CX + sd * 28} cy={197} r={2.6} color={C.headLight} opacity={0.7} />
            </Group>
          ))}

          <Gills m={m} />

          <Oval rect={ovalRect(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry)}>
            <RadialGradient
              c={vec(104, 78)}
              r={86}
              colors={[C.headLight, C.head, C.headShade]}
              positions={[0, 0.55, 1]}
            />
          </Oval>
          <Oval rect={ovalRect(102, 70, 24, 10)} color="white" opacity={0.35}>
            <BlurMask blur={3} style="normal" />
          </Oval>

          <BlushCheeks m={m} />

          <Group transform={eyeTransform} origin={vec(CX, EYE_Y)}>
            <Eye x={CX - EYE_DX} style={eyes} side={-1} />
            <Eye x={CX + EYE_DX} style={eyes} side={1} />
          </Group>
          <Mouth m={m} open={eyes === "joy"} />
        </Group>

        <Group transform={sweatTransform} opacity={sweatOpacity}>
          <Path path={sweatPath} color={C.sweat} />
          <Circle cx={-2} cy={2} r={1.8} color="white" opacity={0.8} />
        </Group>

        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Bubble key={i} i={i} m={m} />
        ))}
      </Group>

      {SPARKLES.map((_, i) => (
        <Sparkle key={i} i={i} m={m} />
      ))}
    </Group>
  );
}

function BlushCheeks({ m }: { m: AxolotlMotion }) {
  const opacity = useDerivedValue(() => m.blush.value * 0.7);
  return (
    <Group opacity={opacity}>
      <Oval rect={ovalRect(CX - 42, 115, 10, 6)} color={C.blush}>
        <BlurMask blur={2.5} style="normal" />
      </Oval>
      <Oval rect={ovalRect(CX + 42, 115, 10, 6)} color={C.blush}>
        <BlurMask blur={2.5} style="normal" />
      </Oval>
    </Group>
  );
}
