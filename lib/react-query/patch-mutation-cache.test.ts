import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  patchDetailCache,
  patchListCaches,
  patchOrderGraphListCaches,
  patchProductInPortalCaches,
  removeFromListCaches,
} from "./patch-mutation-cache";

describe("patch-mutation-cache", () => {
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
});
