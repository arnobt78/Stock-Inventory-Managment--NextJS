import { describe, expect, it } from "vitest";
import { Building, Building2, Truck } from "lucide-react";
import {
  WAREHOUSE_TYPE_OPTIONS,
  getWarehouseTypeIcon,
  getWarehouseTypeLabel,
  getWarehouseTypeTone,
} from "./warehouse-type-styles";

describe("warehouse-type-styles", () => {
  it("resolves long display labels for known types", () => {
    expect(getWarehouseTypeLabel("main")).toBe("Main Warehouse");
    expect(getWarehouseTypeLabel("distribution")).toBe("Distribution Center");
    expect(getWarehouseTypeLabel("custom_depot")).toBe("Custom Depot");
    expect(getWarehouseTypeLabel("")).toBe("—");
  });

  it("exports dialog options whose values match tone keys", () => {
    expect(WAREHOUSE_TYPE_OPTIONS).toHaveLength(6);
    for (const opt of WAREHOUSE_TYPE_OPTIONS) {
      const tone = getWarehouseTypeTone(opt.value);
      expect(tone.className).toContain("bg-gradient-to-r");
      // Each option resolves to its own glass hue class (not empty / missing)
      expect(tone.className.length).toBeGreaterThan(20);
    }
    expect(getWarehouseTypeTone("main").icon).toBe(Building);
  });

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
