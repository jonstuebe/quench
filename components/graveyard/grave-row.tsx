import { GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { memo } from "react";
import { PlatformColor, Pressable, Text, View } from "react-native";

import { GhostAxolotl } from "@/components/axolotl/ghost-axolotl";
import { Fonts } from "@/constants/theme";
import {
  daysLabel,
  epitaphFor,
  graveLifespan,
  graveAccessibilityLabel,
} from "@/lib/graveyard/graveyard";
import type { Grave } from "@/lib/streak/evaluate";

type Props = { grave: Grave; onPress: (id: string) => void };

/** One tombstone: static ghost, name, lifespan, streak and epitaph; reads as one element. */
export const GraveRow = memo(function GraveRow({ grave, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(grave.id)}
      accessibilityRole="button"
      accessibilityLabel={graveAccessibilityLabel(grave)}
      accessibilityHint="Opens this axolotl's memorial"
    >
      {({ pressed }) => (
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={{
            borderRadius: 26,
            paddingVertical: 12,
            paddingLeft: 8,
            paddingRight: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <GhostAxolotl streakLength={grave.streakLength} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text
                numberOfLines={1}
                style={{
                  flexShrink: 1,
                  fontFamily: Fonts.rounded,
                  fontSize: 19,
                  fontWeight: "700",
                  color: PlatformColor("label"),
                }}
                maxFontSizeMultiplier={1.8}
              >
                {grave.name}
              </Text>
              <Text
                style={{
                  marginLeft: "auto",
                  fontFamily: Fonts.rounded,
                  fontSize: 15,
                  fontWeight: "600",
                  fontVariant: ["tabular-nums"],
                  color: PlatformColor("secondaryLabel"),
                }}
                maxFontSizeMultiplier={1.8}
              >
                {daysLabel(grave.streakLength)}
              </Text>
            </View>
            <Text
              style={{ fontSize: 14, color: PlatformColor("secondaryLabel") }}
              maxFontSizeMultiplier={1.8}
            >
              {graveLifespan(grave)}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                marginTop: 2,
                fontFamily: Fonts.serif,
                fontStyle: "italic",
                fontSize: 14,
                color: PlatformColor("secondaryLabel"),
              }}
              maxFontSizeMultiplier={1.8}
            >
              “{epitaphFor(grave.id)}”
            </Text>
          </View>
          <SymbolView name="chevron.right" size={13} tintColor={PlatformColor("tertiaryLabel")} />
        </GlassView>
      )}
    </Pressable>
  );
});
