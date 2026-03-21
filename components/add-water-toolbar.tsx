import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type Href, Link } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Props = {
  href: Href;
};

export function AddWaterToolbar({ href }: Props) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isIos = Platform.OS === "ios";

  const tint = colors.tint;
  const bottomPad = Math.max(insets.bottom, 8);

  const button = (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add water"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Ionicons name="add-circle" size={24} color={tint} />
        <Text style={[styles.label, { color: tint }]}>Add water</Text>
      </Pressable>
    </Link>
  );

  if (isIos) {
    return (
      <BlurView intensity={50} tint="systemChromeMaterial" style={styles.iosBlur}>
        <View style={[styles.iosInner, { paddingBottom: bottomPad }]}>{button}</View>
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.androidBar,
        {
          paddingBottom: bottomPad,
          backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "rgba(249,249,249,0.98)",
          borderTopColor: colorScheme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        },
      ]}
    >
      {button}
    </View>
  );
}

const styles = StyleSheet.create({
  iosBlur: {
    overflow: "hidden",
  },
  iosInner: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  androidBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  buttonPressed: {
    opacity: 0.65,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
  },
});
