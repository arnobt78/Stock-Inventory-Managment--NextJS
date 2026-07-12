import { describe, expect, it } from "vitest";
import {
  CHART_LABEL_TOP_MARGIN,
  formatChartCountLabel,
  formatChartCurrencyLabel,
  formatChartPointLabel,
} from "./chart-point-label";

describe("chart-point-label", () => {
  it("formatChartCurrencyLabel formats small and large values", () => {
    expect(formatChartCurrencyLabel(49)).toBe("$49");
    expect(formatChartCurrencyLabel(52.52)).toBe("$52.52");
    expect(formatChartCurrencyLabel(1500)).toBe("$1.5k");
  });

  it("formatChartCountLabel rounds to integer string", () => {
    expect(formatChartCountLabel(3.7)).toBe("4");
  });

  it("formatChartPointLabel delegates to formatter", () => {
    expect(formatChartPointLabel(10, formatChartCountLabel)).toBe("10");
    expect(formatChartPointLabel(NaN)).toBe("");
  });

  it("exports CHART_LABEL_TOP_MARGIN for chart margin sync (REQ-0077)", () => {
    expect(CHART_LABEL_TOP_MARGIN).toBe(28);
  });
});
