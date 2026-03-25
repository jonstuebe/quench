import type { DayProgress } from "@/lib/health/day-progress";
import { SymbolView } from "expo-symbols";
import type { ColorValue } from "react-native";

export function GoalStatusGlyph({
  row,
  isToday,
  successColor,
  missedColor,
  tertiaryLabel,
}: {
  row: DayProgress;
  isToday: boolean;
  successColor: ColorValue;
  missedColor: ColorValue;
  tertiaryLabel: ColorValue;
}) {
  if (row.goalFlOz <= 0) {
    return (
      <SymbolView
        name="minus.circle"
        size={22}
        tintColor={tertiaryLabel}
        resizeMode="scaleAspectFit"
        accessibilityLabel="No goal"
      />
    );
  }
  if (row.met) {
    return (
      <SymbolView
        name="checkmark.circle.fill"
        size={22}
        tintColor={successColor}
        resizeMode="scaleAspectFit"
        accessibilityLabel="Goal met"
      />
    );
  }
  if (isToday) {
    return (
      <SymbolView
        name="clock"
        size={22}
        tintColor={tertiaryLabel}
        resizeMode="scaleAspectFit"
        accessibilityLabel="In progress"
      />
    );
  }
  return (
    <SymbolView
      name="xmark.circle.fill"
      size={22}
      tintColor={missedColor}
      resizeMode="scaleAspectFit"
      accessibilityLabel="Below goal"
    />
  );
}
