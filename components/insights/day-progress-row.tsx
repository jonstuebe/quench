import type { DayProgress } from "@/lib/health/day-progress";
import { styles as sharedStyles } from "@/components/settings-layout";
import { SymbolView } from "expo-symbols";
import { Pressable, Text, View, type ColorValue } from "react-native";

import { GoalStatusGlyph } from "./goal-status-glyph";
import { styles } from "./insights-styles";

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
      style={({ pressed }) => [styles.dayRowPress, pressed && styles.pressed]}
    >
      <View style={styles.dayRowLeft}>
        <Text style={[sharedStyles.checklistLabel, { color: labelColor }]}>{title}</Text>
        <Text style={[styles.dayRowSub, { color: tertiaryLabel }]} numberOfLines={1}>
          {ratioLine}
        </Text>
      </View>
      <View style={styles.dayRowRight}>
        {row.goalFlOz > 0 ? (
          <Text style={[styles.pctText, { color: labelColor }]}>{row.pct}%</Text>
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
