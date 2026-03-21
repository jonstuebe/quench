import { AddWaterToolbar } from "@/components/add-water-toolbar";
import { HomeHeader } from "@/components/home-header";
import { WaterWidget } from "@/components/water-widget";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack, useRouter } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <HomeHeader />
          <View style={styles.widgetWrap}>
            <WaterWidget mode="today" />
          </View>
        </SafeAreaView>
        {Platform.OS !== "ios" ? <AddWaterToolbar href="/log-water" /> : null}
      </View>
      {Platform.OS === "ios" ? (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.Spacer />
          <Stack.Toolbar.Button
            icon="plus.circle.fill"
            accessibilityLabel="Add water"
            separateBackground
            onPress={() => router.push("/log-water")}
          />
        </Stack.Toolbar>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  widgetWrap: { flex: 1 },
});
