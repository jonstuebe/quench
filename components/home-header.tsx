import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeHeader() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

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
        <ThemedText type="title" style={{ fontSize: 28, fontWeight: "700" }}>
          {greeting()}
        </ThemedText>
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Link href="/insights" asChild>
          <Pressable accessibilityRole="button">
            <SymbolView
              name={{ ios: "chart.bar.fill", android: "bar_chart" }}
              size={24}
              tintColor={colors.text}
              resizeMode="scaleAspectFit"
            />
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="button">
            <SymbolView
              name={{ ios: "gearshape.fill", android: "settings" }}
              size={24}
              tintColor={colors.text}
              resizeMode="scaleAspectFit"
            />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
