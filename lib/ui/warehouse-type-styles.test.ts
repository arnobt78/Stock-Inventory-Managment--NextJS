import { describe, expect, it } from "vitest";
import { Building, Building2, Truck } from "lucide-react";
import {
  getWarehouseTypeIcon,
  getWarehouseTypeTone,
} from "./warehouse-type-styles";

describe("warehouse-type-styles", () => {
  it("maps known warehouse types to distinct icons", () => {
    expect(getWarehouseTypeIcon("main")).toBe(Building);
    expect(getWarehouseTypeIcon("secondary")).toBe(Building2);
    expect(getWarehouseTypeIcon("distribution")).toBe(Truck);
  });

  it("falls back to Building2 for unknown or empty type", () => {
    expect(getWarehouseTypeIcon("unknown")).toBe(Building2);
    expect(getWarehouseTypeIcon(null)).toBe(Building2);
  });

  it("normalizes type keys for tone lookup", () => {
    expect(getWarehouseTypeTone("Distribution").icon).toBe(Truck);
  });

  it("uses glass glow surfaces (not opaque flat chips)", () => {
    const main = getWarehouseTypeTone("main").className;
    expect(main).toContain("bg-gradient-to-r");
    expect(main).toContain("shadow-[");
    expect(main).not.toContain("bg-blue-100");
  });
});
