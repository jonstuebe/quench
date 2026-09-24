import { View } from "react-native";

import { WaterWidgetForeground, useWaterWidgetModel } from "./water-widget";

export function WaterWidgetImmersive() {
  const model = useWaterWidgetModel({ enableUndo: false });

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
