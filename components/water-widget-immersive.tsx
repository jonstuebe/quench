import { View } from "react-native";

import { type WaterWidgetMode } from "@/hooks/use-water-shader-uniforms";

import { WaterWidgetForeground, useWaterWidgetModel } from "./water-widget";

type Props = {
  mode: WaterWidgetMode;
};

export function WaterWidgetImmersive({ mode }: Props) {
  const model = useWaterWidgetModel({ mode, enableUndo: false });

  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
      }}
    >
      <WaterWidgetForeground
        model={model}
        showUndoInWidget={false}
        contentPaddingTop={16}
        contentPaddingBottom={0}
      />
    </View>
  );
}
