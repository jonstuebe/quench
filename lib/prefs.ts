import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { observablePersistMMKV } from "@legendapp/state/persist-plugins/mmkv";

import type { NotificationInterval, TimeParts, VolumeDisplayUnit } from "@/lib/types";

const defaultBedtime: TimeParts = { hour: 22, minute: 0 };
const defaultWake: TimeParts = { hour: 6, minute: 0 };

export type PrefsShape = {
  onboardingComplete: boolean;
  unit: VolumeDisplayUnit;
  bedtime: TimeParts;
  wakeUp: TimeParts;
  /** Master switch for follow-up reminders after logging */
  remindersEnabled: boolean;
  /** minutes between follow-up reminders after a log; undefined = off */
  reminderMinutes: NotificationInterval | undefined;
};

const defaults: PrefsShape = {
  onboardingComplete: false,
  unit: "fl-oz",
  bedtime: defaultBedtime,
  wakeUp: defaultWake,
  remindersEnabled: true,
  reminderMinutes: undefined,
};

export const prefs$ = observable<PrefsShape>({ ...defaults });

syncObservable(prefs$, {
  persist: {
    name: "quench-prefs",
    plugin: observablePersistMMKV({ id: "quench-mmkv" }),
  },
});

export { defaultBedtime, defaultWake };
