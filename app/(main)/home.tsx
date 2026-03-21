import { HeaderButton } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useLayoutEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { NativeStackHeaderItem } from "@react-navigation/native-stack";

import { LogWaterPanel } from "@/components/log-water-panel";
import { WaterWidget } from "@/components/water-widget";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";

function HomeHeaderRightFallback({ tintColor }: { tintColor: string }) {
  const router = useRouter();
  return (
    <View style={styles.headerActions}>
      <HeaderButton
        accessibilityLabel="Insights"
        onPress={() => {
          router.push("/insights");
        }}
      >
        <SymbolView
          name={{ ios: "clock", android: "schedule" }}
          size={22}
          tintColor={tintColor}
          resizeMode="scaleAspectFit"
        />
      </HeaderButton>
      <HeaderButton
        accessibilityLabel="Settings"
        onPress={() => {
          router.push("/settings");
        }}
      >
        <SymbolView
          name={{ ios: "gearshape", android: "settings" }}
          size={22}
          tintColor={tintColor}
          resizeMode="scaleAspectFit"
        />
      </HeaderButton>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  useLayoutEffect(() => {
    const tint = colors.text;

    navigation.setOptions({
      title: "",
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: tint,
      ...(Platform.OS === "ios"
        ? {
            unstable_headerRightItems: (): NativeStackHeaderItem[] => [
              {
                type: "button",
                label: "Insights",
                icon: { type: "sfSymbol", name: "clock" },
                onPress: () => {
                  router.push("/insights");
                },
              },
              {
                type: "button",
                label: "Settings",
                icon: { type: "sfSymbol", name: "gearshape" },
                onPress: () => {
                  router.push("/settings");
                },
              },
            ],
          }
        : {
            headerRight: () => <HomeHeaderRightFallback tintColor={tint} />,
          }),
    });
  }, [navigation, router, colors.background, colors.text]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
        <View style={styles.widgetWrap}>
          <WaterWidget mode="today" />
        </View>
      </SafeAreaView>
      <LogWaterPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, minHeight: 0 },
  widgetWrap: { flex: 1, minHeight: 0, alignSelf: "stretch" },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
