import { useValue } from "@legendapp/state/react";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { router, Stack, useIsFocused } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AxolotlPet } from "@/components/axolotl/axolotl-pet";
import { WeekStreak } from "@/components/home/week-streak";
import { GoalConfettiOverlay } from "@/components/goal-confetti-overlay";
import { WaterHomeShaderBackdrop } from "@/components/water-home-shader-backdrop";
import { Fonts, glassLabelOnBrightLight } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWaterShaderUniforms } from "@/hooks/use-water-shader-uniforms";
import { useWaterUndoLastDrink } from "@/hooks/use-water-undo-last-drink";
import { formatAmountValue, formatDisplayAmount } from "@/lib/home/format";
import { moodLine, quickLogPresets } from "@/lib/home/copy";
import { weekStrip } from "@/lib/home/week";
import { petAccessibilityLabel } from "@/lib/axolotl/visuals";
import { DEV_PREVIEW_MOODS, DEV_START_MOOD } from "@/lib/dev/pet-preview";
import { useLogWater } from "@/lib/log-water";
import { now$ } from "@/lib/clock";
import { prefs$ } from "@/lib/prefs";
import { addDaysToKey, toDayKey } from "@/lib/streak/day";
import { currentPet$ } from "@/lib/streak/store";
import type { PetMood } from "@/lib/streak/view";
import { displayToFlOz, formatVolumeLabel } from "@/lib/volume";

