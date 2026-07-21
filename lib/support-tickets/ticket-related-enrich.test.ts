import { describe, expect, it } from "vitest";
import { mergeTicketRelated } from "./ticket-related-enrich";
import type { SupportTicket } from "@/types";

const base = {
  id: "t1",
  subject: "S",
  description: "D",
  status: "open",
  priority: "medium",
  userId: "u1",
  assignedToId: null,
  productId: "p1",
  orderId: "o1",
  supplierId: null,
  notes: null,
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: null,
} as SupportTicket;

describe("mergeTicketRelated", () => {
  it("merges related fields onto ticket", () => {
    const merged = mergeTicketRelated(base, {
      relatedProductName: "Sony TV",
      relatedOrderNumber: "ORD-1",
      relatedOrderStatus: "delivered",
    });
    expect(merged.relatedProductName).toBe("Sony TV");
    expect(merged.relatedOrderNumber).toBe("ORD-1");
    expect(merged.subject).toBe("S");
  });

  // REQ-0201 — densify snap fields merge through
  it("merges related product densify fields", () => {
    const merged = mergeTicketRelated(base, {
      relatedProductName: "Beats",
      relatedProductSku: "SK56",
      relatedProductImageUrl: "https://img/x",
      relatedProductPrice: 199,
      relatedProductQuantity: 50,
      relatedProductCategoryName: "Headphone",
      relatedProductOwnerId: "owner-1",
      relatedProductOwnerName: "Test Admin",
      relatedProductSupplierId: "sup-1",
      relatedProductSupplierName: "Local Parts Co",
    });
    expect(merged.relatedProductPrice).toBe(199);
    expect(merged.relatedProductOwnerName).toBe("Test Admin");
    expect(merged.relatedProductSupplierName).toBe("Local Parts Co");
  });
});
