import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { prefs$ } from "@/lib/prefs";
import { useValue } from "@legendapp/state/react";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeHeader() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const name = useValue(prefs$.name);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingTop: 8,
      }}
    >
      <View>
        <ThemedText style={{ fontSize: 20, fontWeight: "600" }}>{greeting()}</ThemedText>
        <ThemedText type="title" style={{ fontSize: 28, fontWeight: "700" }}>
          {name || "Quench"}
        </ThemedText>
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Link href="/insights" asChild>
          <Pressable accessibilityRole="button">
            <Ionicons name="stats-chart" size={24} color={colors.text} />
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="button">
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