/** Home is focused and the app is in the foreground (drives pausing the pet's animation). */
function useScreenActive() {
  const focused = useIsFocused();
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) =>
      setAppActive(s === "active"),
    );
    return () => sub.remove();
  }, []);
  return focused && appActive;
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const ink = scheme === "light" ? glassLabelOnBrightLight : "#FFFFFF";
  const inkMuted =
    scheme === "light" ? "rgba(13,40,64,0.68)" : "rgba(255,255,255,0.72)";

  const { water, loading, goalFlOz } = useWaterShaderUniforms();
  const active = useScreenActive();
  const unit = useValue(prefs$.unit);
  const pet = useValue(currentPet$);

  // DEV only: long-press the pet to cycle through moods (see lib/dev/pet-preview.ts).
  const [devMood, setDevMood] = useState<PetMood | null>(
    __DEV__ ? DEV_START_MOOD : null,
  );
  const preview = __DEV__ ? devMood : null;
  const cycleDevMood = () => {
    const i = devMood ? DEV_PREVIEW_MOODS.indexOf(devMood) : -1;
    setDevMood(
      i + 1 < DEV_PREVIEW_MOODS.length ? DEV_PREVIEW_MOODS[i + 1] : null,
    );
  };

  // Until today's water has loaded, the pace mood is meaningless (it would read as parched on a
  // cold launch), so a living pet holds a neutral "content" face and line.
  const holdNeutral = loading && pet.kind === "alive" && !preview;
  const mood: PetMood = preview ?? (holdNeutral ? "content" : pet.mood);
  const petName =
    pet.kind === "alive"
      ? pet.pet.name
      : preview && preview !== "egg"
        ? "Mochi"
        : null;
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
  const petSize = Math.max(0, Math.min(heroW, heroH, 420) * 0.85);

  const unitLabel = formatVolumeLabel(unit);
  const fmt = (flOz: number) => formatAmountValue(flOz, unit);
  const fraction = goalFlOz > 0 ? Math.min(1, water / goalFlOz) : 0;
  const behindFlOz =
    pet.kind === "alive" ? Math.max(0, pet.pace.expectedFlOz - water) : 0;
  const line = holdNeutral
    ? "Checking today's water…"
    : moodLine({
        mood,
        name: petName,
        unit,
        behindFlOz: preview ? 12 : behindFlOz,
        remainingFlOz: Math.max(0, goalFlOz - water),
      });
  const { log, saving } = useLogWater();

  const nowMs = useValue(now$);
  const week = useMemo(() => {
    const now = new Date(nowMs);
    const today = toDayKey(now);
    // DEV preview: a 12-day pet counted through today, or the egg; otherwise the real pet's run.
    const run = preview
      ? preview === "egg"
        ? null
        : { hatchedOn: addDaysToKey(today, -11), lastCountedDay: today }
      : pet.kind === "alive"
        ? pet.pet
        : null;
    return weekStrip({ now, pet: run, todayFraction: fraction });
  }, [nowMs, preview, pet, fraction]);

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
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 52,
            paddingHorizontal: 16,
            gap: 14,
          }}
        >
          <WeekStreak
            streak={streak}
            week={week}
            ink={ink}
            inkMuted={inkMuted}
            track={
              scheme === "light"
                ? "rgba(13,40,64,0.16)"
                : "rgba(255,255,255,0.18)"
            }
          />

          <View
            style={{
              flex: 1,
              minHeight: 120,
              alignItems: "center",
              justifyContent: "center",
            }}
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
                accessibilityRole="button"
                accessibilityHint="Double-tap to say hi"
              >
                <AxolotlPet
                  mood={mood}
                  name={petName}
                  size={petSize}
                  drinkToken={drinkToken}
                  accessible={false}
                  paused={!active}
                />
              </Pressable>
            ) : null}
          </View>

          {/* Today's progress + mood line */}
          <GlassView
            glassEffectStyle="regular"
            style={{
              borderRadius: 26,
              paddingHorizontal: 18,
              paddingVertical: 14,
              gap: 8,
            }}
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
                  scheme === "light"
                    ? "rgba(13,40,64,0.12)"
                    : "rgba(255,255,255,0.16)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${fraction * 100}%`,
                  height: "100%",
                  borderRadius: 3,
                  backgroundColor:
                    fraction >= 1
                      ? "#FF7FA5"
                      : scheme === "light"
                        ? "#1E7EC8"
                        : "#6FD3F0",
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

          {/* Quick log: interactive glass pills that share the row's width, never overflowing */}
          <GlassContainer
            spacing={10}
            style={{
              flexDirection: "row",
              gap: 10,
              paddingBottom: insets.bottom + NATIVE_TAB_BAR_CLEARANCE,
            }}
          >
            {quickLogPresets(unit).map((v) => {
              const text = formatDisplayAmount(v, unit);
              return (
                <Pressable
                  key={v}
                  style={{ flex: 1, minWidth: 0 }}
                  disabled={saving}
                  onPress={() => void log(displayToFlOz(v, unit))}
                  accessibilityRole="button"
                  accessibilityLabel={`Log ${text}`}
                  accessibilityState={{ disabled: saving }}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    isInteractive
                    style={pill}
                  >
                    <Text
                      style={[pillText, { color: ink }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                      maxFontSizeMultiplier={1.4}
                    >
                      {text}
                    </Text>
                  </GlassView>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => router.push("/home/log")}
              accessibilityRole="button"
              accessibilityLabel="Log a custom amount"
            >
              <GlassView
                glassEffectStyle="regular"
                isInteractive
                tintColor="#0A84FF"
                style={[pill, { width: PILL_H, paddingHorizontal: 0 }]}
              >
                <SymbolView
                  name="plus"
                  size={20}
                  weight="semibold"
                  tintColor="#FFFFFF"
                />
              </GlassView>
            </Pressable>
          </GlassContainer>
        </View>
      </View>
      <GoalConfettiOverlay runId={goalConfettiRun} />
    </>
  );
}

/**
 * Space to leave above the safe-area bottom so the quick-log bar clears the iOS 26 floating
 * NativeTabs bar (≈62pt tall incl. its bottom margin, minus the 34pt home-indicator inset it
 * shares). NativeTabs doesn't expose its height to screens. `NativeTabs.BottomAccessory`
 * exists, but it is tab-global (it would show on Graveyard/Settings too) and collapses into
 * the minimized bar, so the bar lives in the Home screen instead.
 */
const NATIVE_TAB_BAR_CLEARANCE = 30;

const PILL_H = 52;
const pill = {
  height: PILL_H,
  borderRadius: PILL_H / 2,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  paddingHorizontal: 10,
};
const pillText = {
  fontFamily: Fonts.rounded,
  fontSize: 17,
  fontWeight: "600" as const,
};
