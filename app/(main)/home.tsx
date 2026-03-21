import { HomeHeader } from "@/components/home-header";
import { LogWaterPanel } from "@/components/log-water-panel";
import { WaterWidget } from "@/components/water-widget";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <HomeHeader />
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
  safe: { flex: 1 },
  widgetWrap: { flex: 1 },
});
