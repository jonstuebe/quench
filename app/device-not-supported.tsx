import { ThemedText } from "@/components/themed-text";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeviceNotSupportedScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.box}>
        <ThemedText type="title" style={styles.title}>
          Health not available
        </ThemedText>
        <ThemedText style={styles.body}>
          Quench needs Apple Health on iPhone. This device does not support Health data.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  box: { flex: 1, padding: 24, justifyContent: "center" },
  title: { marginBottom: 12 },
  body: { fontSize: 17, lineHeight: 24 },
});
