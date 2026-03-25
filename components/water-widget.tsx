import { GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useWaterShaderUniforms,
  type WaterWidgetMode,
} from "@/hooks/use-water-shader-uniforms";
import { useWaterUndoLastDrink } from "@/hooks/use-water-undo-last-drink";
import { prefs$ } from "@/lib/prefs";
import {
  flOzToDisplay,
  formatDisplayVolumeValue,
  formatVolumeLabel,
} from "@/lib/volume";
import { useValue } from "@legendapp/state/react";

import { glassLabelOnBrightLight } from "@/constants/theme";

const ON_GRADIENT = "#ffffff";
const ON_GRADIENT_MUTED = "rgba(255,255,255,0.78)";

type UseWaterWidgetModelProps = {
  mode: WaterWidgetMode;
  enableUndo?: boolean;
};

function UndoLastDrinkButton({
  onPress,
  iconTintColor,
  outerStyle,
}: {
  onPress: () => void;
  iconTintColor: string;
  outerStyle?: StyleProp<ViewStyle>;
}) {
  const pressable = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
        pressed && { opacity: 0.85 },
      ]}
      accessibilityLabel="Undo last drink"
      accessibilityRole="button"
    >
      <SymbolView
        name="arrow.uturn.backward"
        size={20}
        tintColor={iconTintColor}
        resizeMode="scaleAspectFit"
      />
    </Pressable>
  );

  return (
    <GlassView
      isInteractive
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          overflow: "hidden",
        },
        outerStyle,
      ]}
    >
      {pressable}
    </GlassView>
  );
}

export type WaterWidgetModel = ReturnType<typeof useWaterWidgetModel>;

export function useWaterWidgetModel({
  mode,
  enableUndo = true,
}: UseWaterWidgetModelProps) {
  const colorScheme = useColorScheme();
  const {
    water,
    goalFlOz,
    fillFraction,
    colorTurquoise,
    colorSapphire,
    colorDeep,
    colorAir,
    loading,
  } = useWaterShaderUniforms(mode);
  const { canUndo: canUndoDeletable, onUndo } = useWaterUndoLastDrink({
    mode,
    water,
    loading,
    enabled: enableUndo,
  });
  const unit = useValue(prefs$.unit);
  const displayed = flOzToDisplay(water, unit);
  const displayedGoal = flOzToDisplay(goalFlOz, unit);
  const pct = goalFlOz > 0 ? Math.round((water / goalFlOz) * 100) : 0;
  const label = formatVolumeLabel(unit);

  return {
    colorScheme,
    water,
    goalFlOz,
    fillFraction,
    colorTurquoise,
    colorSapphire,
    colorDeep,
    colorAir,
    loading,
    canUndoDeletable,
    onUndo,
    unit,
    displayed,
    displayedGoal,
    pct,
    label,
  };
}

type WaterWidgetForegroundProps = {
  model: WaterWidgetModel;
  showUndoInWidget?: boolean;
  contentPaddingTop?: number;
  contentPaddingBottom?: number;
};

export function WaterWidgetForeground({
  model,
  showUndoInWidget = true,
  contentPaddingTop = 16,
  contentPaddingBottom = 0,
}: WaterWidgetForegroundProps) {
  const {
    colorScheme,
    water,
    loading,
    canUndoDeletable,
    onUndo,
    pct,
    displayed,
    displayedGoal,
    unit,
    label,
  } = model;
  return (
    <View
      style={{
        flex: 1,
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 0,
        paddingTop: contentPaddingTop,
        paddingBottom: contentPaddingBottom,
      }}
    >
      {showUndoInWidget ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            minHeight: 44,
            paddingTop: 16,
            paddingHorizontal: 16,
          }}
        >
          {water > 0 && !loading && canUndoDeletable ? (
            <UndoLastDrinkButton
              onPress={onUndo}
              iconTintColor={
                colorScheme === "light" ? glassLabelOnBrightLight : ON_GRADIENT
              }
              outerStyle={
                colorScheme === "light"
                  ? {
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: "rgba(13,40,64,0.28)",
                    }
                  : undefined
              }
            />
          ) : (
            <View style={{ width: 44, height: 44 }} />
          )}
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={ON_GRADIENT} size="large" />
      ) : (
        <View
          style={{
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 4,
          }}
        >
          <Text style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text
              style={[
                {
                  fontSize: 64,
                  fontWeight: "600",
                  letterSpacing: -1.5,
                  color: ON_GRADIENT,
                  textShadowColor: "rgba(0,0,0,0.32)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 6,
                  fontVariant: ["tabular-nums"],
                },
              ]}
            >
              {pct}
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "600",
                color: ON_GRADIENT_MUTED,
                marginLeft: 1,
                textShadowColor: "rgba(0,0,0,0.32)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }}
            >
              %
            </Text>
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 17,
              fontWeight: "500",
              color: ON_GRADIENT_MUTED,
              textAlign: "center",
              letterSpacing: -0.2,
              textShadowColor: "rgba(0,0,0,0.32)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 6,
            }}
          >
            {formatDisplayVolumeValue(displayed, unit)} {label} of{" "}
            {formatDisplayVolumeValue(displayedGoal, unit)} {label}
          </Text>
        </View>
      )}
    </View>
  );
}
