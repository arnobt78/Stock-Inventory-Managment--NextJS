/**
 * Server-side data for admin Dashboard (Analytics) page
 * Aggregates counts, revenue, trends, and recent activity across all entities.
 * Only import from server code (e.g. app/admin/insights/page.tsx, GET /api/dashboard).
 * getDashboardForAdmin(userId) returns DashboardStats; uses Redis cache when available.
 * Supplier count includes demo supplier (getDemoSupplierUserId) so list and dashboard match.
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { buildPaymentMoneyStats } from "@/lib/insights/payment-money-stats";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { orderStatusAtSelect } from "@/lib/server/catalog-detail-order-select";
import { withOrderStatusAt } from "@/lib/orders/order-status-display-date";
import {
  resolveBuyerDisplayFromUsers,
  resolveBuyerUserId,
  type PartyUserRow,
} from "@/lib/orders/order-party";
import { getStoreOrderIds } from "@/lib/invoices/store-order-ids";
import { getDemoSupplierUserId } from "@/prisma/supplier";
import type {
  DashboardStats,
  DashboardCounts,
  DashboardRevenue,
  DashboardTrendPoint,
  DashboardRecent,
  DashboardRecentOrder,
  DashboardRecentTicket,
  DashboardRecentReview,
  DashboardRecentImport,
  DashboardOrderAnalytics,
  DashboardOrderStatusDist,
  DashboardTopProduct,
  DashboardInvoiceAnalytics,
  DashboardInvoiceStatusDist,
  DashboardWarehouseAnalytics,
  DashboardProductStatusBreakdown,
  DashboardUserRoleBreakdown,
  DashboardSupplierStatusBreakdown,
  DashboardCategoryStatusBreakdown,
  DashboardTicketStatusBreakdown,
  DashboardReviewStatusBreakdown,
  DashboardSelfOthersBreakdown,
} from "@/types";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getLast12Months(): {
  year: number;
  month: number;
  key: string;
  label: string;
}[] {
  const now = new Date();
  const out: { year: number; month: number; key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const label = `${MONTH_LABELS[m - 1]} ${String(y).slice(2)}`;
    out.push({ year: y, month: m, key, label });
  }
  return out;
}

function getTwelveMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Prisma where clause for resources owned by this user (products, categories, etc.). */
const userScope = (userId: string) => ({ userId });

/** REQ-0173 — reject Redis rows missing topProducts catalog meta (pre-enrich shape). */
function hasTopProductsCatalogMeta(stats: DashboardStats): boolean {
  const rows = stats.orderAnalytics?.topProducts ?? [];
  if (rows.length === 0) return true;
  return rows.every(
    (p) =>
      "categoryId" in p &&
      "supplierId" in p &&
      "imageUrl" in p &&
      "categoryName" in p &&
      "supplierName" in p,
  );
}

/** REQ-0174 — recent orders need supplierImage; reviews need categoryId. */
function hasRecentCatalogMeta(stats: DashboardStats): boolean {
  const orders = stats.recent?.orders ?? [];
  if (
    orders.length > 0 &&
    !orders.every((o) => "supplierImage" in o && "supplierId" in o)
  ) {
    return false;
  }
  const reviews = stats.recent?.reviews ?? [];
  if (
    reviews.length > 0 &&
    !reviews.every((r) => "categoryId" in r && "categoryName" in r)
  ) {
    return false;
  }
  return true;
}

