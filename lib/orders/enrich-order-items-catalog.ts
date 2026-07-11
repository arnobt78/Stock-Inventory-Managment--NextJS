/**
 * REQ-0071 — batch-resolve category/supplier display names for order line items.
 * Product model stores categoryId/supplierId only (no Prisma relations).
 */

import { prisma } from "@/prisma/client";
import type { OrderItem } from "@/types";

export async function enrichOrderItemsCatalogNames(
  items: OrderItem[],
): Promise<OrderItem[]> {
  if (items.length === 0) return items;

  const categoryIds = [
    ...new Set(
      items.map((i) => i.categoryId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const supplierIds = [
    ...new Set(
      items.map((i) => i.supplierId).filter((id): id is string => Boolean(id)),
    ),
  ];

  const [categories, suppliers] = await Promise.all([
    categoryIds.length > 0
      ? prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [],
    supplierIds.length > 0
      ? prisma.supplier.findMany({
          where: { id: { in: supplierIds } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const supplierNames = new Map(suppliers.map((s) => [s.id, s.name]));

  return items.map((item) => ({
    ...item,
    categoryName: item.categoryId
      ? (categoryNames.get(item.categoryId) ?? null)
      : null,
    supplierName: item.supplierId
      ? (supplierNames.get(item.supplierId) ?? null)
      : null,
  }));
}
