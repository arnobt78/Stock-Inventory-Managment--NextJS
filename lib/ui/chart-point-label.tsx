/**
 * REQ-0074/0077 — Recharts point value labels (currency, count, compact).
 * Renders formatted values at data points across portal/admin/business charts.
 */

import type { ReactElement } from "react";

/** Top margin for charts using point labels — keep in sync with label Y offset. */
export const CHART_LABEL_TOP_MARGIN = 28;

const CHART_LABEL_CLASS =
  "fill-gray-700 dark:fill-white text-xs font-normal pointer-events-none";

export type ChartPointLabelFormatter = (value: number) => string;

/** Default currency label for revenue/spending charts */
export function formatChartCurrencyLabel(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

/** Integer count label for order/status charts */
export function formatChartCountLabel(value: number): string {
  return String(Math.round(value));
}

export function formatChartPointLabel(
  value: number,
  formatter: ChartPointLabelFormatter = formatChartCurrencyLabel,
): string {
  if (!Number.isFinite(value)) return "";
  return formatter(value);
}

type RechartsLabelProps = {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  index?: number;
  stroke?: string;
  fill?: string;
  formatter?: ChartPointLabelFormatter;
  lastOnly?: boolean;
  dataLength?: number;
  width?: number | string;
};

/** Area/Line dot label — value above point */
export function ChartDotLabel({
  x = 0,
  y = 0,
  value,
  index = 0,
  formatter = formatChartCurrencyLabel,
  lastOnly = false,
  dataLength = 0,
}: RechartsLabelProps): ReactElement | null {
  if (value == null || value === "") return null;
  if (lastOnly && dataLength > 0 && index !== dataLength - 1) return null;

  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num === 0) return null;

  const text = formatChartPointLabel(num, formatter);
  const cx = typeof x === "number" ? x : Number(x);
  const cy = typeof y === "number" ? y : Number(y);

  return (
    <text
      x={cx}
      y={cy - 12}
      textAnchor="middle"
      dominantBaseline="auto"
      className={CHART_LABEL_CLASS}
    >
      {text}
    </text>
  );
}

/** Bar chart top label */
export function ChartBarLabel({
  x = 0,
  y = 0,
  width = 0,
  value,
  formatter = formatChartCurrencyLabel,
}: RechartsLabelProps): ReactElement | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;

  const text = formatChartPointLabel(num, formatter);
  const cx =
    (typeof x === "number" ? x : Number(x)) +
    (typeof width === "number" ? width : Number(width ?? 0)) / 2;
  const cy = typeof y === "number" ? y : Number(y);

  return (
    <text
      x={cx}
      y={cy - 8}
      textAnchor="middle"
      dominantBaseline="auto"
      className={CHART_LABEL_CLASS}
    >
      {text}
    </text>
  );
}

/** Factory for Area/Line label prop bound to data length + formatter */
export function createChartDotLabelRenderer(
  dataLength: number,
  formatter?: ChartPointLabelFormatter,
  lastOnly = true,
): (props: unknown) => ReactElement | null {
  function ChartDotLabelRenderer(props: unknown) {
    const labelProps = props as RechartsLabelProps;
    return (
      <ChartDotLabel
        {...labelProps}
        formatter={formatter}
        lastOnly={lastOnly}
        dataLength={dataLength}
      />
    );
  }
  ChartDotLabelRenderer.displayName = "ChartDotLabelRenderer";
  return ChartDotLabelRenderer;
}

/** Factory for Bar label prop */
export function createChartBarLabelRenderer(
  formatter?: ChartPointLabelFormatter,
): (props: unknown) => ReactElement | null {
  function ChartBarLabelRenderer(props: unknown) {
    const labelProps = props as RechartsLabelProps;
    return <ChartBarLabel {...labelProps} formatter={formatter} />;
  }
  ChartBarLabelRenderer.displayName = "ChartBarLabelRenderer";
  return ChartBarLabelRenderer;
}
