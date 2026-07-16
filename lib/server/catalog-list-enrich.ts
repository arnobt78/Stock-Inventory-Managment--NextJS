/**
 * REQ-0141 / REQ-0142 — batch product counts (+ optional supplier User.email)
 * for category/supplier lists. Soft-deleted products excluded via mergeProductListWhere.
 * Counts are scoped to the viewer's catalog (ownerUserId) so % matches catalogProductTotal.
 */

import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";

/** Active product counts keyed by categoryId (viewer-owned catalog only). */
export async function countProductsByCategoryIds(
  categoryIds: string[],
  ownerUserId: string,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (categoryIds.length === 0) return map;

  const groups = await prisma.product.groupBy({
    by: ["categoryId"],
    where: mergeProductListWhere({
      categoryId: { in: categoryIds },
      userId: ownerUserId,
    }),
    _count: { id: true },
  });
  for (const g of groups) {
    map.set(g.categoryId, g._count.id);
  }
  return map;
}

/** Active product counts keyed by supplierId (viewer-owned catalog only). */
export async function countProductsBySupplierIds(
  supplierIds: string[],
  ownerUserId: string,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (supplierIds.length === 0) return map;

  const groups = await prisma.product.groupBy({
    by: ["supplierId"],
    where: mergeProductListWhere({
      supplierId: { in: supplierIds },
      userId: ownerUserId,
    }),
    _count: { id: true },
  });
  for (const g of groups) {
    map.set(g.supplierId, g._count.id);
  }
  return map;
}

/** Role-visible catalog size for % column (owner's active products). */
export async function countActiveCatalogProductsForUser(
  userId: string,
): Promise<number> {
  return prisma.product.count({
    where: mergeProductListWhere({ userId }),
  });
}

/** Attach productCount to category list rows (scoped to ownerUserId). */
export async function enrichCategoriesWithProductCounts<
  T extends { id: string },
>(
  rows: T[],
  ownerUserId: string,
): Promise<Array<T & { productCount: number }>> {
  const counts = await countProductsByCategoryIds(
    rows.map((r) => r.id),
    ownerUserId,
  );
  return rows.map((row) => ({
    ...row,
    productCount: counts.get(row.id) ?? 0,
  }));
}

/**
 * Attach productCount + linked User.email (null when missing) to supplier list rows.
 * Email comes from Supplier.userId → User (role-linked / OAuth accounts).
 * Counts scoped to ownerUserId (list viewer catalog).
 */
export async function enrichSuppliersWithListFields<
  T extends { id: string; userId: string },
>(
  rows: T[],
  ownerUserId: string,
): Promise<Array<T & { productCount: number; email: string | null }>> {
  const counts = await countProductsBySupplierIds(
    rows.map((r) => r.id),
    ownerUserId,
  );
  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        })
      : [];
  const emailByUserId = new Map(users.map((u) => [u.id, u.email ?? null]));

  return rows.map((row) => ({
    ...row,
    productCount: counts.get(row.id) ?? 0,
    email: emailByUserId.get(row.userId) ?? null,
  }));
}
