import { expect, test } from "bun:test";
test("timezone is pinned to America/New_York", () => {
  // 2026-03-08 is 23 hours long in New York (spring forward).
  const start = new Date(2026, 2, 8).getTime();
  const end = new Date(2026, 2, 9).getTime();
  expect((end - start) / 3_600_000).toBe(23);
});
