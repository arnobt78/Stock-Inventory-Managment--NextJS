/**
 * REQ-0179 — shared category/supplier/owner maps for product list DTOs
 * (GET /api/products + home-data SSR share Redis products:list:v3).
 */

import { prisma } from "@/prisma/client";

export type ProductListPartyMaps = {
  categoryMap: Map<string, string>;
  /** supplierId → name + linked userId for avatar */
  supplierMap: Map<string, { name: string; userId: string | null }>;
  /** userId → name + image + email (owners + supplier users) */
  userMap: Map<
    string,
    { name: string | null; image: string | null; email: string | null }
  >;
};

type ProductPartyIds = {
  userId: string;
  categoryId: string;
  supplierId: string;
};

/** Batch-load category names, supplier names/userIds, and user avatars. */
export async function loadProductListPartyMaps(
  products: ProductPartyIds[],
): Promise<ProductListPartyMaps> {
  const categoryIds = [...new Set(products.map((p) => p.categoryId))];
  const supplierIds = [...new Set(products.map((p) => p.supplierId))];
  const ownerIds = [...new Set(products.map((p) => p.userId))];

  const [categories, suppliers] = await Promise.all([
    categoryIds.length > 0
      ? prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    supplierIds.length > 0
      ? prisma.supplier.findMany({
          where: { id: { in: supplierIds } },
          select: { id: true, name: true, userId: true },
        })
      : Promise.resolve(
          [] as { id: string; name: string; userId: string }[],
        ),
  ]);

  const supplierUserIds = [
    ...new Set(suppliers.map((s) => s.userId).filter(Boolean)),
  ];
  const allUserIds = [...new Set([...ownerIds, ...supplierUserIds])];

  const users =
    allUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: { id: true, name: true, image: true, email: true },
        })
      : [];

  return {
    categoryMap: new Map(categories.map((c) => [c.id, c.name])),
    supplierMap: new Map(
      suppliers.map((s) => [
        s.id,
        { name: s.name, userId: s.userId ?? null },
      ]),
    ),
    userMap: new Map(
      users.map((u) => [
        u.id,
        {
          name: u.name ?? null,
          image: u.image ?? null,
          email: u.email ?? null,
        },
      ]),
    ),
  };
}

/** Display fields for list/dialog densify (owner + supplier avatars). */
export function productListPartyFields(
  product: ProductPartyIds,
  maps: ProductListPartyMaps,
): {
  category: string;
  supplier: string;
  productOwnerName: string | null;
  productOwnerImage: string | null;
  /** Owner email for supplier Product Owner densify (PersonNameEmailCell) */
  productOwnerEmail: string | null;
  supplierImage: string | null;
} {
  const supplier = maps.supplierMap.get(product.supplierId);
  const owner = maps.userMap.get(product.userId);
  const supplierUser = supplier?.userId
    ? maps.userMap.get(supplier.userId)
    : undefined;
  return {
    category: maps.categoryMap.get(product.categoryId) || "Unknown",
    supplier: supplier?.name || "Unknown",
    productOwnerName: owner?.name ?? product.userId,
    productOwnerImage: owner?.image ?? null,
    productOwnerEmail: owner?.email ?? null,
    supplierImage: supplierUser?.image ?? null,
  };
}
