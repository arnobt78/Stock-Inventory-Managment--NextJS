import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  patchDetailCache,
  patchDetailCacheMerge,
  patchLinkedOrderFromInvoiceMoney,
  patchListCaches,
  patchOrderGraphListCaches,
  patchInvoicesOnOrderCancel,
  patchOrdersOnShipping,
  patchLinkedInvoicesFromOrder,
  patchProductInPortalCaches,
  removeFromListCaches,
} from "./patch-mutation-cache";
import { queryKeys } from "./config";

describe("patch-mutation-cache", () => {
  it("patchDetailCacheMerge merges partial fields into detail key", () => {
    const qc = new QueryClient();
    const key = ["invoices", "detail", "i1"] as const;
    qc.setQueryData(key, { id: "i1", status: "draft", total: 100 });
    patchDetailCacheMerge<{ id: string; status: string; total: number }>(
      qc,
      key,
      (old) => (old ? { ...old, status: "sent" } : undefined),
    );
    expect(qc.getQueryData(key)).toEqual({
      id: "i1",
      status: "sent",
      total: 100,
    });
  });

  it("patchDetailCache writes entity to detail key", () => {
    const qc = new QueryClient();
    const key = ["products", "detail", "p1"] as const;
    patchDetailCache(qc, key, { id: "p1", quantity: 20 });
    expect(qc.getQueryData(key)).toEqual({ id: "p1", quantity: 20 });
  });

  it("patchListCaches merges row by id across list queries", () => {
    const qc = new QueryClient();
    const root = ["products"] as const;
    const listKey = ["products", "list"] as const;
    qc.setQueryData(listKey, [
      { id: "p1", quantity: 50, name: "A" },
      { id: "p2", quantity: 1, name: "B" },
    ]);
    patchListCaches(qc, root, { id: "p1", quantity: 20 });
    expect(qc.getQueryData(listKey)).toEqual([
      { id: "p1", quantity: 20, name: "A" },
      { id: "p2", quantity: 1, name: "B" },
    ]);
  });

  it("patchOrderGraphListCaches updates orders and invoices list keys", () => {
    const qc = new QueryClient();
    const orderListKey = ["orders", "list"] as const;
    const invoiceListKey = ["invoices", "list"] as const;
    qc.setQueryData(orderListKey, [{ id: "o1", status: "pending" }]);
    qc.setQueryData(invoiceListKey, [{ id: "i1", status: "draft" }]);
    patchOrderGraphListCaches(qc, { id: "o1", status: "confirmed" });
    patchOrderGraphListCaches(qc, { id: "i1", status: "sent" });
    expect(qc.getQueryData(orderListKey)).toEqual([
      { id: "o1", status: "confirmed" },
    ]);
    expect(qc.getQueryData(invoiceListKey)).toEqual([{ id: "i1", status: "sent" }]);
  });

  // REQ-0210 — cancel patches invoice by orderId, not order.id
  it("patchInvoicesOnOrderCancel updates linked invoice list + detail", () => {
    const qc = new QueryClient();
    const orderListKey = ["orders", "list"] as const;
    const invoiceListKey = ["invoices", "list"] as const;
    const invoiceDetailKey = ["invoices", "detail", "i1"] as const;
    qc.setQueryData(orderListKey, [
      {
        id: "o1",
        status: "confirmed",
        paymentStatus: "partial",
        invoiceForOrder: {
          id: "i1",
          invoiceNumber: "INV-KEEP",
          createdAt: "2026-07-25T10:00:00.000Z",
          status: "sent",
          amountDue: 78.12,
        },
      },
    ]);
    qc.setQueryData(invoiceListKey, [
      {
        id: "i1",
        orderId: "o1",
        status: "sent",
        amountDue: 78.12,
        linkedOrderPaymentStatus: "partial",
      },
    ]);
    qc.setQueryData(invoiceDetailKey, {
      id: "i1",
      orderId: "o1",
      status: "sent",
      amountDue: 78.12,
      amountPaid: 100,
    });
    patchInvoicesOnOrderCancel(qc, {
      id: "o1",
      status: "cancelled",
      paymentStatus: "refunded",
      cancelledAt: "2026-07-25T12:00:00.000Z",
      invoiceForOrder: { id: "i1" },
    });
    expect(qc.getQueryData(invoiceListKey)).toEqual([
      {
        id: "i1",
        orderId: "o1",
        status: "cancelled",
        amountDue: 0,
        cancelledAt: "2026-07-25T12:00:00.000Z",
        statusAt: "2026-07-25T12:00:00.000Z",
        linkedOrderStatus: "cancelled",
        linkedOrderPaymentStatus: "refunded",
        linkedOrderStatusAt: "2026-07-25T12:00:00.000Z",
        updatedAt: "2026-07-25T12:00:00.000Z",
      },
    ]);
    expect(qc.getQueryData(invoiceDetailKey)).toMatchObject({
      status: "cancelled",
      amountDue: 0,
      linkedOrderPaymentStatus: "refunded",
    });
    expect(qc.getQueryData(orderListKey)).toMatchObject([
      {
        id: "o1",
        status: "cancelled",
        paymentStatus: "refunded",
        statusAt: "2026-07-25T12:00:00.000Z",
        // Must keep invoiceNumber/createdAt (no late INV# flash)
        invoiceForOrder: {
          id: "i1",
          invoiceNumber: "INV-KEEP",
          createdAt: "2026-07-25T10:00:00.000Z",
          status: "cancelled",
          amountDue: 0,
        },
      },
    ]);
  });

  it("patchLinkedInvoicesFromOrder syncs processing + payment badges", () => {
    const qc = new QueryClient();
    const invoiceListKey = queryKeys.invoices.lists();
    qc.setQueryData(invoiceListKey, [
      {
        id: "i1",
        orderId: "o1",
        linkedOrderStatus: "confirmed",
        linkedOrderPaymentStatus: "unpaid",
      },
    ]);
    patchLinkedInvoicesFromOrder(qc, {
      orderId: "o1",
      status: "processing",
      paymentStatus: "partial",
      statusAt: "2026-07-25T16:00:00.000Z",
    });
    expect(qc.getQueryData(invoiceListKey)).toMatchObject([
      {
        id: "i1",
        linkedOrderStatus: "processing",
        linkedOrderPaymentStatus: "partial",
        linkedOrderStatusAt: "2026-07-25T16:00:00.000Z",
      },
    ]);
  });

  it("patchOrdersOnShipping sets shipped on order + invoice linked status", () => {
    const qc = new QueryClient();
    const orderListKey = queryKeys.orders.lists();
    const orderDetailKey = queryKeys.orders.detail("o1");
    const invoiceListKey = queryKeys.invoices.lists();
    qc.setQueryData(orderListKey, [
      {
        id: "o1",
        status: "confirmed",
        orderNumber: "ORD-1",
        invoiceForOrder: { id: "i1", invoiceNumber: "INV-1" },
      },
    ]);
    qc.setQueryData(orderDetailKey, {
      id: "o1",
      status: "confirmed",
      placedByName: "Admin",
    });
    qc.setQueryData(invoiceListKey, [
      {
        id: "i1",
        orderId: "o1",
        status: "sent",
        linkedOrderStatus: "confirmed",
      },
    ]);
    patchOrdersOnShipping(qc, {
      orderId: "o1",
      status: "shipped",
      trackingNumber: "TEST-1",
      updatedAt: "2026-07-25T15:00:00.000Z",
    });
    expect(qc.getQueryData(orderListKey)).toMatchObject([
      {
        id: "o1",
        status: "shipped",
        statusAt: "2026-07-25T15:00:00.000Z",
        shippedAt: "2026-07-25T15:00:00.000Z",
        trackingNumber: "TEST-1",
        invoiceForOrder: { id: "i1", invoiceNumber: "INV-1" },
      },
    ]);
    expect(qc.getQueryData(orderDetailKey)).toMatchObject({
      status: "shipped",
      placedByName: "Admin",
    });
    expect(qc.getQueryData(invoiceListKey)).toMatchObject([
      {
        id: "i1",
        linkedOrderStatus: "shipped",
        linkedOrderStatusAt: "2026-07-25T15:00:00.000Z",
      },
    ]);
  });

  it("patchProductInPortalCaches merges nested browse products array", () => {
    const qc = new QueryClient();
    const browseKey = [
      "portal",
      "client",
      "browse-products",
      "owner1",
      "all",
      "all",
    ] as const;
    qc.setQueryData(browseKey, {
      products: [
        { id: "p1", quantity: 50, name: "TV" },
        { id: "p2", quantity: 5, name: "Phone" },
      ],
      total: 2,
    });
    patchProductInPortalCaches(qc, { id: "p1", quantity: 20 });
    expect(qc.getQueryData(browseKey)).toEqual({
      products: [
        { id: "p1", quantity: 20, name: "TV" },
        { id: "p2", quantity: 5, name: "Phone" },
      ],
      total: 2,
    });
  });

  it("removeFromListCaches drops deleted id", () => {
    const qc = new QueryClient();
    const root = ["products"] as const;
    const listKey = ["products", "list"] as const;
    qc.setQueryData(listKey, [{ id: "p1" }, { id: "p2" }]);
    removeFromListCaches(qc, root, "p1");
    expect(qc.getQueryData(listKey)).toEqual([{ id: "p2" }]);
  });

  // REQ-0153 — invoice money → linked order paymentStatus + invoice badge
  it("patchLinkedOrderFromInvoiceMoney sets order partial + invoice badge", () => {
    const qc = new QueryClient();
    const orderListKey = queryKeys.orders.list();
    const invoiceListKey = queryKeys.invoices.list();
    const orderDetailKey = queryKeys.orders.detail("o1");

    qc.setQueryData(orderListKey, [
      {
        id: "o1",
        paymentStatus: "unpaid",
        total: 3980,
        invoiceForOrder: {
          id: "i1",
          invoiceNumber: "INV-1",
          amountDue: 3980,
          amountPaid: 0,
        },
      },
    ]);
    qc.setQueryData(invoiceListKey, [
      {
        id: "i1",
        orderId: "o1",
        amountPaid: 0,
        amountDue: 3980,
        total: 3980,
        linkedOrderPaymentStatus: "unpaid",
      },
    ]);
    qc.setQueryData(orderDetailKey, {
      id: "o1",
      paymentStatus: "unpaid",
      total: 3980,
    });

    patchLinkedOrderFromInvoiceMoney(qc, {
      id: "i1",
      orderId: "o1",
      invoiceNumber: "INV-1",
      amountPaid: 100,
      amountDue: 3880,
      total: 3980,
      status: "sent",
    });

    const orders = qc.getQueryData<
      Array<{
        id: string;
        paymentStatus: string;
        invoiceForOrder?: { amountPaid?: number; amountDue?: number };
      }>
    >(orderListKey);
    expect(orders?.[0]?.paymentStatus).toBe("partial");
    expect(orders?.[0]?.invoiceForOrder?.amountPaid).toBe(100);
    expect(orders?.[0]?.invoiceForOrder?.amountDue).toBe(3880);

    const invoices = qc.getQueryData<
      Array<{ id: string; linkedOrderPaymentStatus?: string }>
    >(invoiceListKey);
    expect(invoices?.[0]?.linkedOrderPaymentStatus).toBe("partial");

    const detail = qc.getQueryData<{
      paymentStatus: string;
      invoiceForOrder?: { amountDue?: number };
    }>(orderDetailKey);
    expect(detail?.paymentStatus).toBe("partial");
    expect(detail?.invoiceForOrder?.amountDue).toBe(3880);
  });

  it("patchLinkedOrderFromInvoiceMoney skips cancelled invoices", () => {
    const qc = new QueryClient();
    const orderListKey = queryKeys.orders.list();
    qc.setQueryData(orderListKey, [
      { id: "o1", paymentStatus: "unpaid" },
    ]);
    patchLinkedOrderFromInvoiceMoney(qc, {
      id: "i1",
      orderId: "o1",
      amountPaid: 100,
      total: 3980,
      status: "cancelled",
    });
    expect(qc.getQueryData(orderListKey)).toEqual([
      { id: "o1", paymentStatus: "unpaid" },
    ]);
  });
});
