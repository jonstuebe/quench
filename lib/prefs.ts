import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { observablePersistMMKV } from "@legendapp/state/persist-plugins/mmkv";

import type {
  EntryIncrementFlOz,
  NotificationInterval,
  TimeParts,
  VolumeDisplayUnit,
} from "@/lib/types";

const defaultBedtime: TimeParts = { hour: 22, minute: 0 };
const defaultWake: TimeParts = { hour: 6, minute: 0 };

export type PrefsShape = {
  onboardingComplete: boolean;
  name: string;
  unit: VolumeDisplayUnit;
  entryIncrementFlOz: EntryIncrementFlOz;
  bedtime: TimeParts;
  wakeUp: TimeParts;
  /** minutes between follow-up reminders after a log; undefined = off */
  reminderMinutes: NotificationInterval | undefined;
};

const defaults: PrefsShape = {
  onboardingComplete: false,
  name: "",
  unit: "fl-oz",
  entryIncrementFlOz: 4,
  bedtime: defaultBedtime,
  wakeUp: defaultWake,
  reminderMinutes: 20,
};

export const prefs$ = observable<PrefsShape>({ ...defaults });

syncObservable(prefs$, {
  persist: {
    name: "quench-prefs",
    plugin: observablePersistMMKV({ id: "quench-mmkv" }),
  },
});

export { defaultBedtime, defaultWake };
