import { describe, expect, it } from "vitest";
import { capitalizeFirst } from "./capitalize";

describe("capitalizeFirst", () => {
  it("capitalizes first letter", () => {
    expect(capitalizeFirst("urgent")).toBe("Urgent");
  });

  it("returns empty for nullish", () => {
    expect(capitalizeFirst(null)).toBe("");
    expect(capitalizeFirst(undefined)).toBe("");
    expect(capitalizeFirst("")).toBe("");
  });
});
