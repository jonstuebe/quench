import type { DayProgress } from "@/lib/health/day-progress";
import { format, isSameDay, startOfDay } from "date-fns";

export function titleFormat(d: Date) {
  return format(d, "EEEE, MMMM d");
}

export function titleFormatMonth(d: Date) {
  return format(d, "MMMM d");
}

export function dayRowA11yLabel(
  row: DayProgress,
  title: string,
  fmt: (flOz: number) => string,
  volLabel: string,
) {
  const state =
    row.goalFlOz <= 0
      ? "Goal unavailable"
      : row.met
        ? "Goal met"
        : isSameDay(row.date, startOfDay(new Date()))
          ? `${row.pct}% of goal, in progress`
          : `Below goal, ${row.pct} percent`;
  const amounts =
    row.goalFlOz > 0
      ? `${fmt(row.waterFlOz)} of ${fmt(row.goalFlOz)} ${volLabel}`
      : `${fmt(row.waterFlOz)} ${volLabel}`;
  return `${title}. ${state}. ${amounts}.`;
}
