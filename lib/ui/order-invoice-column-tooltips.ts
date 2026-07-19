/**
 * REQ-0161 — Hover copy for dense Order / Invoice table column headers (HelpTooltip).
 * Mirrors catalog Products column pattern (REQ-0142).
 */

/** Order table — Order # cell (link, party meta, products, items/units/date). */
export const ORDER_NUMBER_COLUMN_TOOLTIP =
  "Order number (copyable link). Optional Self/Client or Store buyer/owner line. Product links, then items · units · created date.";

/** Order + Invoice tables — Invoice # cell (OrderTableInvoiceCell density). */
export const INVOICE_NUMBER_COLUMN_TOOLTIP =
  "Invoice number (copyable link) · created date. Amount due · secondary date (due/paid/sent/cancelled) · status badge. Optional Self/Client or Store issuer.";

/** Order table — Status badge + statusAt. */
export const ORDER_STATUS_COLUMN_TOOLTIP =
  "Order fulfillment status badge and the date/time for that status (e.g. delivered, cancelled).";

/** Order table — Payment badge + payment event date. */
export const ORDER_PAYMENT_COLUMN_TOOLTIP =
  "Payment status badge (unpaid/partial/paid) and the related payment event date.";

/** Order table — Total + Paid/Due breakdown. */
export const ORDER_TOTAL_COLUMN_TOOLTIP =
  "Order total. When linked to an invoice, Paid and Due amounts may appear below.";

/** Invoice table — linked Order # cell. */
export const INVOICE_ORDER_COLUMN_TOOLTIP =
  "Linked order number (copyable). Order and payment status badges with event dates, product links, then items · units · created date.";

/** Invoice table — Status badge + statusAt. */
export const INVOICE_STATUS_COLUMN_TOOLTIP =
  "Invoice status badge (draft/sent/paid/…) and the date/time for that status.";

/** Invoice table — Total + Paid/Due breakdown. */
export const INVOICE_TOTAL_COLUMN_TOOLTIP =
  "Invoice total. Paid and Due amounts may appear below when partially paid.";
