/**
 * First run: "adopt your egg". Five short steps (welcome, how it works, Apple Health, your day,
 * ready) over the Home water. Sequencing and copy live in lib/onboarding/flow.ts.
 */
import { DatePicker, Host, Picker, Text as SwiftText, Toggle } from "@expo/ui/swift-ui";
import { labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { AuthorizationStatus, authorizationStatusFor } from "@kingstinct/react-native-healthkit";
import { useValue } from "@legendapp/state/react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, AppState, Linking, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AxolotlPet } from "@/components/axolotl/axolotl-pet";
import { GhostAxolotl } from "@/components/axolotl/ghost-axolotl";
import {
  GlassCard,
  GlassCTA,
  GlassIconButton,
  GlassTextButton,
  Lede,
  OnboardingBackdrop,
  ProgressDots,
  Title,
  useInk,
} from "@/components/onboarding/parts";
import { timePartsToDate } from "@/components/settings-layout";
import { Fonts } from "@/constants/theme";
import { ensureHealthKitAuthorization } from "@/lib/health/authorize";
import { HK_WATER } from "@/lib/health/ids";
import { getWeightLb, sumExerciseMinutesForDay } from "@/lib/health/queries";
import { refreshTodayMetrics } from "@/lib/health/store";
import {
  cancelScheduledReminders,
  notificationsAllowed,
  setupNotifications,
} from "@/lib/notifications";
import { rescheduleReminders } from "@/lib/reminders";
import {
  goalPreview,
  ONBOARDING_STEPS,
  progressLabel,
  skipTarget,
  stepAfter,
  stepBefore,
  type OnboardingStep,
} from "@/lib/onboarding/flow";
import { prefs$ } from "@/lib/prefs";
import type { PetMood } from "@/lib/streak/view";
import type { NotificationInterval, VolumeDisplayUnit } from "@/lib/types";
import { formatVolumeLabel } from "@/lib/volume";

const UNITS: VolumeDisplayUnit[] = ["fl-oz", "ml", "cup", "pt_us"];
const DEFAULT_REMINDER_MINUTES: NotificationInterval = 20;
const PREVIEW_MOODS: PetMood[] = ["happy", "content", "thirsty", "parched"];
/** The water rises a little with each step. */
const LEVELS: Record<OnboardingStep, number> = {
  welcome: 0.2,
  how: 0.28,
  health: 0.36,
  day: 0.44,
  ready: 0.62,
};
const EASE = Easing.out(Easing.exp);
/** Spoken with the step position when the step changes (matches each step's heading). */
const STEP_TITLES: Record<OnboardingStep, string> = {
  welcome: "Meet your egg.",
  how: "How it works",
  health: "Apple Health",
  day: "Your day",
  ready: "You're all set",
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const dir = useRef<1 | -1>(1);

  const go = (to: OnboardingStep | null, d: 1 | -1) => {
    if (!to) return;
    dir.current = d;
    void Haptics.selectionAsync();
    setStep(to);
  };
  const next = () => go(stepAfter(step), 1);
  const back = stepBefore(step);
  const skip = skipTarget(step);

  const finish = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    prefs$.onboardingComplete.set(true);
    router.replace("/home");
  };

  // VoiceOver: announce the new step once its entering animation has settled.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibility(`${progressLabel(step)}. ${STEP_TITLES[step]}`),
      420,
    );
    return () => clearTimeout(t);
  }, [step]);

  const entering = (dir.current === 1 ? FadeInRight : FadeInLeft).duration(380).easing(EASE);

  return (
    <View style={{ flex: 1 }} onAccessibilityEscape={back ? () => go(back, -1) : undefined}>
      <OnboardingBackdrop level={LEVELS[step]} />
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: insets.top + 52,
        }}
      >
        <View style={{ width: 88, alignItems: "flex-start" }}>
          {back ? (
            <GlassIconButton icon="chevron.left" label="Back" onPress={() => go(back, -1)} />
          ) : null}
        </View>
        <ProgressDots
          count={ONBOARDING_STEPS.length}
          index={ONBOARDING_STEPS.indexOf(step)}
          label={progressLabel(step)}
        />
        <View style={{ width: 88, alignItems: "flex-end" }}>
          {skip && (step === "welcome" || step === "how") ? (
            <GlassTextButton
              label="Skip"
              accessibilityHint="Skips the intro and goes to setup"
              onPress={() => go(skip, 1)}
            />
          ) : null}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Animated.View
          key={step}
          entering={entering}
          exiting={FadeOut.duration(140)}
          style={{ position: "absolute", inset: 0 }}
        >
          {step === "welcome" ? <WelcomeStep onNext={next} /> : null}
          {step === "how" ? <HowStep onNext={next} /> : null}
          {step === "health" ? <HealthStep onNext={next} onSkip={() => go(skip, 1)} /> : null}
          {step === "day" ? <DayStep onNext={next} /> : null}
          {step === "ready" ? <ReadyStep onStart={finish} /> : null}
        </Animated.View>
      </View>
    </View>
  );
}

