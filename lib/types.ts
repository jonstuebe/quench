export type VolumeDisplayUnit = "fl-oz" | "ml" | "cup" | "pt_us";

export type TimeParts = { hour: number; minute: number };

export const NOTIFICATION_INTERVALS = [10, 15, 20, 30] as const;
export type NotificationInterval = (typeof NOTIFICATION_INTERVALS)[number];
