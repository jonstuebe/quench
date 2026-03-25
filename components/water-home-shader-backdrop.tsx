import { useWaterShaderUniforms } from "@/hooks/use-water-shader-uniforms";
import { useWindowDimensions, View } from "react-native";

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
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
      pointerEvents="none"
    >
      {loading ? (
        <View
          style={[
            {
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            },
            { backgroundColor: colorAir },
          ]}
        />
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
