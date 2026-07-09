/**
 * SSR client catalog overview (REQ-0026).
 * Mirrors GET /api/portal/client/catalog.
 */
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import type { ClientCatalogOverview } from "@/types";

const CATALOG_LIMIT_SUPPLIERS = 30;
const CATALOG_LIMIT_CATEGORIES = 30;
const CATALOG_LIMIT_PRODUCTS = 50;

export async function getClientCatalogOverview(
  _userId: string,
): Promise<ClientCatalogOverview> {
  const [suppliers, categories, products] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      take: CATALOG_LIMIT_SUPPLIERS,
      select: { id: true, name: true, status: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      take: CATALOG_LIMIT_CATEGORIES,
      select: { id: true, name: true, status: true, userId: true },
    }),
    prisma.product.findMany({
      where: mergeProductListWhere({}),
      orderBy: { createdAt: "desc" },
      take: CATALOG_LIMIT_PRODUCTS,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        status: true,
        categoryId: true,
        supplierId: true,
        userId: true,
      },
    }),
  ]);

  const categoryIds = [...new Set(products.map((p) => p.categoryId))];
  const supplierIds = [...new Set(products.map((p) => p.supplierId))];
  const creatorIds = [
    ...new Set([
      ...categories.map((c) => c.userId),
      ...products.map((p) => p.userId),
    ]),
  ];

  const [categoryList, supplierList, supplierCounts, categoryCounts, users] =
    await Promise.all([
      prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      }),
      prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, name: true },
      }),
      prisma.product.groupBy({
        by: ["supplierId"],
        _count: { id: true },
      }),
      prisma.product.groupBy({
        by: ["categoryId"],
        _count: { id: true },
      }),
      prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, name: true },
      }),
    ]);

  const categoryMap = new Map(categoryList.map((c) => [c.id, c.name]));
  const supplierMap = new Map(supplierList.map((s) => [s.id, s.name]));
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const productCountBySupplier = new Map(
    supplierCounts.map((s) => [s.supplierId, s._count.id]),
  );
  const productCountByCategory = new Map(
    categoryCounts.map((c) => [c.categoryId, c._count.id]),
  );

  return {
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status ? "Active" : "Inactive",
      productCount: productCountBySupplier.get(s.id) ?? 0,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status ? "Active" : "Inactive",
      productCount: productCountByCategory.get(c.id) ?? 0,
      categoryCreatorId: c.userId,
      categoryCreatorName: userMap.get(c.userId) ?? null,
    })),
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId,
      categoryName: categoryMap.get(p.categoryId) ?? "—",
      supplierId: p.supplierId,
      supplierName: supplierMap.get(p.supplierId) ?? "—",
      price: Number(p.price),
      status: p.status,
      productOwnerId: p.userId,
      productOwnerName: userMap.get(p.userId) ?? null,
    })),
  };
}
