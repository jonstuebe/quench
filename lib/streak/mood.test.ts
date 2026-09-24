import { describe, expect, test } from "bun:test";

import { computePace } from "./mood";

const wake = { hour: 7, minute: 0 };
const bed = { hour: 22, minute: 0 };
/** 2026-09-24 at hh:mm local */
const at = (h: number, m = 0) => new Date(2026, 8, 24, h, m);

function pace(intakeFlOz: number, now: Date, goalFlOz = 80) {
  return computePace({ intakeFlOz, goalFlOz, now, wake, bed });
}

describe("expected intake", () => {
  test("is 0 before wake, and nothing drunk still reads as happy", () => {
    expect(pace(0, at(6, 30))).toEqual({ mood: "happy", expectedFlOz: 0, paceRatio: Infinity });
  });
  test("is exactly half the goal halfway through a 7:00–22:00 window", () => {
    expect(pace(40, at(14, 30)).expectedFlOz).toBe(40);
  });
  test("is the full goal after bedtime", () => {
    expect(pace(10, at(23, 15)).expectedFlOz).toBe(80);
  });
  test("uses wall-clock time on the spring-forward DST day", () => {
    const now = new Date(2026, 2, 8, 14, 30);
    expect(computePace({ intakeFlOz: 40, goalFlOz: 80, now, wake, bed }).expectedFlOz).toBe(40);
  });
  test("bedtime past midnight is clamped to the end of the calendar day", () => {
    // window 07:00–24:00 = 17h; at 15:30 we're 8.5h in => half the goal.
    const r = computePace({
      intakeFlOz: 40,
      goalFlOz: 80,
      now: at(15, 30),
      wake,
      bed: { hour: 0, minute: 30 },
    });
    expect(r.expectedFlOz).toBe(40);
  });
});

describe("mood thresholds at 14:30 (expected 40 of 80)", () => {
  test("on pace (ratio 1) is happy", () => {
    expect(pace(40, at(14, 30)).mood).toBe("happy");
  });
  test("ratio exactly 0.75 is content", () => {
    expect(pace(30, at(14, 30))).toEqual({ mood: "content", expectedFlOz: 40, paceRatio: 0.75 });
  });
  test("just under 0.75 is thirsty", () => {
    expect(pace(29, at(14, 30)).mood).toBe("thirsty");
  });
  test("ratio exactly 0.5 is thirsty", () => {
    expect(pace(20, at(14, 30)).mood).toBe("thirsty");
  });
  test("under 0.5 is parched", () => {
    expect(pace(19, at(14, 30)).mood).toBe("parched");
  });
});

describe("goal met", () => {
  test("meeting the goal exactly is celebrating, even early", () => {
    expect(pace(80, at(10)).mood).toBe("celebrating");
  });
  test("a hair under the goal is not celebrating", () => {
    expect(pace(79.9, at(10)).mood).toBe("happy");
  });
  test("a zero goal counts as met", () => {
    expect(pace(0, at(10), 0).mood).toBe("celebrating");
  });
});

describe("last chance", () => {
  test("behind pace within the final 2 waking hours", () => {
    expect(pace(40, at(20, 0)).mood).toBe("last-chance");
  });
  test("one minute before the window opens, behind pace is still a normal mood", () => {
    expect(pace(40, at(19, 59)).mood).toBe("thirsty");
  });
  test("ahead of pace in the final window stays happy", () => {
    expect(pace(75, at(21, 0)).mood).toBe("happy");
  });
  test("after bedtime with the goal unmet", () => {
    expect(pace(79, at(23, 30)).mood).toBe("last-chance");
  });
});
