import { describe, expect, test } from "bun:test";

import { formatAmount, formatAmountValue, formatDisplayAmount } from "./format";

describe("formatAmount", () => {
  test("ml are whole and grouped", () => {
    expect(formatAmount(107, "ml")).toBe("3,164 ml");
  });
  test("fl oz are whole", () => {
    expect(formatAmount(106.6, "fl-oz")).toBe("107 fl oz");
    expect(formatAmount(0, "fl-oz")).toBe("0 fl oz");
  });
  test("cups round to the nearest quarter", () => {
    expect(formatAmount(107, "cup")).toBe("13.5 cups");
    expect(formatAmount(10, "cup")).toBe("1.25 cups");
  });
  test("pints round to the nearest quarter", () => {
    expect(formatAmount(107, "pt_us")).toBe("6.75 pints");
    expect(formatAmount(24, "pt_us")).toBe("1.5 pints");
  });
  test("value-only form for the big numeral", () => {
    expect(formatAmountValue(107, "ml")).toBe("3,164");
    expect(formatAmountValue(107, "cup")).toBe("13.5");
  });
  test("exactly one cup or pint is singular", () => {
    expect(formatDisplayAmount(1, "cup")).toBe("1 cup");
    expect(formatDisplayAmount(1, "pt_us")).toBe("1 pint");
    expect(formatDisplayAmount(0.5, "cup")).toBe("0.5 cups");
  });
  test("negative and NaN inputs clamp to zero", () => {
    expect(formatAmount(-0.2, "fl-oz")).toBe("0 fl oz");
    expect(formatAmount(-5, "ml")).toBe("0 ml");
    expect(formatAmount(Number.NaN, "cup")).toBe("0 cups");
    expect(formatAmountValue(Number.NaN, "fl-oz")).toBe("0");
    expect(formatDisplayAmount(-1, "pt_us")).toBe("0 pints");
  });
});
