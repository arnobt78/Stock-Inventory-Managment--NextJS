/**
 * REQ-0138 — capitalize first letter of a string (e.g. reorder status "urgent" → "Urgent").
 */
export function capitalizeFirst(value: string | null | undefined): string {
  if (value == null || value.length === 0) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
