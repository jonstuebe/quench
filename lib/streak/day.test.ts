import { describe, expect, test } from "bun:test";

import { addDaysToKey, dayKeyRange, daysBetween, toDayKey } from "./day";

describe("toDayKey", () => {
  test("uses the local calendar day, not UTC", () => {
    // 23:30 local on Sep 24 is already Sep 25 in UTC.
    expect(toDayKey(new Date(2026, 8, 24, 23, 30))).toBe("2026-09-24");
  });
  test("one millisecond before midnight and midnight fall on different days", () => {
    expect(toDayKey(new Date(2026, 8, 24, 23, 59, 59, 999))).toBe("2026-09-24");
    expect(toDayKey(new Date(2026, 8, 25, 0, 0, 0, 0))).toBe("2026-09-25");
  });
});

describe("addDaysToKey", () => {
  test("crosses month and year boundaries", () => {
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });
  test("is stable across the spring-forward DST day", () => {
    expect(addDaysToKey("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDaysToKey("2026-03-08", 1)).toBe("2026-03-09");
  });
  test("is stable across the fall-back DST day", () => {
    expect(addDaysToKey("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDaysToKey("2026-11-02", -1)).toBe("2026-11-01");
  });
});

describe("daysBetween", () => {
  test("counts calendar days even when a DST day is 23 or 25 hours", () => {
    expect(daysBetween("2026-03-07", "2026-03-10")).toBe(3);
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
    expect(daysBetween("2026-09-24", "2026-09-20")).toBe(-4);
  });
});

describe("dayKeyRange", () => {
  test("is inclusive on both ends", () => {
    expect(dayKeyRange("2026-02-27", "2026-03-02")).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });
  test("is empty when from is after to", () => {
    expect(dayKeyRange("2026-03-02", "2026-03-01")).toEqual([]);
  });
});
