import { LogWaterPanel } from "@/components/log-water-panel";
import { WaterWidgetCard } from "@/components/water-widget-card";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { dayDate$, refreshDayMetrics } from "@/lib/health/store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format, isAfter, parseISO, startOfDay } from "date-fns";
import { useCallback, useMemo } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const parsed = useMemo(() => {
    try {
      return parseISO(date);
    } catch {
      return new Date();
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      const today = startOfDay(new Date());
      if (isAfter(startOfDay(parsed), today)) {
        router.back();
        return;
      }
      dayDate$.set(parsed);
      void refreshDayMetrics();
    }, [parsed, router]),
  );

  const title = format(parsed, "EEE, MMM d");
  const dateParam = format(parsed, "yyyy-MM-dd");

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 8,
            paddingBottom: 8,
          }}
        >
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>
            {title}
          </ThemedText>
          <View style={{ width: 28 }} />
        </View>
        <View style={{ flex: 1 }}>
          <WaterWidgetCard mode="day" />
        </View>
      </SafeAreaView>
      <LogWaterPanel dateParam={dateParam} />
    </View>
  );
}
