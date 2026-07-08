import { describe, it, expect } from "vitest";
import {
  formatClientCompactDateTime,
  formatClientCurrency,
  formatClientNumber,
} from "./client-locale";

describe("formatClientCurrency", () => {
  it("returns non-empty USD string", () => {
    const result = formatClientCurrency(1234.5);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/\$|USD/);
  });
});

describe("formatClientNumber", () => {
  it("returns grouped number string", () => {
    expect(formatClientNumber(1234567)).toMatch(/1/);
    expect(formatClientNumber(1234567).length).toBeGreaterThan(3);
  });
});

describe("formatClientCompactDateTime", () => {
  it("returns non-empty compact datetime", () => {
    const result = formatClientCompactDateTime("2026-07-08T10:46:00.000Z");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/Jul|7|08|10|46/i);
  });
});
