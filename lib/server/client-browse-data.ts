/**
 * SSR client browse meta + products (REQ-0026).
 * Mirrors GET /api/portal/client/browse-meta and browse-products.
 */
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { enrichProductsWithCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import type { ClientBrowseMeta, ClientBrowseProductsResponse } from "@/types";

/** Admins/users who own at least one active catalog product (client browse picker). */
export async function getProductOwnerAdminsForBrowse() {
  const ownerRows = await prisma.product.findMany({
    where: mergeProductListWhere({}),
    distinct: ["userId"],
    select: { userId: true },
  });
  const ownerIds = ownerRows.map((r) => r.userId);
  if (ownerIds.length === 0) return [];

  return prisma.user.findMany({
    where: {
      id: { in: ownerIds },
      role: { in: ["admin", "user"] },
    },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });
}

/** Product owners + global stats for client /products browse. */
export async function getClientBrowseMetaForPage(): Promise<ClientBrowseMeta> {
  const [
    admins,
    totalStoreOwners,
    clientsCount,
    supplierActive,
    supplierInactive,
    categoryActive,
    categoryInactive,
    warehouseActive,
    warehouseInactive,
  ] = await Promise.all([
    getProductOwnerAdminsForBrowse(),
    prisma.user.count({ where: { role: { in: ["admin", "user"] } } }),
    prisma.user.count({ where: { role: "client" } }),
    prisma.supplier.count({ where: { status: true } }),
    prisma.supplier.count({ where: { status: false } }),
    prisma.category.count({ where: { status: true } }),
    prisma.category.count({ where: { status: false } }),
    prisma.warehouse.count({ where: { status: true } }),
    prisma.warehouse.count({ where: { status: false } }),
  ]);

  return {
    admins: admins.map((a) => ({
      id: a.id,
      name: a.name ?? a.email ?? "Unknown",
      email: a.email ?? "",
      image: a.image ?? null,
    })),
    stats: {
      storeOwners: {
        total: totalStoreOwners,
        withProducts: admins.length,
      },
      admins: admins.length,
      clients: clientsCount,
      suppliers: {
        total: supplierActive + supplierInactive,
        active: supplierActive,
        inactive: supplierInactive,
      },
      categories: {
        total: categoryActive + categoryInactive,
        active: categoryActive,
        inactive: categoryInactive,
      },
      warehouses: {
        total: warehouseActive + warehouseInactive,
        active: warehouseActive,
        inactive: warehouseInactive,
      },
    },
  };
}

/** Default owner for first paint — matches ClientProductList client-side preference. */
export async function resolveDefaultBrowseOwnerId(
  meta?: ClientBrowseMeta,
): Promise<string> {
  const admins = meta?.admins ?? (await getClientBrowseMetaForPage()).admins;
  if (admins.length === 0) return "";
  const preferred = admins.find((a) => a.email === "test@admin.com");
  return preferred?.id ?? admins[0]!.id;
}

/** Products for a selected owner (client browse). */
export async function getClientBrowseProductsForPage(
  ownerId: string,
  filters?: { supplierId?: string; categoryId?: string },
): Promise<ClientBrowseProductsResponse | null> {
  if (!ownerId) return null;

  const productWhere: {
    userId: string;
    supplierId?: string;
    categoryId?: string;
  } = { userId: ownerId };
  if (filters?.supplierId && filters.supplierId !== "all") {
    productWhere.supplierId = filters.supplierId;
  }
  if (filters?.categoryId && filters.categoryId !== "all") {
    productWhere.categoryId = filters.categoryId;
  }

  const [products, allOwnerProducts, ownerUser] = await Promise.all([
    prisma.product.findMany({
      where: mergeProductListWhere(productWhere),
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: mergeProductListWhere({ userId: ownerId }),
      select: { categoryId: true, supplierId: true },
    }),
    prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const categoryIds = [...new Set(allOwnerProducts.map((p) => p.categoryId))];
  const supplierIds = [...new Set(allOwnerProducts.map((p) => p.supplierId))];

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

  const enrichedProducts = await enrichProductsWithCommittedQuantity(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: Number(p.price),
      quantity: Number(p.quantity),
      reservedQuantity: Number(p.reservedQuantity ?? 0),
      status: p.status,
      categoryId: p.categoryId,
      supplierId: p.supplierId,
      category: categoryMap.get(p.categoryId) || "Unknown",
      supplier: supplierMap.get(p.supplierId) || "Unknown",
      userId: p.userId,
      createdBy: p.createdBy,
      updatedBy: p.updatedBy || null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt?.toISOString() || null,
      qrCodeUrl: p.qrCodeUrl || null,
      imageUrl: p.imageUrl || null,
      imageFileId: p.imageFileId || null,
      expirationDate: p.expirationDate?.toISOString() || null,
    })),
  );

  return {
    products: enrichedProducts,
    categories,
    suppliers,
    owner: ownerUser
      ? { id: ownerUser.id, name: ownerUser.name, email: ownerUser.email }
      : undefined,
  };
}
