import { SymbolView } from "expo-symbols";
import { PlatformColor, Pressable, Text, View } from "react-native";

import { FloatingGhost } from "@/components/axolotl/ghost-axolotl";
import { Fonts } from "@/constants/theme";
import { daysLabel, heroAccessibilityLabel } from "@/lib/graveyard/graveyard";
import type { Grave } from "@/lib/streak/evaluate";

const GOLD = "#E8A93B";

type Props = { grave: Grave; onPress: (id: string) => void };

/** Graveyard header: the longest-lived axolotl floats large, crowned; one button to its memorial. */
export function LongestLifeHero({ grave, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(grave.id)}
      accessibilityRole="button"
      accessibilityLabel={heroAccessibilityLabel(grave)}
      style={({ pressed }) => ({
        alignItems: "center",
        marginBottom: 22,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <FloatingGhost streakLength={grave.streakLength} size={180} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: -8,
          maxWidth: "100%",
          paddingHorizontal: 16,
        }}
      >
        <SymbolView name="crown.fill" size={16} tintColor={GOLD} />
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            fontFamily: Fonts.rounded,
            fontSize: 26,
            fontWeight: "800",
            color: PlatformColor("label"),
          }}
          maxFontSizeMultiplier={1.6}
        >
          {grave.name}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: Fonts.rounded,
          fontSize: 15,
          fontWeight: "600",
          fontVariant: ["tabular-nums"],
          color: GOLD,
        }}
        maxFontSizeMultiplier={1.8}
      >
        {daysLabel(grave.streakLength)} · the longest life
      </Text>
    </Pressable>
  );
}
