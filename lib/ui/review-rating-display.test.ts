import { describe, expect, it } from "vitest";
import {
  getRatingDisplay,
  truncateReviewComment,
} from "@/lib/ui/review-rating-display";

describe("getRatingDisplay", () => {
  it("returns emerald hues for rating 4", () => {
    const d = getRatingDisplay(4);
    expect(d.label).toBe("very good");
    expect(d.starClass).toContain("emerald");
    expect(d.textClass).toContain("emerald");
    expect(d.dialogTextClass).toBe("text-emerald-300");
  });

  it("returns amber hues for rating 5", () => {
    expect(getRatingDisplay(5).label).toBe("best");
    expect(getRatingDisplay(5).starClass).toContain("amber");
    expect(getRatingDisplay(5).dialogTextClass).toBe("text-amber-300");
  });

  it("returns sky dialog text for rating 3 (always-dark shell)", () => {
    expect(getRatingDisplay(3).dialogTextClass).toBe("text-sky-300");
  });

  it("returns muted default for out-of-range", () => {
    expect(getRatingDisplay(0).label).toBe("—");
    expect(getRatingDisplay(0).dialogTextClass).toContain("white");
  });
});

describe("truncateReviewComment", () => {
  it("returns empty for null/undefined", () => {
    expect(truncateReviewComment(null)).toBe("");
    expect(truncateReviewComment(undefined)).toBe("");
  });

  it("truncates long comments", () => {
    const long = "a".repeat(100);
    const out = truncateReviewComment(long, 80);
    expect(out.length).toBe(80);
    expect(out.endsWith("…")).toBe(true);
  });
});
