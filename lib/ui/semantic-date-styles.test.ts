import { describe, expect, it } from "vitest";
import {
  dueDateSemanticKind,
  semanticDateClass,
  statusAtSemanticKind,
} from "./semantic-date-styles";

describe("semantic-date-styles", () => {
  it("statusAtSemanticKind maps terminal states", () => {
    expect(statusAtSemanticKind("cancelled", "unpaid")).toBe("cancelled");
    expect(statusAtSemanticKind("delivered", "paid")).toBe("delivered");
    expect(statusAtSemanticKind("pending", "paid")).toBe("paid");
    expect(statusAtSemanticKind("pending", "refunded")).toBe("refunded");
  });

  it("dueDateSemanticKind distinguishes overdue", () => {
    expect(dueDateSemanticKind(true)).toBe("overdue");
    expect(dueDateSemanticKind(false)).toBe("due");
  });

  it("semanticDateClass includes hue token", () => {
    expect(semanticDateClass("paid")).toContain("emerald");
  });
});
