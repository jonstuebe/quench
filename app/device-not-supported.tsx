import { ThemedText } from "@/components/themed-text";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeviceNotSupportedScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
        <ThemedText type="title" style={{ marginBottom: 12 }}>
          Health not available
        </ThemedText>
        <ThemedText style={{ fontSize: 17, lineHeight: 24 }}>
          Quench needs Apple Health on iPhone. This device does not support Health data.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}
