/**
 * Static geometry for the Skia axolotl + egg, in a 240×240 design space (the canvas scales it).
 * Built once at module load; nothing here runs per frame.
 */
import { Skia, type SkPath } from "@shopify/react-native-skia";

export const VIEWBOX = 240;
/** Horizontal centre line; the left gills are the right ones mirrored across it. */
export const CX = 120;

export const HEAD = { cx: 120, cy: 100, rx: 66, ry: 50 };
export const BODY = { cx: 120, cy: 162, rx: 42, ry: 34 };
export const EYE_Y = 101;
export const EYE_DX = 27;
export const MOUTH_Y = 119;

const svg = (d: string): SkPath => {
  const p = Skia.Path.MakeFromSVGString(d);
  if (!p) throw new Error(`bad path: ${d}`);
  return p;
};

export const tailPath = svg(
  "M146 150 C 176 152 198 138 208 112 C 216 106 222 118 220 134 C 216 166 188 190 150 190 Z",
);
export const tailFinPath = svg(
  "M176 162 C 196 152 206 136 212 116 C 218 124 218 140 212 152 C 204 168 190 176 178 178 Z",
);

/** Right-side gill stalks: base point on the head edge, resting angle (deg), length. */
export const GILLS = [
  { x: 168, y: 72, angle: -48, len: 36 },
  { x: 181, y: 92, angle: -14, len: 40 },
  { x: 178, y: 114, angle: 18, len: 33 },
] as const;

/** Upward bow of a gill's centreline (quadratic, control point at mid-length). */
const bow = (len: number) => -len * 0.22;
const bowY = (u: number, len: number) => 2 * u * (1 - u) * bow(len);

/** A gill in local space: pointing along +x from the origin, curving gently upward. */
export function gillStalk(len: number): SkPath {
  const k = bow(len);
  return svg(
    `M0 -5.5 Q ${len * 0.5} ${k - 4.5} ${len} -2.2 Q ${len + 4} 0 ${len} 2.2 Q ${len * 0.5} ${k + 4.5} 0 5.5 Z`,
  );
}

/** Fluffy fronds along both edges of a gill stalk. */
export function gillFronds(len: number): SkPath {
  const circle = (x: number, y: number, r: number) =>
    `M${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  let d = "";
  for (let t = 8; t < len - 1; t += 5.2) {
    const u = t / len;
    const r = 5 - u * 1.8;
    const y = bowY(u, len);
    d += circle(t, y - 5.4, r) + circle(t, y + 5.4, r);
  }
  return svg(d + circle(len + 0.5, 0, 4));
}

export const GILL_SHAPES = GILLS.map((g) => ({
  stalk: gillStalk(g.len),
  fronds: gillFronds(g.len),
}));

/** Four-point twinkle star centred on the origin. */
export const sparklePath = svg(
  "M0 -9 Q 1.6 -1.6 9 0 Q 1.6 1.6 0 9 Q -1.6 1.6 -9 0 Q -1.6 -1.6 0 -9 Z",
);
export const SPARKLES = [
  { x: 36, y: 56, s: 1 },
  { x: 208, y: 44, s: 0.8 },
  { x: 26, y: 148, s: 0.7 },
  { x: 216, y: 176, s: 0.95 },
] as const;

/** Sweat drop centred on its bulb. */
export const sweatPath = svg(
  "M0 -10 C 4 -4 6.5 0 6.5 3 A 6.5 6.5 0 0 1 -6.5 3 C -6.5 0 -4 -4 0 -10 Z",
);

/** Joy "^" eye, centred on the eye position. */
export const joyEyePath = svg("M-6.5 2.5 Q 0 -6.5 6.5 2.5");
/** Peaceful closed eye (a gentle downward bow): the ghost's resting face. */
export const closedEyePath = svg("M-7 -1 Q 0 6 7 -1");

export const eggPath = svg(
  "M120 56 C 158 56 178 118 178 150 C 178 186 152 206 120 206 C 88 206 62 186 62 150 C 62 118 82 56 120 56 Z",
);
export const EGG_SPECKLES = [
  [96, 92, 4],
  [138, 84, 3],
  [150, 118, 5],
  [84, 134, 3.5],
  [110, 122, 2.5],
  [132, 150, 4],
  [98, 170, 3],
  [156, 168, 2.5],
  [120, 188, 3.5],
  [76, 162, 2.5],
] as const;

const CRACK = "M62 134 L76 124 L90 138 L104 122 L118 140 L132 122 L146 138 L160 124 L178 134";
export const crackPath = svg(CRACK);
/** Clip regions above / below the crack, for the shell halves flying apart. */
export const shellTopClip = svg(`${CRACK} L 240 134 L 240 0 L 0 0 L 0 134 Z`);
export const shellBottomClip = svg(`${CRACK} L 240 134 L 240 240 L 0 240 L 0 134 Z`);
