/** Building blocks for the onboarding flow: water backdrop, progress dots, glass buttons. */
import { GlassView } from "expo-glass-effect";
import { SymbolView, type SFSymbol } from "expo-symbols";
import type { ReactNode } from "react";
import { Pressable, Text, useWindowDimensions, View, type ViewStyle } from "react-native";

import { WaterWidgetBackground } from "@/components/water-widget-background";
import { Fonts, glassLabelOnBrightLight } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/** Ink for text over the water backdrop and its glass. */
export function useInk() {
  const scheme = useColorScheme();
  return {
    scheme,
    ink: scheme === "light" ? glassLabelOnBrightLight : "#FFFFFF",
    muted: scheme === "light" ? "rgba(13,40,64,0.74)" : "rgba(255,255,255,0.76)",
    accent: scheme === "light" ? "#0A6FC2" : "#6FD3F0",
  };
}

/** The Home water, held at a fixed level: onboarding has no intake yet. */
export function OnboardingBackdrop({ level }: { level: number }) {
  const { width, height } = useWindowDimensions();
  const dark = useColorScheme() === "dark";
  if (width <= 0 || height <= 0) return null;
  return (
    <View style={{ position: "absolute", inset: 0 }} pointerEvents="none">
      <WaterWidgetBackground
        width={width}
        height={height}
        fillFraction={level}
        colorTurquoise={dark ? "#2a9aaa" : "#4fd4cf"}
        colorSapphire={dark ? "#0d4a6e" : "#1e7ec8"}
        colorDeep={dark ? "#081a2e" : "#1e6ec4"}
        colorAir={dark ? "#0c1624" : "#7aa8d4"}
      />
    </View>
  );
}

export function ProgressDots({
  count,
  index,
  label,
}: {
  count: number;
  index: number;
  label: string;
}) {
  const { ink } = useInk();
  return (
    <GlassView
      glassEffectStyle="regular"
      style={{
        flexDirection: "row",
        gap: 7,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
      }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === index ? 18 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: ink,
            opacity: i === index ? 0.95 : i < index ? 0.55 : 0.25,
          }}
        />
      ))}
    </GlassView>
  );
}

/** Round glass icon button (back). */
export function GlassIconButton({
  icon,
  label,
  onPress,
}: {
  icon: SFSymbol;
  label: string;
  onPress: () => void;
}) {
  const { ink } = useInk();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SymbolView name={icon} size={18} weight="semibold" tintColor={ink} />
      </GlassView>
    </Pressable>
  );
}

/** Small glass capsule text button (Skip, Not now). */
export function GlassTextButton({
  label,
  onPress,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
}) {
  const { ink } = useInk();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      hitSlop={6}
    >
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        style={{ minHeight: 44, borderRadius: 22, paddingHorizontal: 18, justifyContent: "center" }}
      >
        <Text
          style={{ color: ink, fontFamily: Fonts.rounded, fontSize: 16, fontWeight: "600" }}
          maxFontSizeMultiplier={1.4}
        >
          {label}
        </Text>
      </GlassView>
    </Pressable>
  );
}

/** Full-width tinted glass call to action. */
export function GlassCTA({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon?: SFSymbol;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        tintColor="#0A84FF"
        style={{
          minHeight: 56,
          borderRadius: 28,
          paddingHorizontal: 22,
          paddingVertical: 14,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {icon ? <SymbolView name={icon} size={19} weight="semibold" tintColor="#FFFFFF" /> : null}
        <Text
          style={{ color: "#FFFFFF", fontFamily: Fonts.rounded, fontSize: 18, fontWeight: "700" }}
          maxFontSizeMultiplier={1.5}
        >
          {label}
        </Text>
      </GlassView>
    </Pressable>
  );
}

export function GlassCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <GlassView
      glassEffectStyle="regular"
      style={[{ borderRadius: 26, paddingHorizontal: 18, paddingVertical: 16, gap: 10 }, style]}
    >
      {children}
    </GlassView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const { ink } = useInk();
  return (
    <Text
      accessibilityRole="header"
      style={{
        color: ink,
        fontFamily: Fonts.rounded,
        fontSize: 34,
        lineHeight: 40,
        fontWeight: "800",
        textAlign: "center",
      }}
      maxFontSizeMultiplier={1.6}
    >
      {children}
    </Text>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  const { muted } = useInk();
  return (
    <Text
      style={{
        color: muted,
        fontSize: 17,
        lineHeight: 23,
        fontWeight: "500",
        textAlign: "center",
        maxWidth: 360,
        alignSelf: "center",
      }}
      maxFontSizeMultiplier={1.8}
    >
      {children}
    </Text>
  );
}
