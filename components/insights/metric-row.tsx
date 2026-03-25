import { styles as sharedStyles } from "@/components/settings-layout";
import { Text, View, type ColorValue } from "react-native";

import { styles } from "./insights-styles";

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
    <View style={styles.metricRow}>
      <Text style={[sharedStyles.checklistLabel, { color: labelColor }]}>{label}</Text>
      <Text selectable style={[styles.valueText, { color: labelColor }]}>
        {value}
      </Text>
    </View>
  );
}
