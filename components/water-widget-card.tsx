import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { LOG_WATER_VERTICAL_STACK_GAP } from "@/components/log-water-panel";
import { type WaterWidgetMode } from "@/hooks/use-water-shader-uniforms";

import { WaterWidgetForeground, useWaterWidgetModel } from "./water-widget";
import { WaterWidgetBackground } from "./water-widget-background";

type Props = {
  mode: WaterWidgetMode;
  showUndoInWidget?: boolean;
};

export function WaterWidgetCard({ mode, showUndoInWidget = true }: Props) {
  const model = useWaterWidgetModel({ mode, enableUndo: showUndoInWidget });
  const [bgLayout, setBgLayout] = useState({ width: 0, height: 0 });

  const onCardInnerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBgLayout({ width, height });
  };

  return (
    <View
      style={{
        flex: 1,
        marginHorizontal: 16,
        marginBottom: LOG_WATER_VERTICAL_STACK_GAP,
        minHeight: 300,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 28,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(255,255,255,0.22)",
          overflow: "hidden",
        }}
        onLayout={onCardInnerLayout}
      >
        <WaterWidgetBackground
          width={bgLayout.width}
          height={bgLayout.height}
          fillFraction={model.fillFraction}
          colorTurquoise={model.colorTurquoise}
          colorSapphire={model.colorSapphire}
          colorDeep={model.colorDeep}
          colorAir={model.colorAir}
        />
        <WaterWidgetForeground
          model={model}
          showUndoInWidget={showUndoInWidget}
          contentPaddingTop={16}
          contentPaddingBottom={LOG_WATER_VERTICAL_STACK_GAP}
        />
      </View>
    </View>
  );
}
