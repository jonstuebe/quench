import { GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWaterShaderUniforms } from "@/hooks/use-water-shader-uniforms";
import { useWaterUndoLastDrink } from "@/hooks/use-water-undo-last-drink";
import { prefs$ } from "@/lib/prefs";
import {
  flOzToDisplay,
  formatDisplayVolumeValue,
  formatVolumeLabel,
} from "@/lib/volume";
import { useValue } from "@legendapp/state/react";

import { LOG_WATER_VERTICAL_STACK_GAP } from "@/components/log-water-panel";
import { glassLabelOnBrightLight } from "@/constants/theme";
import { WaterWidgetBackground } from "./water-widget-background";

const ON_GRADIENT = "#ffffff";
const ON_GRADIENT_MUTED = "rgba(255,255,255,0.78)";

/** Dark halo so white labels stay legible over bright wave/foam in the Skia background. */
const HERO_TEXT_SHADOW = {
  textShadowColor: "rgba(0,0,0,0.32)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};
type Props = {
  mode: "today" | "day";
  /** Card chrome + in-widget shader, or foreground only over a full-screen backdrop (home). */
  surfaceStyle?: "card" | "immersive";
  /** When false, undo is not shown in the widget (e.g. home uses a header bar button). */
  showUndoInWidget?: boolean;
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
        styles.undoPressableInner,
        pressed && styles.undoBtnPressed,
      ]}
      accessibilityLabel="Undo last drink"
      accessibilityRole="button"
    >
      <SymbolView
        name={{ ios: "arrow.uturn.backward", android: "undo" }}
        size={20}
        tintColor={iconTintColor}
        resizeMode="scaleAspectFit"
      />
    </Pressable>
  );

  return (
    <GlassView isInteractive style={[styles.undoGlassOuter, outerStyle]}>
      {pressable}
    </GlassView>
  );
}

export function WaterWidget({
  mode,
  surfaceStyle = "card",
  showUndoInWidget = true,
}: Props) {
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
    enabled: showUndoInWidget,
  });
  const unit = useValue(prefs$.unit);

  const isCard = surfaceStyle === "card";

  const displayed = flOzToDisplay(water, unit);
  const displayedGoal = flOzToDisplay(goalFlOz, unit);
  const pct = goalFlOz > 0 ? Math.round((water / goalFlOz) * 100) : 0;
  const label = formatVolumeLabel(unit);

  const [bgLayout, setBgLayout] = useState({ width: 0, height: 0 });
  const onCardInnerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBgLayout({ width, height });
  };

  return (
    <View style={isCard ? styles.cardOuter : styles.immersiveOuter}>
      <View
        style={isCard ? styles.cardInner : styles.immersiveInner}
        onLayout={isCard ? onCardInnerLayout : undefined}
      >
        {isCard ? (
          <WaterWidgetBackground
            width={bgLayout.width}
            height={bgLayout.height}
            fillFraction={fillFraction}
            colorTurquoise={colorTurquoise}
            colorSapphire={colorSapphire}
            colorDeep={colorDeep}
            colorAir={colorAir}
          />
        ) : null}
        <View style={styles.cardForeground}>
          {showUndoInWidget ? (
            <View style={styles.topBar}>
              {water > 0 && !loading && canUndoDeletable ? (
                <UndoLastDrinkButton
                  onPress={onUndo}
                  iconTintColor={
                    colorScheme === "light"
                      ? glassLabelOnBrightLight
                      : ON_GRADIENT
                  }
                  outerStyle={
                    colorScheme === "light"
                      ? styles.undoGlassOuterLight
                      : undefined
                  }
                />
              ) : (
                <View style={styles.undoPlaceholder} />
              )}
            </View>
          ) : null}

          <View style={styles.body}>
            {loading ? (
              <View style={styles.heroCenter}>
                <ActivityIndicator color={ON_GRADIENT} size="large" />
              </View>
            ) : (
              <>
                <View style={styles.heroCenter}>
                  <Text style={styles.heroRow}>
                    <Text
                      style={[
                        styles.heroPct,
                        Platform.OS === "ios" && {
                          fontVariant: ["tabular-nums"],
                        },
                      ]}
                    >
                      {pct}
                    </Text>
                    <Text style={styles.heroPctSuffix}>%</Text>
                  </Text>
                  <Text style={styles.volumeLine}>
                    {formatDisplayVolumeValue(displayed, unit)} {label} of{" "}
                    {formatDisplayVolumeValue(displayedGoal, unit)} {label}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    flex: 1,
    marginHorizontal: 16,
    /** Separates the card (and wave) from `LogWaterPanel` below; inner `paddingBottom` does not. */
    marginBottom: LOG_WATER_VERTICAL_STACK_GAP,
    minHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardInner: {
    flex: 1,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },
  immersiveOuter: {
    flex: 1,
    minHeight: 0,
  },
  immersiveInner: {
    flex: 1,
    minHeight: 0,
  },
  /** No horizontal padding here so the progress track matches `LogWaterPanel` width; pad hero/topBar instead. */
  cardForeground: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: LOG_WATER_VERTICAL_STACK_GAP,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  undoGlassOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  undoGlassOuterLight: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(13,40,64,0.28)",
  },
  undoPressableInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  undoSolidFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  undoBtnPressed: {
    opacity: 0.85,
  },
  undoPlaceholder: {
    width: 44,
    height: 44,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  heroCenter: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  heroPct: {
    fontSize: 64,
    fontWeight: "600",
    letterSpacing: Platform.OS === "ios" ? -1.5 : 0,
    color: ON_GRADIENT,
    ...HERO_TEXT_SHADOW,
  },
  heroPctSuffix: {
    fontSize: 26,
    fontWeight: "600",
    color: ON_GRADIENT_MUTED,
    marginLeft: 1,
    ...HERO_TEXT_SHADOW,
  },
  volumeLine: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "500",
    color: ON_GRADIENT_MUTED,
    textAlign: "center",
    letterSpacing: Platform.OS === "ios" ? -0.2 : 0,
    ...HERO_TEXT_SHADOW,
  },
});
