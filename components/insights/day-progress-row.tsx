import type { DayProgress } from "@/lib/health/day-progress";
import { SymbolView } from "expo-symbols";
import { Pressable, Text, View, type ColorValue } from "react-native";

import { GoalStatusGlyph } from "./goal-status-glyph";

export function DayProgressRow({
  row,
  title,
  ratioLine,
  labelColor,
  tertiaryLabel,
  successColor,
  missedColor,
  isToday,
  onPress,
  accessibilityLabel,
}: {
  row: DayProgress;
  title: string;
  ratioLine: string;
  labelColor: ColorValue;
  tertiaryLabel: ColorValue;
  successColor: ColorValue;
  missedColor: ColorValue;
  isToday: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
          paddingHorizontal: 16,
          minHeight: 56,
          gap: 8,
        },
        pressed && { opacity: 0.55 },
      ]}
    >
      <View style={{ flex: 1, gap: 2, paddingRight: 8 }}>
        <Text style={[{ fontSize: 17, fontWeight: "400" }, { color: labelColor }]}>{title}</Text>
        <Text
          style={[
            {
              fontSize: 13,
              lineHeight: 18,
              fontVariant: ["tabular-nums"],
            },
            { color: tertiaryLabel },
          ]}
          numberOfLines={1}
        >
          {ratioLine}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {row.goalFlOz > 0 ? (
          <Text
            style={[
              {
                fontSize: 15,
                fontWeight: "600",
                fontVariant: ["tabular-nums"],
                minWidth: 40,
                textAlign: "right",
              },
              { color: labelColor },
            ]}
          >
            {row.pct}%
          </Text>
        ) : null}
        <GoalStatusGlyph
          row={row}
          isToday={isToday}
          successColor={successColor}
          missedColor={missedColor}
          tertiaryLabel={tertiaryLabel}
        />
        <SymbolView
          name="chevron.right"
          size={13}
          tintColor={tertiaryLabel}
          resizeMode="scaleAspectFit"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
    </Pressable>
  );
}
