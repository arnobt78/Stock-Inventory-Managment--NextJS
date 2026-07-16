/**
 * Server-side data fetching for homepage SSR
 * Fetches products, categories, and suppliers using the same logic and cache as API routes.
 * Only import this from server code (e.g. app/page.tsx).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { enrichProductsWithCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import { prisma } from "@/prisma/client";

/** Product shape returned by products API GET (dates as ISO strings) */
export type ProductForHome = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  reservedQuantity: number;
  /** REQ-0103 — display-only sum of disjoint reservation paths */
  committedQuantity: number;
  status: string;
  categoryId: string;
  supplierId: string;
  category: string;
  supplier: string;
  userId: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  qrCodeUrl: string | null;
  imageUrl: string | null;
  imageFileId: string | null;
  expirationDate: string | null;
  /** Product owner display name (populated when fetching by supplierId) */
  productOwnerName?: string | null;
};

/** Category shape returned by categories API GET (dates as ISO strings) */
export type CategoryForHome = {
  id: string;
  name: string;
  userId: string;
  status: boolean;
  description?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy?: string | null;
  /** REQ-0141 */
  productCount?: number;
  catalogProductTotal?: number;
};

/** Supplier shape returned by suppliers API GET (dates as ISO strings) */
export type SupplierForHome = {
  id: string;
  name: string;
  userId: string;
  status: boolean;
  description?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy?: string | null;
  /** REQ-0141 */
  email?: string | null;
  productCount?: number;
  catalogProductTotal?: number;
};

/**
 * Fetch products for the given user.
 * Uses the same cache key and transform as GET /api/products so Redis is shared.
 */
export async function getProductsForUser(userId: string): Promise<ProductForHome[]> {
  const cacheKey = cacheKeys.products.list({ userId });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<ProductForHome[]>(cacheKey);
  if (
    cached &&
    cached.every((p) => typeof p.committedQuantity === "number")
  ) {
    return cached;
  }

  const products = await prisma.product.findMany({
    where: mergeProductListWhere({ userId }),
    orderBy: { createdAt: "desc" },
  });

  const categoryIds = [...new Set(products.map((p) => p.categoryId))];
  const supplierIds = [...new Set(products.map((p) => p.supplierId))];

  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  const transformed: ProductForHome[] = await enrichProductsWithCommittedQuantity(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: Number(product.quantity),
      reservedQuantity: Number(product.reservedQuantity ?? 0),
      status: product.status,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      category: categoryMap.get(product.categoryId) || "Unknown",
      supplier: supplierMap.get(product.supplierId) || "Unknown",
      userId: product.userId,
      createdBy: product.createdBy,
      updatedBy: product.updatedBy || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() ?? null,
      qrCodeUrl: product.qrCodeUrl ?? null,
      imageUrl: product.imageUrl ?? null,
      imageFileId: product.imageFileId ?? null,
      expirationDate: product.expirationDate?.toISOString() ?? null,
    })),
  );

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch products for a supplier (products where supplierId = this supplier).
 * Used when role=supplier: shows all products any admin assigned to this supplier (global).
 * Uses same shape as getProductsForUser for ProductsPage.
 */
export async function getProductsBySupplierId(
  supplierId: string,
): Promise<ProductForHome[]> {
  const cacheKey = cacheKeys.products.list({ supplierId });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<ProductForHome[]>(cacheKey);
  if (
    cached &&
    cached.every((p) => typeof p.committedQuantity === "number")
  ) {
    return cached;
  }

  const products = await prisma.product.findMany({
    where: mergeProductListWhere({ supplierId }),
    orderBy: { createdAt: "desc" },
  });

  const categoryIds = [...new Set(products.map((p) => p.categoryId))];
  const supplierIds = [...new Set(products.map((p) => p.supplierId))];
  const ownerIds = [...new Set(products.map((p) => p.userId))];

  const [categories, suppliers, ownerUsers] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true },
    }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));
  const ownerNameMap = new Map(
    ownerUsers.map((u) => [u.id, u.name ?? u.id]),
  );

  const transformed: ProductForHome[] = await enrichProductsWithCommittedQuantity(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: Number(product.quantity),
      reservedQuantity: Number(product.reservedQuantity ?? 0),
      status: product.status,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      category: categoryMap.get(product.categoryId) || "Unknown",
      supplier: supplierMap.get(product.supplierId) || "Unknown",
      userId: product.userId,
      createdBy: product.createdBy,
      updatedBy: product.updatedBy || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() ?? null,
      qrCodeUrl: product.qrCodeUrl ?? null,
      imageUrl: product.imageUrl ?? null,
      imageFileId: product.imageFileId ?? null,
      expirationDate: product.expirationDate?.toISOString() ?? null,
      productOwnerName: ownerNameMap.get(product.userId) ?? null,
    })),
  );

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch categories for the given user.
 * Same query as GET /api/categories; returns serializable objects (dates as ISO strings).
 */
export async function getCategoriesForUser(userId: string): Promise<CategoryForHome[]> {
  const { enrichCategoriesWithProductCounts, countActiveCatalogProductsForUser } =
    await import("@/lib/server/catalog-list-enrich");
  const categories = await prisma.category.findMany({
    where: { userId },
  });
  const base = categories.map((c) => ({
    id: c.id,
    name: c.name,
    userId: c.userId,
    status: c.status,
    description: c.description ?? null,
    notes: c.notes ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt?.toISOString() ?? null,
    createdBy: c.createdBy,
    updatedBy: c.updatedBy ?? null,
  }));
  const [enriched, catalogProductTotal] = await Promise.all([
    enrichCategoriesWithProductCounts(base, userId),
    countActiveCatalogProductsForUser(userId),
  ]);
  return enriched.map((c) => ({ ...c, catalogProductTotal }));
}

/**
 * Fetch suppliers for the given user.
 * Same query as GET /api/suppliers: for admin/user includes global Demo Supplier (test@supplier.com)
 * so every admin sees the demo supplier in dropdowns. Returns serializable objects (dates as ISO strings).
 * Includes isGlobalDemo so tables/dialogs can disable edit/duplicate/delete for the demo supplier.
 */
export async function getSuppliersForUser(userId: string): Promise<(SupplierForHome & { isGlobalDemo?: boolean })[]> {
  const { getSuppliersForAdminIncludingDemo, getDemoSupplierUserId } = await import("@/prisma/supplier");
  const { enrichSuppliersWithListFields, countActiveCatalogProductsForUser } =
    await import("@/lib/server/catalog-list-enrich");
  const [suppliers, demoUserId, catalogProductTotal] = await Promise.all([
    getSuppliersForAdminIncludingDemo(userId),
    getDemoSupplierUserId(),
    countActiveCatalogProductsForUser(userId),
  ]);
  const base = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    userId: s.userId,
    status: s.status,
    description: s.description ?? null,
    notes: s.notes ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt?.toISOString() ?? null,
    createdBy: s.createdBy,
    updatedBy: s.updatedBy ?? null,
    isGlobalDemo: demoUserId != null && s.userId === demoUserId,
  }));
  // REQ-0142 — productCount scoped to list viewer catalog (userId)
  const enriched = await enrichSuppliersWithListFields(base, userId);
  return enriched.map((s) => ({ ...s, catalogProductTotal }));
}
