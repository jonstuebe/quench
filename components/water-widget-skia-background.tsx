import { Canvas, Fill, Shader, Skia, vec, useClock } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

const WATER_SHADER_SOURCE = `
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_fill;
uniform vec3 u_colorTurquoise;
uniform vec3 u_colorSapphire;
uniform vec3 u_colorDeep;
uniform vec3 u_colorAir;

vec4 main(vec2 pos) {
  vec2 uv = pos / u_resolution;
  float t = u_time;
  float fill = clamp(u_fill, 0.0, 1.0);

  if (fill < 0.002) {
    return vec4(u_colorAir, 1.0);
  }

  // At goal (100%+), push the surface above the card so the wavy foam line is not visible
  // along the top edge. Below goal, water line follows fill only.
  float waterTop = (u_fill >= 1.0)
    ? (1.0 - max(u_fill, 1.02))
    : (1.0 - u_fill);
  float wave =
    sin(uv.x * 6.28318 * 4.0 + t * 2.8) * 0.007
    + sin(uv.x * 6.28318 * 9.0 - t * 2.1) * 0.0035
    + sin(uv.x * 6.28318 * 2.0 + t * 1.2) * 0.002;
  // Do not clamp the lower bound: when waterTop is negative (full/over goal), the surface
  // must stay above y=0 or clamp(…,0,1) pins it to the top and recreates a sliver of "air".
  float surfaceY = min(waterTop + wave, 1.0);

  if (uv.y < surfaceY) {
    return vec4(u_colorAir, 1.0);
  }

  float depthNorm = (uv.y - surfaceY) / max(0.001, 1.0 - surfaceY);
  depthNorm = clamp(depthNorm, 0.0, 1.0);
  float distSurf = uv.y - surfaceY;

  vec3 shallowMix = mix(u_colorTurquoise, u_colorSapphire, smoothstep(0.0, 0.45, depthNorm));
  vec3 body = mix(shallowMix, u_colorDeep, smoothstep(0.35, 1.0, depthNorm));

  float w1 = sin(dot(uv, vec2(3.2, 2.1)) + t * 0.55) * 0.5 + 0.5;
  float w2 = sin(dot(uv, vec2(-1.8, 4.0)) - t * 0.4) * 0.5 + 0.5;
  float gentle = w1 * 0.55 + w2 * 0.45;
  gentle = gentle * 0.045 + 0.977;
  body *= gentle;

  float shaft =
    sin(dot(uv, vec2(12.0, 5.0)) + t * 0.38) * 0.5
    + sin(dot(uv, vec2(-7.0, 15.0)) - t * 0.26) * 0.35;
  shaft *= 0.006 * (0.55 + 0.45 * smoothstep(0.15, 0.85, depthNorm));
  body *= 1.0 + shaft;

  float f1 = sin(dot(uv, vec2(11.0, 4.0)) + t * 1.0) * 0.5 + 0.5;
  float f2 = sin(dot(uv, vec2(-6.0, 9.0)) - t * 0.85) * 0.5 + 0.5;
  float f3 = sin(distSurf * 38.0 - t * 1.4) * 0.5 + 0.5;
  float foamVar = f1 * 0.45 + f2 * 0.35 + f3 * 0.2;
  float crest = sin(uv.x * 6.28318 * 10.0 + t * 3.2) * 0.5 + 0.5;
  crest *= sin(uv.x * 6.28318 * 22.0 - t * 4.0) * 0.35 + 0.65;
  float foamUltra = exp(-distSurf * 11.0);
  float foamWide = exp(-distSurf * 15.0);
  float foamMid = exp(-distSurf * 34.0);
  float foamTight = exp(-distSurf * 68.0);
  float foamBreak = smoothstep(0.28, 0.86, foamVar * 0.62 + crest * 0.38);
  float foamBody =
    foamUltra * 0.22 + foamWide * 0.48 + foamMid * 0.22 + foamTight * 0.08;
  float foamBright = foamBody * foamBreak * (0.78 + 0.22 * (f2 * 0.5 + f3 * 0.5));
  foamBright += foamMid * 0.52 * (0.5 + 0.5 * sin(dot(uv, vec2(58.0, 22.0)) + t * 6.0));
  float foamEdge = exp(-distSurf * 108.0) * (0.65 + 0.35 * f1);
  vec3 foamTint = vec3(0.94, 0.97, 1.0);
  vec3 outC = mix(body, foamTint, clamp(foamBright + foamEdge * 0.85, 0.0, 0.94));

  return vec4(outC, 1.0);
}
`;

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

type Props = {
  width: number;
  height: number;
  /** 0–1 fraction of daily goal consumed (drives water height). */
  fillFraction: number;
  /** Shallow / lit turquoise (underwater variance anchor). */
  colorTurquoise: string;
  /** Mid-depth sapphire blue. */
  colorSapphire: string;
  /** Deepest water near the bottom of the card. */
  colorDeep: string;
  /** Region above the water surface (empty tank). */
  colorAir: string;
};

export function WaterWidgetSkiaBackground({
  width,
  height,
  fillFraction,
  colorTurquoise,
  colorSapphire,
  colorDeep,
  colorAir,
}: Props) {
  const effect = useMemo(() => {
    const e = Skia.RuntimeEffect.Make(WATER_SHADER_SOURCE);
    if (!e) {
      throw new Error("Water shader failed to compile");
    }
    return e;
  }, []);

  const turquoise = useMemo(() => hexToRgb01(colorTurquoise), [colorTurquoise]);
  const sapphire = useMemo(() => hexToRgb01(colorSapphire), [colorSapphire]);
  const deep = useMemo(() => hexToRgb01(colorDeep), [colorDeep]);
  const air = useMemo(() => hexToRgb01(colorAir), [colorAir]);

  const clock = useClock();

  const uniforms = useDerivedValue(
    () => ({
      u_time: clock.value * 0.001,
      u_resolution: vec(width, height),
      u_fill: Math.max(0, fillFraction),
      u_colorTurquoise: turquoise,
      u_colorSapphire: sapphire,
      u_colorDeep: deep,
      u_colorAir: air,
    }),
    [clock, width, height, fillFraction, turquoise, sapphire, deep, air],
  );

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View style={styles.fill} pointerEvents="none">
      <Canvas style={{ width, height }}>
        <Fill>
          <Shader source={effect} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
