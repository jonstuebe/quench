import { Button, GlassEffectContainer, Host, HStack, Image } from "@expo/ui/swift-ui";
import { accessibilityLabel, buttonStyle, controlSize, font } from "@expo/ui/swift-ui/modifiers";
import { useValue } from "@legendapp/state/react";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { router, Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AxolotlPet } from "@/components/axolotl/axolotl-pet";
import { GoalConfettiOverlay } from "@/components/goal-confetti-overlay";
import { WaterHomeShaderBackdrop } from "@/components/water-home-shader-backdrop";
import { Fonts, glassLabelOnBrightLight } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWaterShaderUniforms } from "@/hooks/use-water-shader-uniforms";
import { useWaterUndoLastDrink } from "@/hooks/use-water-undo-last-drink";
import { moodLine, quickLogPresets, streakChipLabel } from "@/lib/home/copy";
import { petAccessibilityLabel } from "@/lib/axolotl/visuals";
import { DEV_PREVIEW_MOODS, DEV_START_MOOD } from "@/lib/dev/pet-preview";
import { logWaterFlOz } from "@/lib/log-water";
import { prefs$ } from "@/lib/prefs";
import { currentPet$ } from "@/lib/streak/store";
import type { PetMood } from "@/lib/streak/view";
import {
  displayToFlOz,
  flOzToDisplay,
  formatDisplayVolumeValue,
  formatVolumeLabel,
} from "@/lib/volume";

