import {
  Button,
  DatePicker,
  Form,
  Host,
  LabeledContent,
  Picker,
  Section,
  Text,
  Toggle,
} from "@expo/ui/swift-ui";
import { foregroundStyle, labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { AuthorizationStatus, authorizationStatusFor } from "@kingstinct/react-native-healthkit";
import { useValue } from "@legendapp/state/react";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, AppState, Linking } from "react-native";

import { timePartsToDate } from "@/components/settings-layout";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { daysLabel } from "@/lib/graveyard/graveyard";
import { goalBreakdown } from "@/lib/health/goal";
import { HK_WATER } from "@/lib/health/ids";
import { todayExerciseMin$, weightLb$ } from "@/lib/health/store";
import { formatAmount } from "@/lib/home/format";
import {
  cancelScheduledReminders,
  notificationsAllowed,
  scheduleNextReminder,
  setupNotifications,
} from "@/lib/notifications";
import { prefs$ } from "@/lib/prefs";
import {
  formatExerciseMinutes,
  formatWeightLb,
  healthAccessLabel,
  petNameError,
} from "@/lib/settings/labels";
import { validatePetName } from "@/lib/streak/rename";
import { longestStreak$, renameCurrentPet, streakState$ } from "@/lib/streak/store";
import {
  NOTIFICATION_INTERVALS,
  type NotificationInterval,
  type VolumeDisplayUnit,
} from "@/lib/types";
import { formatVolumeLabel } from "@/lib/volume";

const UNITS: VolumeDisplayUnit[] = ["fl-oz", "ml", "cup", "pt_us"];
const DEFAULT_REMINDER_MINUTES: NotificationInterval = 20;
const secondary = foregroundStyle({ type: "hierarchical", style: "secondary" });

async function rescheduleReminders() {
  const m = prefs$.reminderMinutes.get();
  if (m == null || prefs$.remindersEnabled.get() === false) return;
  await setupNotifications();
  await scheduleNextReminder({
    wakeUp: prefs$.wakeUp.get(),
    bedtime: prefs$.bedtime.get(),
    intervalMinutes: m,
    afterLogAt: new Date(),
  });
}

function readWaterAccess(): 0 | 1 | 2 {
  try {
    const s = authorizationStatusFor(HK_WATER);
    if (s === AuthorizationStatus.sharingAuthorized) return 2;
    if (s === AuthorizationStatus.sharingDenied) return 1;
  } catch {
    // HealthKit unavailable: treat as not set up.
  }
  return 0;
}

/** Re-read HealthKit access on focus and whenever the app returns from Settings. */
function useWaterAccess(): 0 | 1 | 2 {
  const [status, setStatus] = useState(readWaterAccess);
  useFocusEffect(
    useCallback(() => {
      setStatus(readWaterAccess());
      const sub = AppState.addEventListener("change", (s) => {
        if (s === "active") setStatus(readWaterAccess());
      });
      return () => sub.remove();
    }, []),
  );
  return status;
}

/** Notification permission, re-checked on focus and on return to the app. */
function useNotificationsAllowed(): [boolean, (v: boolean) => void] {
  const [allowed, setAllowed] = useState(true);
  useFocusEffect(
    useCallback(() => {
      const check = () => void notificationsAllowed().then(setAllowed, () => undefined);
      check();
      const sub = AppState.addEventListener("change", (s) => {
        if (s === "active") check();
      });
      return () => sub.remove();
    }, []),
  );
  return [allowed, setAllowed];
}

