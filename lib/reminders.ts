import { scheduleNextReminder, setupNotifications } from "@/lib/notifications";
import { prefs$ } from "@/lib/prefs";

/** Re-arm the next follow-up reminder from current prefs (no-op when reminders are off). */
export async function rescheduleReminders() {
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
