import { Text, View, type ColorValue } from "react-native";

export function MetricRow({
  label,
  value,
  labelColor,
}: {
  label: string;
  value: string;
  labelColor: ColorValue;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 44,
      }}
    >
      <Text style={[{ fontSize: 17, fontWeight: "400" }, { color: labelColor }]}>{label}</Text>
      <Text
        selectable
        style={[
          {
            fontSize: 17,
            fontWeight: "600",
            fontVariant: ["tabular-nums"],
            textAlign: "right",
          },
          { color: labelColor },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
