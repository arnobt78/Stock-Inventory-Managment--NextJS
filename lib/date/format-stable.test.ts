import { describe, it, expect } from "vitest";
import {
  formatStableCompactDateTime,
  formatStableCurrency,
  formatStableNumber,
} from "./format-stable";

describe("formatStableCurrency", () => {
  it("uses en-US grouping and two decimals", () => {
    expect(formatStableCurrency(1234.5)).toBe("$1,234.50");
    expect(formatStableCurrency(0)).toBe("$0.00");
  });

  it("returns identical output on repeated calls", () => {
    const a = formatStableCurrency(99999.99);
    const b = formatStableCurrency(99999.99);
    expect(a).toBe(b);
    expect(a).toBe("$99,999.99");
  });
});

describe("formatStableNumber", () => {
  it("uses en-US grouping", () => {
    expect(formatStableNumber(1234567)).toBe("1,234,567");
  });
});

describe("formatStableCompactDateTime", () => {
  it("formats in UTC regardless of runtime TZ", () => {
    const iso = "2026-07-08T10:46:00.000Z";
    const result = formatStableCompactDateTime(iso);
    expect(result).toMatch(/Jul/);
    expect(result).toMatch(/8/);
    expect(result).toMatch(/10:46/);
  });

  it("returns identical output on repeated calls", () => {
    const iso = "2026-07-08T10:46:00.000Z";
    expect(formatStableCompactDateTime(iso)).toBe(
      formatStableCompactDateTime(iso),
    );
  });
});
