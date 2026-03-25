import { DayProgressRow } from "@/components/insights/day-progress-row";
import { GoalSummaryRow } from "@/components/insights/goal-summary-row";
import {
  dayRowA11yLabel,
  titleFormat,
  titleFormatMonth,
} from "@/components/insights/insights-a11y";
import { styles } from "@/components/insights/insights-styles";
import { MetricRow } from "@/components/insights/metric-row";
import {
  getDayProgress,
  getWeightLbForGoals,
  type DayProgress,
} from "@/lib/health/day-progress";
import { sumWaterUntilWallClock } from "@/lib/health/queries";
import { prefs$ } from "@/lib/prefs";
import { flOzToDisplay, formatVolumeLabel } from "@/lib/volume";
import { useFocusEffect } from "@react-navigation/native";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  min,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  PlatformColor,
  Pressable,
  ScrollView,
  Text,
  View,
  type ColorValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

import {
  SectionHeader,
  styles as sharedStyles,
} from "@/components/settings-layout";

export default function InsightsScreen() {
  const unit = useValue(prefs$.unit);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const pageBg = PlatformColor("systemGroupedBackground");
  const groupBg = PlatformColor("secondarySystemGroupedBackground");
  const secondaryLabel = PlatformColor("secondaryLabel");
  const labelColor = PlatformColor("label");
  const tertiaryLabel = PlatformColor("tertiaryLabel");
  const tintColor = PlatformColor("tint");
  /** `tint` does not always resolve on `Text`; `link` matches Settings-style link rows. */
  const healthLinkColor =
    process.env.EXPO_OS === "ios" ? PlatformColor("link") : tintColor;
  const separatorColor = PlatformColor("separator");

  const successColor =
    process.env.EXPO_OS === "ios"
      ? PlatformColor("systemGreen")
      : ("#34C759" as ColorValue);
  const missedColor =
    process.env.EXPO_OS === "ios"
      ? PlatformColor("systemOrange")
      : ("#FF9500" as ColorValue);

  const [loading, setLoading] = useState(true);
  const [todayYtd, setTodayYtd] = useState(0);
  const [yesterdayYtd, setYesterdayYtd] = useState(0);
  const [week, setWeek] = useState<DayProgress[]>([]);
  const [month, setMonth] = useState<DayProgress[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = startOfDay(now);
      const yesterday = subDays(today, 1);
      const weightLb = await getWeightLbForGoals();

      const weekStart = subDays(today, 6);
      const days = eachDayOfInterval({ start: weekStart, end: today });
      const mStart = startOfMonth(today);
      const monthDays = eachDayOfInterval({
        start: mStart,
        end: min([endOfMonth(today), now]),
      });

      const [t, y, weekRows, monthRows] = await Promise.all([
        sumWaterUntilWallClock(today),
        sumWaterUntilWallClock(yesterday),
        Promise.all(days.map((d) => getDayProgress(d, weightLb))),
        Promise.all(monthDays.map((d) => getDayProgress(d, weightLb))),
      ]);
      setTodayYtd(t);
      setYesterdayYtd(y);
      setWeek(weekRows);
      setMonth(monthRows);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const label = formatVolumeLabel(unit);
  const fmt = (flOz: number) =>
    flOzToDisplay(flOz, unit).toFixed(unit === "fl-oz" ? 1 : 0);

  const tabularValue = (flOz: number) => `${fmt(flOz)} ${label}`;
  const ratioLine = (row: DayProgress) =>
    row.goalFlOz > 0
      ? `${fmt(row.waterFlOz)} / ${fmt(row.goalFlOz)} ${label}`
      : `${fmt(row.waterFlOz)} ${label}`;

  const onNavigateDay = useCallback(
    (date: Date) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/day/${format(date, "yyyy-MM-dd")}`);
    },
    [router],
  );

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);
  const todayFull = week.find((r) => isSameDay(r.date, todayStart));
  const yesterdayFull = week.find((r) => isSameDay(r.date, yesterdayStart));

  return (
    <ScrollView
      style={[sharedStyles.safe, { backgroundColor: pageBg }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        sharedStyles.scroll,
        { paddingBottom: Math.max(40, insets.bottom + 24) },
      ]}
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={tintColor} />
        </View>
      ) : (
        <>
          <SectionHeader color={secondaryLabel} first>
            Today vs yesterday
          </SectionHeader>
          <Text
            style={[sharedStyles.sectionCaption, { color: secondaryLabel }]}
          >
            Totals so far today compared to the same time yesterday.
          </Text>
          <View
            style={[
              sharedStyles.group,
              { backgroundColor: groupBg },
              styles.groupContinuous,
            ]}
          >
            <MetricRow
              label="Today"
              value={tabularValue(todayYtd)}
              labelColor={labelColor}
            />
            <View
              style={[
                sharedStyles.checklistSeparator,
                { backgroundColor: separatorColor },
              ]}
            />
            <MetricRow
              label="Yesterday"
              value={tabularValue(yesterdayYtd)}
              labelColor={labelColor}
            />
          </View>

          <SectionHeader color={secondaryLabel}>Full day vs goal</SectionHeader>
          <Text
            style={[sharedStyles.sectionCaption, { color: secondaryLabel }]}
          >
            Based on your weight and exercise for each day in Health. Tap any
            day below to review or log water.
          </Text>
          <View
            style={[
              sharedStyles.group,
              { backgroundColor: groupBg },
              styles.groupContinuous,
            ]}
          >
            {todayFull ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={dayRowA11yLabel(
                  todayFull,
                  "Today",
                  fmt,
                  label,
                )}
                onPress={() => onNavigateDay(todayFull.date)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <GoalSummaryRow
                  title="Today (so far)"
                  row={todayFull}
                  label={label}
                  fmt={fmt}
                  isToday
                  successColor={successColor}
                  missedColor={missedColor}
                  tertiaryLabel={tertiaryLabel}
                  labelColor={labelColor}
                />
              </Pressable>
            ) : null}
            {todayFull && yesterdayFull ? (
              <View
                style={[
                  sharedStyles.checklistSeparator,
                  { backgroundColor: separatorColor },
                ]}
              />
            ) : null}
            {yesterdayFull ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={dayRowA11yLabel(
                  yesterdayFull,
                  "Yesterday",
                  fmt,
                  label,
                )}
                onPress={() => onNavigateDay(yesterdayFull.date)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <GoalSummaryRow
                  title="Yesterday"
                  row={yesterdayFull}
                  label={label}
                  fmt={fmt}
                  isToday={false}
                  successColor={successColor}
                  missedColor={missedColor}
                  tertiaryLabel={tertiaryLabel}
                  labelColor={labelColor}
                />
              </Pressable>
            ) : null}
          </View>

          <SectionHeader color={secondaryLabel}>Last 7 days</SectionHeader>
          <View
            style={[
              sharedStyles.checklistGroup,
              { backgroundColor: groupBg },
              styles.groupContinuous,
            ]}
          >
            {week.map((row, index, arr) => (
              <View key={row.date.toISOString()}>
                <DayProgressRow
                  row={row}
                  title={format(row.date, "EEE, MMM d")}
                  ratioLine={ratioLine(row)}
                  labelColor={labelColor}
                  tertiaryLabel={tertiaryLabel}
                  successColor={successColor}
                  missedColor={missedColor}
                  isToday={isSameDay(row.date, todayStart)}
                  onPress={() => onNavigateDay(row.date)}
                  accessibilityLabel={dayRowA11yLabel(
                    row,
                    titleFormat(row.date),
                    fmt,
                    label,
                  )}
                />
                {index < arr.length - 1 ? (
                  <View
                    style={[
                      sharedStyles.checklistSeparator,
                      { backgroundColor: separatorColor },
                    ]}
                  />
                ) : null}
              </View>
            ))}
          </View>

          <SectionHeader color={secondaryLabel}>This month</SectionHeader>
          <View
            style={[
              sharedStyles.checklistGroup,
              { backgroundColor: groupBg },
              styles.groupContinuous,
            ]}
          >
            {month.map((row, index, arr) => (
              <View key={row.date.toISOString()}>
                <DayProgressRow
                  row={row}
                  title={format(row.date, "MMMM d")}
                  ratioLine={ratioLine(row)}
                  labelColor={labelColor}
                  tertiaryLabel={tertiaryLabel}
                  successColor={successColor}
                  missedColor={missedColor}
                  isToday={isSameDay(row.date, todayStart)}
                  onPress={() => onNavigateDay(row.date)}
                  accessibilityLabel={dayRowA11yLabel(
                    row,
                    titleFormatMonth(row.date),
                    fmt,
                    label,
                  )}
                />
                {index < arr.length - 1 ? (
                  <View
                    style={[
                      sharedStyles.checklistSeparator,
                      { backgroundColor: separatorColor },
                    ]}
                  />
                ) : null}
              </View>
            ))}
          </View>

          {process.env.EXPO_OS === "ios" ? (
            <>
              <SectionHeader color={secondaryLabel}>Health</SectionHeader>
              <View
                style={[
                  sharedStyles.group,
                  { backgroundColor: groupBg },
                  styles.groupContinuous,
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open Apple Health"
                  onPress={() => void Linking.openURL("x-apple-health://")}
                  style={({ pressed }) => [
                    sharedStyles.checklistRow,
                    styles.healthRowPressable,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.healthRowLabel}>
                    <Text
                      style={[
                        sharedStyles.checklistLabel,
                        { color: healthLinkColor },
                      ]}
                    >
                      Open Apple Health
                    </Text>
                  </View>
                  <SymbolView
                    name="arrow.up.right.square"
                    size={18}
                    tintColor={healthLinkColor}
                    resizeMode="scaleAspectFit"
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                </Pressable>
              </View>
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