function promptRename(current: string) {
  Alert.prompt(
    "Rename your axolotl",
    undefined,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save",
        isPreferred: true,
        onPress: (value?: string) => {
          const result = validatePetName(value ?? "");
          if (result.ok) renameCurrentPet(result.name);
          else
            Alert.alert(petNameError(result.error), undefined, [
              {
                text: "OK",
                onPress: () =>
                  promptRename(result.error === "empty" ? current : (value ?? current)),
              },
            ]);
        },
      },
    ],
    "plain-text",
    current,
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();

  const pet = useValue(streakState$.pet);
  const longest = useValue(longestStreak$);
  const unit = useValue(prefs$.unit);
  const wake = useValue(prefs$.wakeUp);
  const bed = useValue(prefs$.bedtime);
  const remindersEnabled = useValue(prefs$.remindersEnabled);
  const reminderMinutes = useValue(prefs$.reminderMinutes);
  const weightLb = useValue(weightLb$);
  const exerciseMin = useValue(todayExerciseMin$);
  const waterAccess = useWaterAccess();
  const [notifsAllowed, setNotifsAllowed] = useNotificationsAllowed();

  const goal = goalBreakdown(weightLb, exerciseMin);
  const wakeDate = useMemo(() => timePartsToDate(wake.hour, wake.minute), [wake.hour, wake.minute]);
  const bedDate = useMemo(() => timePartsToDate(bed.hour, bed.minute), [bed.hour, bed.minute]);
  const remindersOn = remindersEnabled !== false && reminderMinutes != null;

  const version = Constants.expoConfig?.version ?? "—";
  const build = Constants.expoConfig?.ios?.buildNumber;

  return (
    <Host style={{ flex: 1 }} colorScheme={colorScheme} useViewportSizeMeasurement>
      <Form>
        <Section
          title="Your axolotl"
          footer={pet ? undefined : <Text>Your egg hatches when you meet today&apos;s goal.</Text>}
        >
          {pet ? (
            <>
              <LabeledContent label="Name">
                <Text>{pet.name}</Text>
              </LabeledContent>
              <LabeledContent label="Current streak">
                <Text>{daysLabel(pet.streakLength)}</Text>
              </LabeledContent>
            </>
          ) : (
            <LabeledContent label="Current streak">
              <Text>Egg</Text>
            </LabeledContent>
          )}
          <LabeledContent label="Longest streak">
            <Text>{daysLabel(longest)}</Text>
          </LabeledContent>
          {pet ? (
            <Button label="Rename…" systemImage="pencil" onPress={() => promptRename(pet.name)} />
          ) : null}
        </Section>

        <Section
          title="Daily goal"
          footer={
            <Text>
              Your weight sets the base and each minute of exercise adds a little more. Both come
              from Apple Health.
            </Text>
          }
        >
          <LabeledContent label="Today's goal">
            <Text>{formatAmount(goal.totalFlOz, unit)}</Text>
          </LabeledContent>
          <LabeledContent label={`Weight · ${formatWeightLb(weightLb)}`}>
            <Text modifiers={[secondary]}>{formatAmount(goal.fromWeightFlOz, unit)}</Text>
          </LabeledContent>
          <LabeledContent label={`Exercise · ${formatExerciseMinutes(exerciseMin)}`}>
            <Text modifiers={[secondary]}>
              {goal.fromExerciseFlOz > 0
                ? `+${formatAmount(goal.fromExerciseFlOz, unit)}`
                : "None yet"}
            </Text>
          </LabeledContent>
          <Picker
            label="Units"
            selection={unit}
            onSelectionChange={(u) => prefs$.unit.set(u as VolumeDisplayUnit)}
            modifiers={[pickerStyle("segmented"), labelsHidden()]}
          >
            {UNITS.map((u) => (
              <Text key={u} modifiers={[tag(u)]}>
                {formatVolumeLabel(u)}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section
          title="Your day"
          footer={<Text>Sets the pace your axolotl expects, and when reminders can arrive.</Text>}
        >
          <DatePicker
            title="Wake up"
            selection={wakeDate}
            displayedComponents={["hourAndMinute"]}
            onDateChange={(d) => {
              prefs$.wakeUp.set({ hour: d.getHours(), minute: d.getMinutes() });
              void rescheduleReminders();
            }}
          />
          <DatePicker
            title="Bedtime"
            selection={bedDate}
            displayedComponents={["hourAndMinute"]}
            onDateChange={(d) => {
              prefs$.bedtime.set({ hour: d.getHours(), minute: d.getMinutes() });
              void rescheduleReminders();
            }}
          />
        </Section>

        <Section
          title="Reminders"
          footer={
            <Text>
              {remindersOn && !notifsAllowed
                ? "Notifications are off for Quench, so reminders can't arrive. Turn them on in Settings."
                : "A nudge this many minutes after you log water, only between wake up and bedtime."}
            </Text>
          }
        >
          <Toggle
            label="Remind me to drink"
            isOn={remindersOn}
            onIsOnChange={(on) => {
              if (on) {
                if (prefs$.reminderMinutes.get() == null) {
                  prefs$.reminderMinutes.set(DEFAULT_REMINDER_MINUTES);
                }
                prefs$.remindersEnabled.set(true);
                void setupNotifications().then((ok) => {
                  setNotifsAllowed(ok);
                  if (ok) void rescheduleReminders();
                });
              } else {
                prefs$.remindersEnabled.set(false);
                void cancelScheduledReminders();
              }
            }}
          />
          {remindersOn ? (
            <Picker
              label="After logging"
              selection={reminderMinutes}
              onSelectionChange={(m) => {
                prefs$.reminderMinutes.set(m as NotificationInterval);
                void rescheduleReminders();
              }}
              modifiers={[pickerStyle("segmented"), labelsHidden()]}
            >
              {NOTIFICATION_INTERVALS.map((m) => (
                <Text key={m} modifiers={[tag(m)]}>
                  {`${m} min`}
                </Text>
              ))}
            </Picker>
          ) : null}
          {remindersOn && !notifsAllowed ? (
            <Button
              label="Turn On Notifications"
              systemImage="bell.badge"
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
        </Section>

        <Section
          title="Apple Health"
          footer={
            <Text>
              Your water history and trends live in Apple Health. Change access in Settings under
              Health → Data Access.
            </Text>
          }
        >
          <LabeledContent label="Water">
            <Text>{healthAccessLabel(waterAccess)}</Text>
          </LabeledContent>
          <Button
            label="Open Health"
            systemImage="heart.text.square"
            onPress={() => void Linking.openURL("x-apple-health://").catch(() => undefined)}
          />
          <Button
            label="Open Settings"
            systemImage="gear"
            onPress={() => void Linking.openSettings()}
          />
        </Section>

        <Section title="About">
          <LabeledContent label="Version">
            <Text>{build ? `${version} (${build})` : version}</Text>
          </LabeledContent>
        </Section>
      </Form>
    </Host>
  );
}
