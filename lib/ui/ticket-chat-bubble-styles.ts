/**
 * REQ-0194 — Ticket chat bubble shell + opposing left/right glow gradients.
 * Content-sized width is applied in SupportTicketReplyThread (w-fit max-w-[90%]).
 * Glow uses even blur (0 offset) so all sides render when parent is overflow-visible.
 */

/** Shared bubble chrome (corners overridden per side). */
export const TICKET_CHAT_BUBBLE_SHELL =
  "w-fit max-w-[90%] min-w-0 rounded-2xl border px-3 py-2.5 backdrop-blur-md";

/**
 * Creator / left — glow on left → fade to white/clear on right.
 */
export const TICKET_CHAT_BUBBLE_LEFT =
  "rounded-tl-md border-border/50 " +
  "bg-gradient-to-r from-slate-400/30 via-slate-200/15 to-white/95 " +
  "dark:from-white/15 dark:via-white/5 dark:to-transparent " +
  "shadow-[0_0_24px_rgba(100,116,139,0.28)] dark:shadow-[0_0_24px_rgba(255,255,255,0.1)]";

/**
 * Staff / right — glow on right → fade to white/clear on left (opposite of left).
 */
export const TICKET_CHAT_BUBBLE_RIGHT =
  "rounded-tr-md border-violet-400/25 " +
  "bg-gradient-to-l from-violet-500/30 via-violet-500/12 to-white/95 " +
  "dark:from-violet-500/35 dark:via-violet-500/12 dark:to-transparent " +
  "shadow-[0_0_24px_rgba(139,92,246,0.32)] dark:shadow-[0_0_24px_rgba(139,92,246,0.28)]";
