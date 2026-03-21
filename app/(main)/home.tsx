import { HeaderButton } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useLayoutEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { NativeStackHeaderItem } from "@react-navigation/native-stack";

import { LogWaterPanel } from "@/components/log-water-panel";
import { WaterHomeShaderBackdrop } from "@/components/water-home-shader-backdrop";
import { WaterWidget } from "@/components/water-widget";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWaterShaderUniforms } from "@/hooks/use-water-shader-uniforms";
import { useWaterUndoLastDrink } from "@/hooks/use-water-undo-last-drink";
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
  const { water, loading } = useWaterShaderUniforms("today");
  const { canUndo, onUndo } = useWaterUndoLastDrink({
    mode: "today",
    water,
    loading,
  });

  useLayoutEffect(() => {
    const tint = colorScheme === "light" ? "#ffffff" : colors.text;
    const showUndoInHeader = water > 0 && !loading && canUndo;

    navigation.setOptions({
      title: "",
      headerTransparent: true,
      headerStyle: { backgroundColor: "transparent" },
      headerTintColor: tint,
      ...(Platform.OS === "ios"
        ? {
            unstable_headerLeftItems: (): NativeStackHeaderItem[] =>
              showUndoInHeader
                ? [
                    {
                      type: "button",
                      label: "Undo",
                      accessibilityLabel: "Undo last drink",
                      icon: {
                        type: "sfSymbol",
                        name: "arrow.uturn.backward",
                      },
                      onPress: onUndo,
                    },
                  ]
                : [],
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
            headerLeft: () =>
              showUndoInHeader ? (
                <HeaderButton
                  accessibilityLabel="Undo last drink"
                  onPress={onUndo}
                >
                  <SymbolView
                    name={{ ios: "arrow.uturn.backward", android: "undo" }}
                    size={22}
                    tintColor={tint}
                    resizeMode="scaleAspectFit"
                  />
                </HeaderButton>
              ) : null,
            headerRight: () => <HomeHeaderRightFallback tintColor={tint} />,
          }),
    });
  }, [
    navigation,
    router,
    colorScheme,
    colors.text,
    water,
    loading,
    canUndo,
    onUndo,
  ]);

  return (
    <View style={styles.root}>
      <WaterHomeShaderBackdrop />
      {/* Bottom inset is applied on `LogWaterPanel`; including bottom here doubled the gap above the picker. */}
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <View style={styles.widgetWrap}>
          <WaterWidget
            mode="today"
            surfaceStyle="immersive"
            showUndoInWidget={false}
          />
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