export async function getDashboardForAdmin(
  userId: string,
): Promise<DashboardStats> {
  const cacheKey = cacheKeys.dashboard.overview(userId);
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<DashboardStats>(cacheKey);
  if (
    cached &&
    hasTopProductsCatalogMeta(cached) &&
    hasRecentCatalogMeta(cached)
  ) {
    return cached;
  }

  const demoUserId = await getDemoSupplierUserId();
  const whereSuppliers =
    demoUserId != null
      ? { OR: [{ userId }, { userId: demoUserId }] }
      : userScope(userId);

  const since = getTwelveMonthsAgo();
  const whereUser = userScope(userId);

  const userProductIds = (
    await prisma.product.findMany({
      where: mergeProductListWhere(whereUser),
      select: { id: true },
    })
  ).map((p) => p.id);
  const reviewWhere =
    userProductIds.length > 0
      ? { productId: { in: userProductIds } }
      : { productId: { in: [] } };

  const storeOrderIds = await getStoreOrderIds(userId);
  const whereStoreOrders =
    storeOrderIds.length > 0
      ? { id: { in: storeOrderIds } }
      : { id: { in: [] } };
  const whereInvoiceForStore =
    storeOrderIds.length > 0
      ? { orderId: { in: storeOrderIds } }
      : { orderId: { in: [] } };

  // REQ-0158 — Self = store owner + no distinct client buyer
  const selfOrderIds =
    storeOrderIds.length > 0
      ? (
          await prisma.order.findMany({
            where: {
              id: { in: storeOrderIds },
              userId,
              OR: [{ clientId: null }, { clientId: userId }],
            },
            select: { id: true },
          })
        ).map((o) => o.id)
      : [];

  const [
    productsCount,
    suppliersCount,
    categoriesCount,
    ordersCount,
    invoicesCount,
    warehousesCount,
    ticketsCount,
    reviewsCount,
    orderSum,
    orderSumNonCancelled,
    invoiceMoneyRows,
    orderRefundedSum,
    orderRefundedCount,
    orderSumCancelled,
    invoiceSum,
    ordersRaw,
    invoicesRaw,
    productsRaw,
    recentOrders,
    recentTickets,
    recentReviews,
    recentImports,
    orderStatusGroups,
    topProductsRaw,
    invoiceStatusGroups,
    activeWarehousesCount,
    inactiveWarehousesCount,
    warehouseTypeGroups,
    selfInvoiceCount,
    orderRevenueSelfSum,
  ] = await Promise.all([
    prisma.product.count({ where: mergeProductListWhere(whereUser) }),
    prisma.supplier.count({ where: whereSuppliers }),
    prisma.category.count({ where: whereUser }),
    prisma.order.count({ where: whereStoreOrders }),
    prisma.invoice.count({ where: whereInvoiceForStore }),
    prisma.warehouse.count({ where: whereUser }),
    prisma.supportTicket.count({ where: { assignedToId: userId } }),
    prisma.productReview.count({ where: reviewWhere }),
    prisma.order.aggregate({ where: whereStoreOrders, _sum: { total: true } }),
    prisma.order.aggregate({
      where: { ...whereStoreOrders, status: { not: "cancelled" } },
      _sum: { total: true },
    }),
    // REQ-0154 — invoice amount fields for Paid/Partial/Due/Pending money partition
    prisma.invoice.findMany({
      where: whereInvoiceForStore,
      select: {
        amountPaid: true,
        amountDue: true,
        total: true,
        status: true,
      },
    }),
    prisma.order.aggregate({
      where: { ...whereStoreOrders, paymentStatus: "refunded" },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { ...whereStoreOrders, paymentStatus: "refunded" },
    }),
    prisma.order.aggregate({
      where: { ...whereStoreOrders, status: "cancelled" },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: whereInvoiceForStore,
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { ...whereStoreOrders, createdAt: { gte: since } },
      select: { createdAt: true, total: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invoice.findMany({
      where: { ...whereInvoiceForStore, createdAt: { gte: since } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.findMany({
      where: mergeProductListWhere({
        ...whereUser,
        createdAt: { gte: since },
      }),
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: whereStoreOrders,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        createdAt: true,
        userId: true,
        clientId: true,
        ...orderStatusAtSelect,
        // REQ-0168/0170 — first-line catalog meta + product id/image for Latest 5
        items: {
          select: {
            productId: true,
            productName: true,
            product: {
              select: {
                imageUrl: true,
                categoryId: true,
                supplierId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.supportTicket.findMany({
      where: { assignedToId: userId },
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.productReview.findMany({
      where: reviewWhere,
      select: {
        id: true,
        productId: true,
        productName: true,
        rating: true,
        status: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.importHistory.findMany({
      where: whereUser,
      select: {
        id: true,
        userId: true,
        importType: true,
        fileName: true,
        status: true,
        successRows: true,
        failedRows: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: whereStoreOrders,
      _count: { id: true },
    }),
    // Group by productId only — name/sku snapshots can differ across lines
    // (rename/edit) and would duplicate React keys on Top Products (REQ-0136).
    storeOrderIds.length > 0
      ? prisma.orderItem.groupBy({
          by: ["productId"],
          where: { orderId: { in: storeOrderIds } },
          _count: { id: true },
          _sum: { quantity: true, subtotal: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        })
      : [],
    prisma.invoice.groupBy({
      by: ["status"],
      where: whereInvoiceForStore,
      _count: { id: true },
      _sum: { total: true, amountPaid: true, amountDue: true },
    }),
    prisma.warehouse.count({ where: { ...whereUser, status: true } }),
    prisma.warehouse.count({ where: { ...whereUser, status: false } }),
    prisma.warehouse.groupBy({
      by: ["type"],
      where: whereUser,
      _count: { id: true },
    }),
    selfOrderIds.length > 0
      ? prisma.invoice.count({ where: { orderId: { in: selfOrderIds } } })
      : 0,
    selfOrderIds.length > 0
      ? prisma.order.aggregate({
          where: {
            id: { in: selfOrderIds },
            status: { not: "cancelled" },
          },
          _sum: { total: true },
        })
      : { _sum: { total: null as number | null } },
  ]);

  const [
    usersCount,
    userRoleGroups,
    productsForBreakdown,
    supplierActiveCount,
    supplierInactiveCount,
    categoryActiveCount,
    categoryInactiveCount,
    ticketStatusGroups,
    reviewStatusGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    prisma.product.findMany({
      where: mergeProductListWhere(whereUser),
      select: { status: true, price: true, quantity: true },
    }),
    prisma.supplier.count({ where: { ...whereSuppliers, status: true } }),
    prisma.supplier.count({ where: { ...whereSuppliers, status: false } }),
    prisma.category.count({ where: { ...whereUser, status: true } }),
    prisma.category.count({ where: { ...whereUser, status: false } }),
    prisma.supportTicket.groupBy({
      by: ["status"],
      where: { assignedToId: userId },
      _count: { id: true },
    }),
    prisma.productReview.groupBy({
      by: ["status"],
      where: reviewWhere,
      _count: { id: true },
    }),
  ]);

  const productStatusBreakdown: DashboardProductStatusBreakdown = {
    available: 0,
    stockLow: 0,
    stockOut: 0,
  };
  let totalInventoryValue = 0;
  for (const p of productsForBreakdown) {
    const status = (p.status || "").toLowerCase().replace(/\s+/g, "_");
    if (status === "available") productStatusBreakdown.available += 1;
    else if (status === "stock_low") productStatusBreakdown.stockLow += 1;
    else if (status === "stock_out") productStatusBreakdown.stockOut += 1;
    totalInventoryValue += Number(p.price ?? 0) * Number(p.quantity ?? 0);
  }

  const userRoleBreakdown: DashboardUserRoleBreakdown = {
    admin: 0,
    client: 0,
    supplier: 0,
  };
  for (const g of userRoleGroups) {
    const role = (g.role ?? "").toLowerCase();
    const count = g._count.id;
    if (role === "admin") userRoleBreakdown.admin = count;
    else if (role === "client") userRoleBreakdown.client = count;
    else if (role === "supplier") userRoleBreakdown.supplier = count;
  }

  const supplierStatusBreakdown: DashboardSupplierStatusBreakdown = {
    active: supplierActiveCount,
    inactive: supplierInactiveCount,
  };

  const categoryStatusBreakdown: DashboardCategoryStatusBreakdown = {
    active: categoryActiveCount,
    inactive: categoryInactiveCount,
  };

  const ticketStatusBreakdown: DashboardTicketStatusBreakdown = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };
  for (const g of ticketStatusGroups) {
    const status = (g.status ?? "").toLowerCase();
    const count = g._count.id;
    if (status === "open") ticketStatusBreakdown.open = count;
    else if (status === "in_progress")
      ticketStatusBreakdown.in_progress = count;
    else if (status === "resolved") ticketStatusBreakdown.resolved = count;
    else if (status === "closed") ticketStatusBreakdown.closed = count;
  }

  const reviewStatusBreakdown: DashboardReviewStatusBreakdown = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };
  for (const g of reviewStatusGroups) {
    const status = (g.status ?? "").toLowerCase();
    const count = g._count.id;
    if (status === "pending") reviewStatusBreakdown.pending = count;
    else if (status === "approved") reviewStatusBreakdown.approved = count;
    else if (status === "rejected") reviewStatusBreakdown.rejected = count;
  }

  const counts: DashboardCounts = {
    products: productsCount,
    users: usersCount,
    suppliers: suppliersCount,
    categories: categoriesCount,
    orders: ordersCount,
    invoices: invoicesCount,
    warehouses: warehousesCount,
    tickets: ticketsCount,
    reviews: reviewsCount,
  };

  const revenue: DashboardRevenue = {
    fromOrders: Number(orderSum._sum.total ?? 0),
    fromInvoices: Number(invoiceSum._sum.total ?? 0),
  };

  const months = getLast12Months();
  const orderByMonth = new Map<string, { count: number; sum: number }>();
  const invoiceByMonth = new Map<string, { count: number; sum: number }>();
  const productByMonth = new Map<string, number>();

  for (const m of months) {
    orderByMonth.set(m.key, { count: 0, sum: 0 });
    invoiceByMonth.set(m.key, { count: 0, sum: 0 });
    productByMonth.set(m.key, 0);
  }

  for (const o of ordersRaw) {
    if ("status" in o && o.status === "cancelled") continue;
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = orderByMonth.get(key);
    if (cur) {
      cur.count += 1;
      cur.sum += Number(o.total);
    }
  }
  for (const inv of invoicesRaw) {
    const d = new Date(inv.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = invoiceByMonth.get(key);
    if (cur) {
      cur.count += 1;
      cur.sum += Number(inv.total);
    }
  }
  for (const p of productsRaw) {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = productByMonth.get(key) ?? 0;
    productByMonth.set(key, cur + 1);
  }

  const trends: DashboardTrendPoint[] = months.map((m) => {
    const o = orderByMonth.get(m.key);
    const i = invoiceByMonth.get(m.key);
    const p = productByMonth.get(m.key) ?? 0;
    return {
      month: m.key,
      label: m.label,
      orders: o?.count ?? 0,
      revenue: o?.sum ?? 0,
      products: p,
      invoices: i?.count ?? 0,
    };
  });

  // REQ-0168/0170/0174 — buyers, catalog, supplier avatars, review category
  type UserAvatarRow = PartyUserRow & { image?: string | null };
  type SupplierRow = { id: string; name: string; userId: string | null };
  type ReviewProductRow = {
    id: string;
    imageUrl: string | null;
    categoryId: string | null;
  };
  const recentBuyerIds = [
    ...new Set(
      recentOrders
        .map((o) =>
          resolveBuyerUserId({ userId: o.userId, clientId: o.clientId }),
        )
        .filter(Boolean),
    ),
  ];
  const recentActivityUserIds = [
    ...new Set(
      [
        ...recentTickets.map((t) => t.userId),
        ...recentReviews.map((r) => r.userId),
        ...recentImports.map((im) => im.userId),
      ].filter(Boolean),
    ),
  ];
  const recentOrderCategoryIds = [
    ...new Set(
      recentOrders
        .map((o) => o.items[0]?.product?.categoryId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const recentSupplierIds = [
    ...new Set(
      recentOrders
        .map((o) => o.items[0]?.product?.supplierId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const recentReviewProductIds = [
    ...new Set(
      recentReviews
        .map((r) => r.productId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [recentSuppliers, recentReviewProducts] = await Promise.all([
    recentSupplierIds.length > 0
      ? prisma.supplier.findMany({
          where: { id: { in: recentSupplierIds } },
          select: { id: true, name: true, userId: true },
        })
      : Promise.resolve([] as SupplierRow[]),
    recentReviewProductIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: recentReviewProductIds } },
          select: { id: true, imageUrl: true, categoryId: true },
        })
      : Promise.resolve([] as ReviewProductRow[]),
  ]);

  const recentReviewCategoryIds = [
    ...new Set(
      recentReviewProducts
        .map((p) => p.categoryId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const recentCategoryIds = [
    ...new Set([...recentOrderCategoryIds, ...recentReviewCategoryIds]),
  ];
  const recentSupplierUserIds = [
    ...new Set(
      recentSuppliers
        .map((s) => s.userId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const allRecentUserIds = [
    ...new Set([
      ...recentBuyerIds,
      ...recentActivityUserIds,
      ...recentSupplierUserIds,
    ]),
  ];

  const [recentUserRows, recentCategories] = await Promise.all([
    allRecentUserIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: allRecentUserIds } },
          select: { id: true, name: true, email: true, image: true },
        })
      : Promise.resolve([] as UserAvatarRow[]),
    recentCategoryIds.length > 0
      ? prisma.category.findMany({
          where: { id: { in: recentCategoryIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  const recentUserMap = new Map<string, UserAvatarRow>(
    recentUserRows.map((u) => [u.id, u]),
  );
  const recentCategoryMap = new Map(
    recentCategories.map((c) => [c.id, c.name]),
  );
  const recentSupplierById = new Map(recentSuppliers.map((s) => [s.id, s]));
  const recentReviewProductById = new Map(
    recentReviewProducts.map((p) => [p.id, p]),
  );

  const recent: DashboardRecent = {
    orders: recentOrders.map((o): DashboardRecentOrder => {
      const buyer = resolveBuyerDisplayFromUsers(
        { userId: o.userId, clientId: o.clientId },
        recentUserMap,
      );
      const buyerRow = recentUserMap.get(buyer.userId);
      const firstItem = o.items[0];
      const extraItemCount = Math.max(0, o.items.length - 1);
      const productPreview = firstItem?.productName
        ? extraItemCount > 0
          ? `${firstItem.productName} +${extraItemCount}`
          : firstItem.productName
        : null;
      const categoryId = firstItem?.product?.categoryId ?? null;
      const supplierId = firstItem?.product?.supplierId ?? null;
      const supplier = supplierId
        ? recentSupplierById.get(supplierId)
        : undefined;
      return withOrderStatusAt({
        id: o.id,
        orderNumber: o.orderNumber,
        total: Number(o.total),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        paymentStatus: o.paymentStatus,
        cancelledAt: o.cancelledAt,
        deliveredAt: o.deliveredAt,
        shippedAt: o.shippedAt,
        updatedAt: o.updatedAt,
        invoice: o.invoice,
        placedById: buyer.userId,
        placedByName: buyer.name,
        placedByEmail: buyer.email,
        placedByImage: buyerRow?.image ?? null,
        productId: firstItem?.productId ?? null,
        productPreview,
        productImageUrl: firstItem?.product?.imageUrl ?? null,
        extraItemCount,
        categoryId,
        categoryName: categoryId
          ? (recentCategoryMap.get(categoryId) ?? null)
          : null,
        supplierId,
        supplierName: supplier?.name ?? null,
        supplierImage: supplier?.userId
          ? (recentUserMap.get(supplier.userId)?.image ?? null)
          : null,
      });
    }),
    tickets: recentTickets.map((t): DashboardRecentTicket => {
      const u = recentUserMap.get(t.userId);
      return {
        id: t.id,
        subject: t.subject,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        userId: t.userId,
        userName: u?.name ?? u?.email ?? null,
        userImage: u?.image ?? null,
      };
    }),
    reviews: recentReviews.map((r): DashboardRecentReview => {
      const u = recentUserMap.get(r.userId);
      const product = recentReviewProductById.get(r.productId);
      const categoryId = product?.categoryId ?? null;
      return {
        id: r.id,
        productName: r.productName,
        rating: r.rating,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        userId: r.userId,
        userName: u?.name ?? u?.email ?? null,
        userImage: u?.image ?? null,
        productId: r.productId,
        productImageUrl: product?.imageUrl ?? null,
        categoryId,
        categoryName: categoryId
          ? (recentCategoryMap.get(categoryId) ?? null)
          : null,
      };
    }),
    imports: recentImports.map((im): DashboardRecentImport => {
      const u = recentUserMap.get(im.userId);
      return {
        id: im.id,
        importType: im.importType,
        fileName: im.fileName,
        status: im.status,
        successRows: im.successRows,
        failedRows: im.failedRows,
        createdAt: im.createdAt.toISOString(),
        userId: im.userId,
        userName: u?.name ?? u?.email ?? null,
        userImage: u?.image ?? null,
      };
    }),
  };

  // Build order status distribution
  const statusDistribution: DashboardOrderStatusDist = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const g of orderStatusGroups) {
    const status = g.status as keyof DashboardOrderStatusDist;
    if (status in statusDistribution) {
      statusDistribution[status] = g._count.id;
    }
  }

  // Build top products (REQ-0173 — catalog enrich for denser Product cell)
  const topProductIds = [
    ...new Set(topProductsRaw.map((p) => p.productId).filter(Boolean)),
  ];
  const topProductRows =
    topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: {
            id: true,
            name: true,
            sku: true,
            imageUrl: true,
            categoryId: true,
            supplierId: true,
          },
        })
      : [];
  const topProductById = new Map(topProductRows.map((p) => [p.id, p]));
  const topCategoryIds = [
    ...new Set(
      topProductRows
        .map((p) => p.categoryId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const topSupplierIds = [
    ...new Set(
      topProductRows
        .map((p) => p.supplierId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const [topCategories, topSuppliers] = await Promise.all([
    topCategoryIds.length > 0
      ? prisma.category.findMany({
          where: { id: { in: topCategoryIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    topSupplierIds.length > 0
      ? prisma.supplier.findMany({
          where: { id: { in: topSupplierIds } },
          select: { id: true, name: true, userId: true },
        })
      : Promise.resolve(
          [] as { id: string; name: string; userId: string | null }[],
        ),
  ]);
  const topCategoryNameById = new Map(topCategories.map((c) => [c.id, c.name]));
  const topSupplierById = new Map(topSuppliers.map((s) => [s.id, s]));
  const topSupplierUserIds = [
    ...new Set(
      topSuppliers
        .map((s) => s.userId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const topSupplierUsers =
    topSupplierUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: topSupplierUserIds } },
          select: { id: true, image: true },
        })
      : [];
  const topUserImageById = new Map(
    topSupplierUsers.map((u) => [u.id, u.image]),
  );

  const topProductsMerged: DashboardTopProduct[] = topProductsRaw.map((p) => {
    const catalog = topProductById.get(p.productId);
    const supplier = catalog?.supplierId
      ? topSupplierById.get(catalog.supplierId)
      : undefined;
    return {
      productId: p.productId,
      // Prefer live catalog name/sku; groupBy is productId-only (unique keys)
      productName: catalog?.name ?? "Unknown product",
      sku: catalog?.sku ?? "",
      orderCount: p._count.id,
      totalQuantity: p._sum.quantity ?? 0,
      totalRevenue: p._sum.subtotal ?? 0,
      imageUrl: catalog?.imageUrl ?? null,
      categoryId: catalog?.categoryId ?? null,
      categoryName: catalog?.categoryId
        ? (topCategoryNameById.get(catalog.categoryId) ?? null)
        : null,
      supplierId: catalog?.supplierId ?? null,
      supplierName: supplier?.name ?? null,
      supplierImage: supplier?.userId
        ? (topUserImageById.get(supplier.userId) ?? null)
        : null,
    };
  });
  // Collapse any stale Redis rows still split by name/sku snapshot (pre-fix)
  const topProductsById = new Map<string, DashboardTopProduct>();
  for (const row of topProductsMerged) {
    const prev = topProductsById.get(row.productId);
    if (!prev) {
      topProductsById.set(row.productId, row);
      continue;
    }
    topProductsById.set(row.productId, {
      ...prev,
      orderCount: prev.orderCount + row.orderCount,
      totalQuantity: prev.totalQuantity + row.totalQuantity,
      totalRevenue: prev.totalRevenue + row.totalRevenue,
    });
  }
  const topProducts = [...topProductsById.values()].sort(
    (a, b) => b.orderCount - a.orderCount,
  );

  // Calculate average order value (all orders for backward compatibility)
  const totalOrderRevenue = Number(orderSum._sum.total ?? 0);
  const averageOrderValue =
    ordersCount > 0 ? totalOrderRevenue / ordersCount : 0;

  const totalRevenueExcludingCancelled = Number(
    orderSumNonCancelled._sum.total ?? 0,
  );
  const moneyStats = buildPaymentMoneyStats(invoiceMoneyRows);

  const orderAnalytics: DashboardOrderAnalytics = {
    statusDistribution,
    topProducts,
    averageOrderValue,
    totalRevenue: totalOrderRevenue,
    totalRevenueExcludingCancelled,
    pendingOrderAmount: moneyStats.pendingUnpaidDue,
    paidOrderAmount: moneyStats.paidCollected,
    partialOrderAmount: moneyStats.partialCollected,
    refundedAmount: Number(orderRefundedSum._sum.total ?? 0),
    refundedCount: orderRefundedCount,
    cancelledOrderAmount: Number(orderSumCancelled?._sum?.total ?? 0),
  };

  // Build invoice status distribution and analytics
  const invoiceStatusDistribution: DashboardInvoiceStatusDist = {
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
  };
  let overdueAmount = 0;
  let cancelledInvoiceSum = 0;

  for (const g of invoiceStatusGroups) {
    const status = g.status as keyof DashboardInvoiceStatusDist;
    if (status in invoiceStatusDistribution) {
      invoiceStatusDistribution[status] = g._count.id;
    }
    if (status === "overdue") {
      overdueAmount += Number(g._sum.amountDue ?? 0);
    } else if (status === "cancelled") {
      cancelledInvoiceSum += Number(g._sum.total ?? 0);
    }
  }

  const totalInvoiceRevenue = Number(invoiceSum._sum.total ?? 0);
  const totalExcludingCancelled = totalInvoiceRevenue - cancelledInvoiceSum;
  const averageInvoiceValue =
    invoicesCount > 0 ? totalInvoiceRevenue / invoicesCount : 0;
  const nonCancelledCount =
    invoicesCount - (invoiceStatusDistribution.cancelled ?? 0);
  const avgExcludingCancelled =
    nonCancelledCount > 0 ? totalExcludingCancelled / nonCancelledCount : 0;

  const invoiceAnalytics: DashboardInvoiceAnalytics = {
    statusDistribution: invoiceStatusDistribution,
    totalRevenue: totalInvoiceRevenue,
    totalExcludingCancelled,
    cancelledInvoiceSum,
    paidRevenue: moneyStats.paidCollected,
    outstandingAmount: moneyStats.dueOutstanding,
    overdueAmount,
    averageInvoiceValue,
    averageInvoiceValueExcludingCancelled: avgExcludingCancelled,
    partialCount: moneyStats.partialInvoiceCount,
    pendingCount: moneyStats.pendingInvoiceCount,
  };

  // Build warehouse analytics
  const warehouseTypeDistribution = warehouseTypeGroups.map((g) => ({
    type: g.type || "(Unspecified)",
    count: g._count.id,
  }));

  const warehouseAnalytics: DashboardWarehouseAnalytics = {
    totalWarehouses: warehousesCount,
    activeWarehouses: activeWarehousesCount,
    inactiveWarehouses: inactiveWarehousesCount,
    typeDistribution: warehouseTypeDistribution,
  };

  const selfOrderCount = selfOrderIds.length;
  const revenueSelf = Number(orderRevenueSelfSum?._sum?.total ?? 0);
  const selfOthersBreakdown: DashboardSelfOthersBreakdown = {
    orderSelfCount: selfOrderCount,
    orderOthersCount: ordersCount - selfOrderCount,
    invoiceSelfCount:
      typeof selfInvoiceCount === "number" ? selfInvoiceCount : 0,
    invoiceOthersCount:
      invoicesCount -
      (typeof selfInvoiceCount === "number" ? selfInvoiceCount : 0),
    revenueSelf,
    revenueOthers: totalRevenueExcludingCancelled - revenueSelf,
  };

  const result: DashboardStats = {
    counts,
    revenue,
    trends,
    recent,
    orderAnalytics,
    invoiceAnalytics,
    warehouseAnalytics,
    totalInventoryValue,
    productStatusBreakdown,
    userRoleBreakdown,
    supplierStatusBreakdown,
    categoryStatusBreakdown,
    ticketStatusBreakdown,
    reviewStatusBreakdown,
    selfOthersBreakdown,
  };
  await setCache(cacheKey, result, 300, { fetchedAt: cacheReadStartedAt });
  return result;
}
