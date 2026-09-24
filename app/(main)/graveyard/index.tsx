import { SymbolView } from "expo-symbols";
import { PlatformColor, Text, View } from "react-native";

/** Placeholder: past axolotls land here once the streak/pet layer exists. */
export default function GraveyardScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingHorizontal: 32,
        backgroundColor: PlatformColor("systemGroupedBackground"),
      }}
    >
      <SymbolView
        name="leaf"
        size={48}
        tintColor={PlatformColor("tertiaryLabel")}
        resizeMode="scaleAspectFit"
      />
      <Text style={{ fontSize: 20, fontWeight: "600", color: PlatformColor("label") }}>
        No axolotls here yet
      </Text>
      <Text
        style={{
          fontSize: 15,
          lineHeight: 20,
          textAlign: "center",
          color: PlatformColor("secondaryLabel"),
        }}
      >
        Keep your streak alive and this place stays empty.
      </Text>
    </View>
  );
}
