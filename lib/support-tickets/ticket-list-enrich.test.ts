/**
 * REQ-0185 — pure shape guard for supportTickets:list:v2 Redis rows.
 */

import { describe, expect, it } from "vitest";
import { hasTicketListV2Shape } from "@/lib/support-tickets/ticket-list-enrich";
import type { SupportTicket } from "@/types";

function baseRow(
  overrides: Partial<SupportTicket> = {},
): SupportTicket {
  return {
    id: "t1",
    subject: "Help",
    description: "Desc",
    status: "open",
    priority: "medium",
    userId: "u1",
    assignedToId: "u2",
    productId: null,
    orderId: null,
    supplierId: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    creatorImage: null,
    assignedToImage: null,
    ...overrides,
  };
}

describe("hasTicketListV2Shape", () => {
  it("rejects null", () => {
    expect(hasTicketListV2Shape(null)).toBe(false);
  });

  it("accepts empty list", () => {
    expect(hasTicketListV2Shape([])).toBe(true);
  });

  it("accepts rows with creatorImage + assignedToImage keys", () => {
    expect(hasTicketListV2Shape([baseRow()])).toBe(true);
    expect(
      hasTicketListV2Shape([
        baseRow({ creatorImage: "https://x", assignedToImage: null }),
      ]),
    ).toBe(true);
  });

  it("rejects stale rows missing image keys", () => {
    const stale = baseRow();
    delete (stale as { creatorImage?: unknown }).creatorImage;
    delete (stale as { assignedToImage?: unknown }).assignedToImage;
    expect(hasTicketListV2Shape([stale])).toBe(false);
  });
});