export default function HomeScreen() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const ink = scheme === "light" ? glassLabelOnBrightLight : "#FFFFFF";
  const inkMuted = scheme === "light" ? "rgba(13,40,64,0.68)" : "rgba(255,255,255,0.72)";

  const { water, loading, goalFlOz } = useWaterShaderUniforms();
  const unit = useValue(prefs$.unit);
  const pet = useValue(currentPet$);

  // DEV only: long-press the pet to cycle through moods (see lib/dev/pet-preview.ts).
  const [devMood, setDevMood] = useState<PetMood | null>(__DEV__ ? DEV_START_MOOD : null);
  const preview = __DEV__ ? devMood : null;
  const cycleDevMood = () => {
    const i = devMood ? DEV_PREVIEW_MOODS.indexOf(devMood) : -1;
    setDevMood(i + 1 < DEV_PREVIEW_MOODS.length ? DEV_PREVIEW_MOODS[i + 1] : null);
  };

  const mood: PetMood = preview ?? pet.mood;
  const petName =
    pet.kind === "alive" ? pet.pet.name : preview && preview !== "egg" ? "Mochi" : null;
  const streak = preview ? (preview === "egg" ? 0 : 12) : pet.currentStreak;

  // Goal crossing → confetti; any increase → the pet drinks.
  const prevWaterRef = useRef<number | null>(null);
  const [goalConfettiRun, setGoalConfettiRun] = useState(0);
  const [drinkToken, setDrinkToken] = useState(0);
  useEffect(() => {
    if (loading || goalFlOz <= 0) return;
    const prev = prevWaterRef.current;
    prevWaterRef.current = water;
    if (prev === null) return;
    if (water > prev) setDrinkToken((n) => n + 1);
    if (prev < goalFlOz && water >= goalFlOz) setGoalConfettiRun((n) => n + 1);
  }, [water, goalFlOz, loading]);

  const { canUndo, onUndo } = useWaterUndoLastDrink({ water, loading });
  const showUndoInHeader = water > 0 && !loading && canUndo;

  const [heroH, setHeroH] = useState(0);
  const [heroW, setHeroW] = useState(0);
  const petSize = Math.max(0, Math.min(heroW, heroH, 420));

  const unitLabel = formatVolumeLabel(unit);
  const fmt = (flOz: number) => formatDisplayVolumeValue(flOzToDisplay(flOz, unit), unit);
  const fraction = goalFlOz > 0 ? Math.min(1, water / goalFlOz) : 0;
  const behindFlOz = pet.kind === "alive" ? Math.max(0, pet.pace.expectedFlOz - water) : 0;
  const line = moodLine({
    mood,
    name: petName,
    unit,
    behindFlOz: preview ? 12 : behindFlOz,
    remainingFlOz: Math.max(0, goalFlOz - water),
  });

  const flame = streak > 0;

  return (
    <>
      <Stack.Toolbar placement="left">
        {showUndoInHeader ? (
          <Stack.Toolbar.Button
            icon="arrow.uturn.backward"
            onPress={onUndo}
            accessibilityLabel="Undo last drink"
          />
        ) : null}
      </Stack.Toolbar>
      <View style={{ flex: 1 }}>
        <WaterHomeShaderBackdrop />
        <View style={{ flex: 1, paddingTop: insets.top + 52, paddingHorizontal: 16, gap: 14 }}>
          {/* Streak + name: two glass capsules that melt together. */}
          <GlassContainer
            spacing={10}
            style={{ flexDirection: "row", alignSelf: "center", gap: 8 }}
          >
            <GlassView
              glassEffectStyle="regular"
              style={chip}
              accessible
              accessibilityLabel={
                flame
                  ? `Streak: ${streak} ${streak === 1 ? "day" : "days"}`
                  : "No streak yet. Start your streak"
              }
            >
              <SymbolView
                name={flame ? "flame.fill" : "drop.fill"}
                size={17}
                tintColor={flame ? "#FF8A3D" : "#4FB8E8"}
              />
              <Text style={[chipText, { color: ink }]}>{streakChipLabel(streak)}</Text>
            </GlassView>
            {petName ? (
              <GlassView
                glassEffectStyle="regular"
                style={chip}
                accessible
                accessibilityLabel={`Pet name: ${petName}`}
              >
                <Text style={[chipText, { color: ink }]}>{petName}</Text>
              </GlassView>
            ) : null}
          </GlassContainer>

          <View
            style={{ flex: 1, minHeight: 120, alignItems: "center", justifyContent: "center" }}
            onLayout={(e) => {
              setHeroH(e.nativeEvent.layout.height);
              setHeroW(e.nativeEvent.layout.width);
            }}
          >
            {petSize > 0 ? (
              <Pressable
                onLongPress={__DEV__ ? cycleDevMood : undefined}
                onPress={() => setDrinkToken((n) => n + 1)}
                accessibilityLabel={petAccessibilityLabel(petName, mood)}
                accessibilityHint="Double-tap to say hi"
              >
                <AxolotlPet mood={mood} name={petName} size={petSize} drinkToken={drinkToken} />
              </Pressable>
            ) : null}
          </View>

          {/* Today's progress + mood line */}
          <GlassView
            glassEffectStyle="regular"
            style={{ borderRadius: 26, paddingHorizontal: 18, paddingVertical: 14, gap: 8 }}
            accessible
            accessibilityLabel={`${fmt(water)} of ${fmt(goalFlOz)} ${unitLabel} today. ${line}`}
          >
            <Text style={{ color: ink }} maxFontSizeMultiplier={1.6}>
              <Text
                style={{
                  fontFamily: Fonts.rounded,
                  fontSize: 30,
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {loading ? "–" : fmt(water)}
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.rounded,
                  fontSize: 17,
                  fontWeight: "600",
                  color: inkMuted,
                }}
              >
                {` of ${loading ? "–" : fmt(goalFlOz)} ${unitLabel}`}
              </Text>
            </Text>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  scheme === "light" ? "rgba(13,40,64,0.12)" : "rgba(255,255,255,0.16)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${fraction * 100}%`,
                  height: "100%",
                  borderRadius: 3,
                  backgroundColor:
                    fraction >= 1 ? "#FF7FA5" : scheme === "light" ? "#1E7EC8" : "#6FD3F0",
                }}
              />
            </View>
            <Text
              style={{ color: inkMuted, fontSize: 15, fontWeight: "500" }}
              maxFontSizeMultiplier={1.8}
            >
              {line}
            </Text>
          </GlassView>

          {/* Quick log: native SwiftUI glass buttons in one glass container */}
          <View style={{ paddingBottom: insets.bottom + 30, alignItems: "center" }}>
            <Host matchContents>
              <GlassEffectContainer spacing={10}>
                <HStack spacing={10}>
                  {quickLogPresets(unit).map((v) => {
                    const text = `${formatDisplayVolumeValue(v, unit)} ${unitLabel}`;
                    const short = `+${formatDisplayVolumeValue(v, unit)} ${unit === "fl-oz" ? "oz" : unitLabel}`;
                    return (
                      <Button
                        key={v}
                        label={short}
                        onPress={() => void logWaterFlOz(displayToFlOz(v, unit))}
                        modifiers={[
                          buttonStyle("glass"),
                          controlSize("large"),
                          font({ design: "rounded", weight: "semibold" }),
                          accessibilityLabel(`Log ${text}`),
                        ]}
                      />
                    );
                  })}
                  <Button
                    onPress={() => router.push("/home/log")}
                    modifiers={[
                      buttonStyle("glassProminent"),
                      controlSize("large"),
                      accessibilityLabel("Log a custom amount"),
                    ]}
                  >
                    <Image systemName="plus" />
                  </Button>
                </HStack>
              </GlassEffectContainer>
            </Host>
          </View>
        </View>
      </View>
      <GoalConfettiOverlay runId={goalConfettiRun} />
    </>
  );
}

const chip = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 6,
  paddingHorizontal: 14,
  paddingVertical: 9,
  borderRadius: 999,
};
const chipText = { fontFamily: Fonts.rounded, fontSize: 16, fontWeight: "700" as const };
