import { GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { Text, View } from "react-native";

import { Fonts } from "@/constants/theme";
import { dropLevel, weekStripLabel, type WeekDay, type WeekStrip } from "@/lib/home/week";

const DROP = 24;

/** Drop colours: `full` for counted days, `partial` for today's in-progress level. */
export type DropColors = { full: string; partial: string; track: string };

type Props = {
  streak: number;
  week: WeekStrip;
  ink: string;
  inkMuted: string;
  colors: DropColors;
};

/** Streak count + the last 7 days as water drops that fill from the bottom. One a11y element. */
export function WeekStreak({ streak, week, ink, inkMuted, colors }: Props) {
  return (
    <GlassView
      glassEffectStyle="regular"
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 14,
      }}
      accessible
      accessibilityLabel={weekStripLabel(streak, week)}
    >
      <View style={{ alignItems: "center", minWidth: 32 }}>
        <Text
          style={{
            fontFamily: Fonts.rounded,
            fontWeight: "700",
            fontSize: 26,
            color: ink,
            fontVariant: ["tabular-nums"],
          }}
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
        >
          {streak}
        </Text>
        <Text
          style={{ fontSize: 11, color: inkMuted, fontWeight: "600" }}
          maxFontSizeMultiplier={1.3}
        >
          {streak === 1 ? "day" : "days"}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {week.days.map((d) => (
          <View key={d.key} style={{ alignItems: "center", gap: 4 }}>
            <Drop day={d} colors={colors} />
            <Text
              style={{
                fontSize: 10,
                color: d.isToday ? ink : inkMuted,
                fontWeight: "700",
              }}
              maxFontSizeMultiplier={1.3}
            >
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </GlassView>
  );
}

function Drop({ day, colors }: { day: WeekDay; colors: DropColors }) {
  const outlined = day.isToday || day.status === "pending";
  return (
    <View
      style={{
        width: DROP,
        height: DROP,
        opacity: day.status === "prehatch" || day.status === "untracked" ? 0.4 : 1,
      }}
    >
      <SymbolView
        name={outlined ? "drop" : "drop.fill"}
        size={DROP}
        tintColor={day.isToday ? colors.partial : colors.track}
      />
      {day.fill > 0 ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: DROP * dropLevel(day.fill),
            overflow: "hidden",
          }}
        >
          <View style={{ position: "absolute", bottom: 0, left: 0 }}>
            <SymbolView
              name="drop.fill"
              size={DROP}
              tintColor={day.met ? colors.full : colors.partial}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
