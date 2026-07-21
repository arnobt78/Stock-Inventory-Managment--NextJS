/**
 * REQ-0192 — Ticket message counts: opening description = 1 creator message,
 * plus reply thread (same semantics as table `1 + replyCount`).
 */

export type TicketMessageStats = {
  total: number;
  fromCreator: number;
  fromStaff: number;
};

/** List/KPI: total messages for a ticket given Prisma replyCount. */
export function ticketMessageTotal(replyCount: number | null | undefined): number {
  return 1 + (replyCount ?? 0);
}

/**
 * Detail Messages card: opening description + replies split by creator vs staff.
 */
export function computeTicketMessageStats(
  creatorUserId: string,
  replies: { userId: string }[],
): TicketMessageStats {
  const fromStaff = replies.filter((r) => r.userId !== creatorUserId).length;
  const fromCreatorReplies = replies.length - fromStaff;
  return {
    total: 1 + replies.length,
    fromCreator: 1 + fromCreatorReplies,
    fromStaff,
  };
}
