// Pin a DST-observing zone so local-calendar-day logic is exercised deterministically.
// America/New_York: DST starts 2026-03-08 02:00, ends 2026-11-01 02:00.
process.env.TZ = "America/New_York";
