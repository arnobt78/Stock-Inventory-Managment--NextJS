import { describe, expect, it } from "vitest";
import {
  resolveSelectPlaceholder,
  selectEmptyMessage,
  selectEmptyPlaceholder,
} from "@/lib/ui/select-empty-copy";

describe("select-empty-copy (REQ-0217)", () => {
  it("builds entity-specific empty copy", () => {
    expect(selectEmptyPlaceholder("category")).toBe("No categories found");
    expect(selectEmptyMessage("supplier")).toBe("No suppliers found.");
    expect(selectEmptyMessage("warehouse")).toBe("No warehouses found.");
  });

  it("keeps invite while loading; empty when count is 0", () => {
    expect(
      resolveSelectPlaceholder("category", {
        count: 0,
        isLoading: true,
        invite: "Select Category",
      }),
    ).toBe("Select Category");
    expect(
      resolveSelectPlaceholder("category", {
        count: 0,
        isLoading: false,
        invite: "Select Category",
      }),
    ).toBe("No categories found");
    expect(
      resolveSelectPlaceholder("category", {
        count: 2,
        invite: "Select Category",
      }),
    ).toBe("Select Category");
  });
});