/** Scrollable body (Dynamic Type can push content past the fold) with a pinned footer. */
function StepLayout({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 16) + 4,
          gap: 10,
        }}
      >
        {footer}
      </View>
    </View>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const [poke, setPoke] = useState(0);
  return (
    <StepLayout footer={<GlassCTA label="Continue" onPress={onNext} />}>
      <View style={{ alignItems: "center" }}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="Your axolotl egg"
          onTouchEnd={() => setPoke((n) => n + 1)}
        >
          <AxolotlPet mood="egg" name={null} size={260} drinkToken={poke} accessible={false} />
        </View>
      </View>
      <Title>Meet your egg.</Title>
      <Lede>
        Hit your water goal today and it hatches. Keep your streak going to keep your axolotl alive.
      </Lede>
    </StepLayout>
  );
}

function FeatureCard({
  icon,
  iconColor,
  title,
  body,
  art,
  leading,
}: {
  icon: SFSymbol;
  iconColor: string;
  title: string;
  body: string;
  art?: ReactNode;
  /** Replaces the symbol (e.g. a small render). */
  leading?: ReactNode;
}) {
  const { ink, muted } = useInk();
  return (
    <GlassCard>
      <View
        accessible
        accessibilityLabel={`${title}. ${body}`}
        style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}
      >
        {leading ?? (
          <View style={{ width: 44, alignItems: "center" }}>
            <SymbolView name={icon} size={26} tintColor={iconColor} style={{ marginTop: 2 }} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{ color: ink, fontFamily: Fonts.rounded, fontSize: 19, fontWeight: "700" }}
            maxFontSizeMultiplier={1.6}
          >
            {title}
          </Text>
          <Text
            style={{ color: muted, fontSize: 15, lineHeight: 20, fontWeight: "500" }}
            maxFontSizeMultiplier={1.8}
          >
            {body}
          </Text>
        </View>
      </View>
      {art}
    </GlassCard>
  );
}

function HowStep({ onNext }: { onNext: () => void }) {
  return (
    <StepLayout footer={<GlassCTA label="Continue" onPress={onNext} />}>
      <Title>How it works</Title>
      <FeatureCard
        icon="flame.fill"
        iconColor="#FF8A3D"
        title="Your streak"
        body="Every day you hit your goal adds a day. That's the whole game."
      />
      <FeatureCard
        icon="face.smiling.inverse"
        iconColor="#FF7FA5"
        title="It feels your pace"
        body="Your axolotl perks up when you're on track and gets thirsty when you fall behind."
        art={
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 2 }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {PREVIEW_MOODS.map((m) => (
              <AxolotlPet
                key={m}
                mood={m}
                name={null}
                size={64}
                drinkToken={0}
                paused
                accessible={false}
              />
            ))}
          </View>
        }
      />
      <FeatureCard
        icon="moon.stars.fill"
        iconColor="#BFD8FF"
        title="One streak, one life"
        body="Miss a day and your axolotl dies. It rests in the Graveyard and a new egg appears. Water logged for yesterday still counts until 4 am."
        leading={
          <View style={{ width: 44, height: 44, marginTop: -6 }}>
            <GhostAxolotl streakLength={12} size={44} />
          </View>
        }
      />
    </StepLayout>
  );
}

/** HealthKit only reveals share (write) status; read denials look identical to "no data". */
function readWaterAccess(): "granted" | "denied" | "unknown" {
  try {
    const s = authorizationStatusFor(HK_WATER);
    if (s === AuthorizationStatus.sharingAuthorized) return "granted";
    if (s === AuthorizationStatus.sharingDenied) return "denied";
  } catch {
    // HealthKit unavailable.
  }
  return "unknown";
}

function HealthStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const { ink, muted } = useInk();
  const [access, setAccess] = useState(readWaterAccess);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") setAccess(readWaterAccess());
    });
    return () => sub.remove();
  }, []);

  const connect = async () => {
    setBusy(true);
    try {
      await ensureHealthKitAuthorization();
    } catch {
      // Treated as not connected below.
    }
    const a = readWaterAccess();
    setAccess(a);
    setBusy(false);
    void refreshTodayMetrics();
    if (a === "granted") onNext();
  };

  const rows: { icon: SFSymbol; color: string; text: string }[] = [
    { icon: "scalemass.fill", color: "#8E8CF0", text: "Reads your weight to size your goal" },
    { icon: "figure.run", color: "#34C759", text: "Reads exercise minutes to add a little more" },
    { icon: "drop.fill", color: "#4FB8E8", text: "Saves the water you log" },
  ];

  return (
    <StepLayout
      footer={
        access === "granted" ? (
          <GlassCTA label="Continue" icon="checkmark" onPress={onNext} />
        ) : (
          <>
            <GlassCTA
              label={access === "denied" ? "Continue without Health" : "Connect Apple Health"}
              icon={access === "denied" ? undefined : "heart.fill"}
              disabled={busy}
              onPress={access === "denied" ? onNext : () => void connect()}
            />
            {access === "denied" ? null : (
              <View style={{ alignItems: "center" }}>
                <GlassTextButton label="Not now" onPress={onSkip} />
              </View>
            )}
          </>
        )
      }
    >
      <View style={{ alignItems: "center" }}>
        <SymbolView
          name="heart.text.square.fill"
          size={64}
          tintColor="#FF3B5C"
          accessibilityElementsHidden
        />
      </View>
      <Title>Apple Health</Title>
      <Lede>Quench keeps your water in Health, and uses it to set a goal that fits you.</Lede>
      <GlassCard>
        {rows.map((r) => (
          <View
            key={r.icon}
            accessible
            accessibilityLabel={r.text}
            style={{ flexDirection: "row", gap: 12, alignItems: "center", minHeight: 32 }}
          >
            <View style={{ width: 28, alignItems: "center" }}>
              <SymbolView name={r.icon} size={20} tintColor={r.color} />
            </View>
            <Text
              style={{ color: ink, fontSize: 16, fontWeight: "500", flex: 1 }}
              maxFontSizeMultiplier={1.8}
            >
              {r.text}
            </Text>
          </View>
        ))}
      </GlassCard>
      {access === "granted" ? (
        <Text
          style={{ color: ink, textAlign: "center", fontSize: 15, fontWeight: "600" }}
          accessibilityLiveRegion="polite"
        >
          Connected. Your water will be saved to Health.
        </Text>
      ) : access === "denied" ? (
        <View style={{ gap: 10, alignItems: "center" }}>
          <Text
            style={{
              color: muted,
              textAlign: "center",
              fontSize: 15,
              lineHeight: 20,
              fontWeight: "500",
            }}
            maxFontSizeMultiplier={1.8}
          >
            Your logs won&apos;t be saved to Apple Health. To turn it on, open Settings, then
            Health, and allow Quench to write Water.
          </Text>
          <GlassTextButton label="Open Settings" onPress={() => void Linking.openSettings()} />
        </View>
      ) : null}
    </StepLayout>
  );
}

