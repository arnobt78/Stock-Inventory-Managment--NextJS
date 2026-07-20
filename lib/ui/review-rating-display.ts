/**
 * REQ-0165 / REQ-0167 — shared rating label + star/text hues.
 * `textClass` = light surfaces (tables); `dialogTextClass` = always-dark dialog shells.
 */

export type ReviewRatingDisplay = {
  label: string;
  starClass: string;
  /** Light / table surfaces (uses dark: for theme flip) */
  textClass: string;
  /** Always-dark dialog shells — bright hues without relying on html.dark */
  dialogTextClass: string;
};

/** Map 1–5 rating to semantic label and color classes. */
export function getRatingDisplay(rating: number): ReviewRatingDisplay {
  switch (rating) {
    case 5:
      return {
        label: "best",
        starClass:
          "fill-amber-400 text-amber-400 dark:fill-amber-400 dark:text-amber-400",
        textClass: "text-amber-700 dark:text-amber-300",
        dialogTextClass: "text-amber-300",
      };
    case 4:
      return {
        label: "very good",
        starClass:
          "fill-emerald-400 text-emerald-400 dark:fill-emerald-400 dark:text-emerald-400",
        textClass: "text-emerald-700 dark:text-emerald-300",
        dialogTextClass: "text-emerald-300",
      };
    case 3:
      return {
        label: "good",
        starClass:
          "fill-sky-400 text-sky-400 dark:fill-sky-400 dark:text-sky-400",
        textClass: "text-sky-700 dark:text-sky-300",
        dialogTextClass: "text-sky-300",
      };
    case 2:
      return {
        label: "not good",
        starClass:
          "fill-orange-400 text-orange-400 dark:fill-orange-400 dark:text-orange-400",
        textClass: "text-orange-700 dark:text-orange-300",
        dialogTextClass: "text-orange-300",
      };
    case 1:
      return {
        label: "bad",
        starClass:
          "fill-rose-400 text-rose-400 dark:fill-rose-400 dark:text-rose-400",
        textClass: "text-rose-700 dark:text-rose-300",
        dialogTextClass: "text-rose-300",
      };
    default:
      return {
        label: "—",
        starClass: "fill-muted-foreground/50 text-muted-foreground",
        textClass: "text-muted-foreground",
        dialogTextClass: "text-white/60",
      };
  }
}

/** Truncate review comment for delete confirm / tooltips. */
export function truncateReviewComment(
  comment: string | null | undefined,
  maxLen = 80,
): string {
  if (!comment) return "";
  const trimmed = comment.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}
