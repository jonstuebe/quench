import { useWaterShaderUniforms } from "@/hooks/use-water-shader-uniforms";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { WaterWidgetBackground } from "./water-widget-background";

/**
 * Full-window water shader / gradient behind the home screen (native Skia, web gradient).
 */
export function WaterHomeShaderBackdrop() {
  const { width, height } = useWindowDimensions();
  const {
    fillFraction,
    colorTurquoise,
    colorSapphire,
    colorDeep,
    colorAir,
    loading,
  } = useWaterShaderUniforms("today");

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View style={styles.layer} pointerEvents="none">
      {loading ? (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colorAir }]} />
      ) : (
        <WaterWidgetBackground
          width={width}
          height={height}
          fillFraction={fillFraction}
          colorTurquoise={colorTurquoise}
          colorSapphire={colorSapphire}
          colorDeep={colorDeep}
          colorAir={colorAir}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