function DayStep({ onNext }: { onNext: () => void }) {
  const { ink, muted, scheme } = useInk();
  const unit = useValue(prefs$.unit);
  const wake = useValue(prefs$.wakeUp);
  const bed = useValue(prefs$.bedtime);
  const remindersEnabled = useValue(prefs$.remindersEnabled);
  const reminderMinutes = useValue(prefs$.reminderMinutes);
  const remindersOn = remindersEnabled !== false && reminderMinutes != null;
  const [notifsAllowed, setNotifsAllowed] = useState(true);

  useEffect(() => {
    const check = () => void notificationsAllowed().then(setNotifsAllowed, () => undefined);
    if (remindersOn) check();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active" && remindersOn) check();
    });
    return () => sub.remove();
  }, [remindersOn]);

  const wakeDate = useMemo(() => timePartsToDate(wake.hour, wake.minute), [wake.hour, wake.minute]);
  const bedDate = useMemo(() => timePartsToDate(bed.hour, bed.minute), [bed.hour, bed.minute]);

  const label = { color: ink, fontSize: 17, fontWeight: "500" as const, flex: 1 };
  const row = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    minHeight: 44,
    gap: 12,
  };
  const divider = {
    height: 1,
    backgroundColor: scheme === "light" ? "rgba(13,40,64,0.12)" : "rgba(255,255,255,0.14)",
  };

  return (
    <StepLayout footer={<GlassCTA label="Continue" onPress={onNext} />}>
      <Title>Your day</Title>
      <Lede>Your axolotl expects water through your waking hours, not all at once.</Lede>
      <GlassCard>
        <Host
          matchContents={{ vertical: true }}
          colorScheme={scheme}
          style={{ alignSelf: "stretch" }}
        >
          <Picker
            label="Units"
            selection={unit}
            onSelectionChange={(u) => prefs$.unit.set(u as VolumeDisplayUnit)}
            modifiers={[pickerStyle("segmented"), labelsHidden()]}
          >
            {UNITS.map((u) => (
              <SwiftText key={u} modifiers={[tag(u)]}>
                {formatVolumeLabel(u)}
              </SwiftText>
            ))}
          </Picker>
        </Host>
        <View style={divider} />
        <View style={row}>
          <Text style={label} maxFontSizeMultiplier={1.6}>
            Wake up
          </Text>
          <Host matchContents colorScheme={scheme}>
            <DatePicker
              title="Wake up"
              selection={wakeDate}
              displayedComponents={["hourAndMinute"]}
              modifiers={[labelsHidden()]}
              onDateChange={(d) =>
                prefs$.wakeUp.set({ hour: d.getHours(), minute: d.getMinutes() })
              }
            />
          </Host>
        </View>
        <View style={row}>
          <Text style={label} maxFontSizeMultiplier={1.6}>
            Bedtime
          </Text>
          <Host matchContents colorScheme={scheme}>
            <DatePicker
              title="Bedtime"
              selection={bedDate}
              displayedComponents={["hourAndMinute"]}
              modifiers={[labelsHidden()]}
              onDateChange={(d) =>
                prefs$.bedtime.set({ hour: d.getHours(), minute: d.getMinutes() })
              }
            />
          </Host>
        </View>
        <View style={divider} />
        <View style={row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={label} maxFontSizeMultiplier={1.6}>
              Reminders
            </Text>
            <Text
              style={{ color: muted, fontSize: 13, fontWeight: "500" }}
              maxFontSizeMultiplier={1.8}
            >
              A nudge {DEFAULT_REMINDER_MINUTES} min after you log, while you&apos;re awake
            </Text>
          </View>
          <Host matchContents colorScheme={scheme}>
            <Toggle
              label="Reminders"
              isOn={remindersOn}
              modifiers={[labelsHidden()]}
              onIsOnChange={(on) => {
                if (on) {
                  if (prefs$.reminderMinutes.get() == null) {
                    prefs$.reminderMinutes.set(DEFAULT_REMINDER_MINUTES);
                  }
                  prefs$.remindersEnabled.set(true);
                  void setupNotifications().then(
                    (ok) => {
                      setNotifsAllowed(ok);
                      if (ok) void rescheduleReminders();
                    },
                    () => setNotifsAllowed(false),
                  );
                } else {
                  prefs$.remindersEnabled.set(false);
                  void cancelScheduledReminders();
                }
              }}
            />
          </Host>
        </View>
      </GlassCard>
      {remindersOn && !notifsAllowed ? (
        <View style={{ gap: 10, alignItems: "center" }} accessibilityLiveRegion="polite">
          <Text
            style={{
              color: muted,
              textAlign: "center",
              fontSize: 15,
              lineHeight: 20,
              fontWeight: "500",
            }}
            maxFontSizeMultiplier={1.8}
          >
            Notifications are off for Quench, so reminders can&apos;t arrive. You can still
            continue.
          </Text>
          <GlassTextButton label="Open Settings" onPress={() => void Linking.openSettings()} />
        </View>
      ) : null}
    </StepLayout>
  );
}

function ReadyStep({ onStart }: { onStart: () => void }) {
  const { ink, muted } = useInk();
  const unit = useValue(prefs$.unit);
  const [health, setHealth] = useState<{ weightLb: number | null; exerciseMin: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [w, e] = await Promise.all([
        getWeightLb().catch(() => null),
        sumExerciseMinutesForDay(new Date()).catch(() => 0),
      ]);
      if (!cancelled) setHealth({ weightLb: w, exerciseMin: e });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const preview = health ? goalPreview({ ...health, unit }) : null;

  return (
    <StepLayout footer={<GlassCTA label="Start" icon="drop.fill" onPress={onStart} />}>
      <View style={{ alignItems: "center" }}>
        <AxolotlPet mood="egg" name={null} size={150} drinkToken={0} />
      </View>
      <Title>You&apos;re all set</Title>
      <GlassCard style={{ alignItems: "center", paddingVertical: 22 }}>
        <View
          accessible
          accessibilityLabel={
            preview
              ? `Your daily goal: ${preview.amount}. ${preview.basis}`
              : "Working out your goal"
          }
          style={{ alignItems: "center", gap: 6 }}
        >
          <Text
            style={{ color: muted, fontSize: 15, fontWeight: "600" }}
            maxFontSizeMultiplier={1.6}
          >
            Your daily goal
          </Text>
          <Animated.Text
            key={preview?.amount ?? "loading"}
            entering={FadeIn.duration(300)}
            style={{
              color: ink,
              fontFamily: Fonts.rounded,
              fontSize: 44,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
            }}
            maxFontSizeMultiplier={1.4}
          >
            {preview?.amount ?? "–"}
          </Animated.Text>
          <Text
            style={{
              color: muted,
              fontSize: 14,
              lineHeight: 19,
              fontWeight: "500",
              textAlign: "center",
            }}
            maxFontSizeMultiplier={1.8}
          >
            {preview?.basis ?? " "}
          </Text>
        </View>
      </GlassCard>
      <Lede>Drink up to your goal today and your egg hatches.</Lede>
    </StepLayout>
  );
}
