import { SymbolView } from "expo-symbols";
import { PlatformColor, Pressable, Text, View } from "react-native";

import { FloatingGhost } from "@/components/axolotl/ghost-axolotl";
import { Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { daysLabel, heroAccessibilityLabel } from "@/lib/graveyard/graveyard";
import type { Grave } from "@/lib/streak/evaluate";

const GOLD = "#E8A93B";
/** Darker gold for the light backdrop, where #E8A93B text is only ~2:1 (this is >= 4.5:1). */
const GOLD_ON_LIGHT = "#9A6A12";

type Props = { grave: Grave; onPress: (id: string) => void };

/** Graveyard header: the longest-lived axolotl floats large, crowned; one button to its memorial. */
export function LongestLifeHero({ grave, onPress }: Props) {
  const textGold = useColorScheme() === "dark" ? GOLD : GOLD_ON_LIGHT;
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
          numberOfLines={2}
          style={{
            flexShrink: 1,
            textAlign: "center",
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
          color: textGold,
        }}
        maxFontSizeMultiplier={1.8}
      >
        {daysLabel(grave.streakLength)} · the longest life
      </Text>
    </Pressable>
  );
}
