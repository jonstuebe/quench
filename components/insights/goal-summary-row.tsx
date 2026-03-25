import type { DayProgress } from "@/lib/health/day-progress";
import { Text, View, type ColorValue } from "react-native";

import { GoalStatusGlyph } from "./goal-status-glyph";

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
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
      }}
      accessibilityElementsHidden
    >
      <View style={{ flex: 1, gap: 4 }}>
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
        >
          {ratio}
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
      </View>
    </View>
  );
}
