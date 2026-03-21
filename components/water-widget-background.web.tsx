import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

type Props = {
  width: number;
  height: number;
  fillFraction: number;
  colorTurquoise: string;
  colorSapphire: string;
  colorDeep: string;
  colorAir: string;
};

export function WaterWidgetBackground({
  fillFraction,
  colorTurquoise,
  colorSapphire,
  colorDeep,
  colorAir,
}: Props) {
  const fill = Math.min(100, Math.max(0, fillFraction * 100));
  const empty = 100 - fill;

  return (
    <View style={styles.fill} pointerEvents="none">
      <View style={[styles.column, StyleSheet.absoluteFill]}>
        <View style={{ flex: empty, backgroundColor: colorAir }} />
        <LinearGradient
          colors={[colorTurquoise, colorSapphire, colorDeep]}
          locations={[0, 0.42, 1]}
          style={{ flex: fill }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: StyleSheet.absoluteFillObject,
  column: {
    flexDirection: "column",
  },
});
