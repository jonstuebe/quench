import { addMinutes, isWithinInterval, setHours, setMinutes } from "date-fns";
import {
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
} from "expo-notifications";
import type { NotificationContentInput } from "expo-notifications";

import type { TimeParts } from "@/lib/types";

export async function setupNotifications() {
  const settings = await getPermissionsAsync();
  if (!settings.granted) {
    await requestPermissionsAsync({ ios: { allowAlert: true } });
  }
}

export function determineNextReminder(
  wakeUp: TimeParts,
  bedtime: TimeParts,
  intervalMinutes: number,
  from: Date = new Date(),
): Date | undefined {
  const wakeUpDate = setMinutes(setHours(from, wakeUp.hour), wakeUp.minute);
  const bedtimeDate = setMinutes(setHours(from, bedtime.hour), bedtime.minute);
  const next = addMinutes(from, intervalMinutes);
  if (isWithinInterval(next, { start: wakeUpDate, end: bedtimeDate })) {
    return next;
  }
  return undefined;
}

export function getReminderContent(date: Date): NotificationContentInput {
  return {
    title: "Quench",
    body: "Don't forget to drink water!",
    data: {
      channel: "reminder",
      date: date.toISOString(),
    },
  };
}

export async function scheduleNextReminder(args: {
  wakeUp: TimeParts;
  bedtime: TimeParts;
  intervalMinutes: number;
  afterLogAt: Date;
}) {
  const next = determineNextReminder(
    args.wakeUp,
    args.bedtime,
    args.intervalMinutes,
    args.afterLogAt,
  );
  if (!next) return;
  await setupNotifications();
  await cancelAllScheduledNotificationsAsync();
  await scheduleNotificationAsync({
    content: getReminderContent(next),
    trigger: { type: SchedulableTriggerInputTypes.DATE, date: next },
  });
}
