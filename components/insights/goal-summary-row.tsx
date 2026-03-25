import type { DayProgress } from "@/lib/health/day-progress";
import { styles as sharedStyles } from "@/components/settings-layout";
import { Text, View, type ColorValue } from "react-native";

import { GoalStatusGlyph } from "./goal-status-glyph";
import { styles } from "./insights-styles";

export function GoalSummaryRow({
  title,
  row,
  label,
  fmt,
  isToday,
  successColor,
  missedColor,
  tertiaryLabel,
  labelColor,
}: {
  title: string;
  row: DayProgress;
  label: string;
  fmt: (flOz: number) => string;
  isToday: boolean;
  successColor: ColorValue;
  missedColor: ColorValue;
  tertiaryLabel: ColorValue;
  labelColor: ColorValue;
}) {
  const ratio =
    row.goalFlOz > 0
      ? `${fmt(row.waterFlOz)} / ${fmt(row.goalFlOz)} ${label}`
      : `${fmt(row.waterFlOz)} ${label}`;

  return (
    <View style={styles.goalSummary} accessibilityElementsHidden>
      <View style={styles.goalSummaryText}>
        <Text style={[sharedStyles.checklistLabel, { color: labelColor }]}>{title}</Text>
        <Text style={[styles.goalSummarySub, { color: tertiaryLabel }]}>{ratio}</Text>
      </View>
      <View style={styles.goalSummaryTrail}>
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
      </View>
    </View>
  );
}
