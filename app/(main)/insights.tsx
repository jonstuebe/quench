import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { sumWaterFlOzForDay, sumWaterUntilWallClock } from "@/lib/health/queries";
import { prefs$ } from "@/lib/prefs";
import { flOzToDisplay, formatVolumeLabel } from "@/lib/volume";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  min,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

export default function InsightsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const unit = useValue(prefs$.unit);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [todayYtd, setTodayYtd] = useState(0);
  const [yesterdayYtd, setYesterdayYtd] = useState(0);
  const [week, setWeek] = useState<{ date: Date; flOz: number }[]>([]);
  const [month, setMonth] = useState<{ date: Date; flOz: number }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = startOfDay(now);
      const yesterday = subDays(today, 1);
      const [t, y] = await Promise.all([
        sumWaterUntilWallClock(today),
        sumWaterUntilWallClock(yesterday),
      ]);
      setTodayYtd(t);
      setYesterdayYtd(y);

      const weekStart = subDays(today, 6);
      const days = eachDayOfInterval({ start: weekStart, end: today });
      const weekRows = await Promise.all(
        days.map(async (date) => ({
          date,
          flOz: await sumWaterFlOzForDay(date),
        })),
      );
      setWeek(weekRows);

      const mStart = startOfMonth(today);
      const monthDays = eachDayOfInterval({
        start: mStart,
        end: min([endOfMonth(today), new Date()]),
      });
      const monthRows = await Promise.all(
        monthDays.map(async (date) => ({
          date,
          flOz: await sumWaterFlOzForDay(date),
        })),
      );
      setMonth(monthRows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const label = formatVolumeLabel(unit);
  const fmt = (flOz: number) => flOzToDisplay(flOz, unit).toFixed(unit === "fl-oz" ? 1 : 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />
        ) : (
          <>
            <ThemedText type="subtitle" style={styles.section}>
              Today vs yesterday (by this time)
            </ThemedText>
            <View style={[styles.card, { borderColor: colors.icon }]}>
              <Row label="Today" value={`${fmt(todayYtd)} ${label}`} colors={colors} />
              <Row label="Yesterday" value={`${fmt(yesterdayYtd)} ${label}`} colors={colors} />
            </View>

            <ThemedText type="subtitle" style={styles.section}>
              Last 7 days
            </ThemedText>
            <View style={[styles.card, { borderColor: colors.icon }]}>
              {week.map((row) => (
                <Pressable
                  key={row.date.toISOString()}
                  onPress={() => router.push(`/day/${format(row.date, "yyyy-MM-dd")}`)}
                  style={[styles.rowPress, { borderBottomColor: colors.icon }]}
                >
                  <ThemedText>{format(row.date, "EEE MMM d")}</ThemedText>
                  <ThemedText style={{ fontWeight: "600" }}>
                    {fmt(row.flOz)} {label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="subtitle" style={styles.section}>
              This month
            </ThemedText>
            <View style={[styles.grid, { borderColor: colors.icon }]}>
              {month.map((row) => (
                <Pressable
                  key={row.date.toISOString()}
                  style={[styles.cell, { borderColor: colors.icon }]}
                  onPress={() => router.push(`/day/${format(row.date, "yyyy-MM-dd")}`)}
                >
                  <ThemedText style={styles.cellDay}>{format(row.date, "d")}</ThemedText>
                  <ThemedText style={styles.cellVal} numberOfLines={1}>
                    {fmt(row.flOz)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Pressable
          style={[styles.healthBtn, { borderColor: colors.tint }]}
          onPress={() => void Linking.openURL("x-apple-health://")}
        >
          <ThemedText style={{ color: colors.tint, fontWeight: "600" }}>Open Health</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: (typeof Colors)["light"];
}) {
  return (
    <View style={[styles.rowInner, { borderBottomColor: colors.icon }]}>
      <ThemedText>{label}</ThemedText>
      <ThemedText style={{ fontWeight: "600" }}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  section: { marginTop: 16, marginBottom: 8 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: "hidden",
  },
  rowInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPress: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: "hidden",
  },
  cell: {
    width: "14.28%",
    minHeight: 52,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  cellDay: { fontSize: 12, opacity: 0.7 },
  cellVal: { fontSize: 11, fontWeight: "600" },
  healthBtn: {
    marginTop: 28,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
});
