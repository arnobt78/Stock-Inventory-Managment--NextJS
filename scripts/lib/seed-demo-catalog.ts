/**
 * REQ-0088 / REQ-0137 — seed connected explore catalog after demo users exist.
 * Covers user-facing entities (1–2 rows) plus stub schema models for completeness.
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import {
  DEMO_CATALOG_SEED,
  DEMO_LOCAL_SUPPLIER_ENTITY,
} from "@/lib/auth/demo-seed-data";

export type DemoSeedUserIds = {
  adminId: string;
  clientId: string;
  supplierUserId: string;
  demoSupplierId: string;
};

export type DemoCatalogSeedResult = {
  categoryIds: string[];
  warehouseIds: string[];
  productIds: string[];
  localSupplierId: string;
  orderIds: string[];
  invoiceIds: string[];
  ticketIds: string[];
  reviewIds: string[];
  notificationIds: string[];
  transferIds: string[];
  importIds: string[];
  systemConfigIds: string[];
  auditIds: string[];
  stubCounts: Record<string, number>;
};

/** Insert demo explore rows owned by admin / client / Test Supplier. */
export async function seedDemoCatalog(
  prisma: PrismaClient,
  ids: DemoSeedUserIds,
): Promise<DemoCatalogSeedResult> {
  const now = new Date();
  const { adminId, clientId, supplierUserId, demoSupplierId } = ids;
  const address = DEMO_CATALOG_SEED.demoAddress as unknown as Prisma.InputJsonValue;

  // --- Extra editable supplier (admin-owned) ---
  const localSupplier = await prisma.supplier.create({
    data: {
      name: DEMO_LOCAL_SUPPLIER_ENTITY.name,
      description: DEMO_LOCAL_SUPPLIER_ENTITY.description,
      notes: DEMO_LOCAL_SUPPLIER_ENTITY.notes,
      status: DEMO_LOCAL_SUPPLIER_ENTITY.status,
      userId: adminId,
      createdBy: adminId,
      updatedBy: adminId,
      createdAt: now,
      updatedAt: now,
    },
    select: { id: true },
  });

  const supplierIdByKey = {
    demo: demoSupplierId,
    local: localSupplier.id,
  } as const;

  // --- Categories ---
  const categoryIds: string[] = [];
  const categoryByName = new Map<string, string>();
  for (const spec of DEMO_CATALOG_SEED.categories) {
    const row = await prisma.category.create({
      data: {
        name: spec.name,
        description: spec.description,
        notes: spec.notes,
        status: spec.status,
        userId: adminId,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, name: true },
    });
    categoryIds.push(row.id);
    categoryByName.set(row.name, row.id);
  }

  // --- Warehouses ---
  const warehouseIds: string[] = [];
  const warehouseByName = new Map<string, string>();
  for (const spec of DEMO_CATALOG_SEED.warehouses) {
    const row = await prisma.warehouse.create({
      data: {
        name: spec.name,
        address: spec.address,
        type: spec.type,
        status: spec.status,
        userId: adminId,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, name: true },
    });
    warehouseIds.push(row.id);
    warehouseByName.set(row.name, row.id);
  }

  // --- Products ---
  const productIds: string[] = [];
  const productBySku = new Map<string, string>();
  for (const spec of DEMO_CATALOG_SEED.products) {
    const categoryId = categoryByName.get(spec.categoryName);
    if (!categoryId) {
      throw new Error(`Demo seed: category not found: ${spec.categoryName}`);
    }
    const row = await prisma.product.create({
      data: {
        name: spec.name,
        sku: spec.sku,
        price: spec.price,
        quantity: BigInt(spec.quantity),
        reservedQuantity: BigInt(spec.reservedQuantity),
        status: spec.status,
        categoryId,
        supplierId: supplierIdByKey[spec.supplierKey],
        userId: adminId,
        createdBy: adminId,
        updatedBy: adminId,
        expirationDate: new Date(spec.expirationDate),
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, sku: true, name: true },
    });
    productIds.push(row.id);
    productBySku.set(row.sku, row.id);
  }

  // --- Stock allocations ---
  for (const spec of DEMO_CATALOG_SEED.allocations) {
    const productId = productBySku.get(spec.productSku);
    const warehouseId = warehouseByName.get(spec.warehouseName);
    if (!productId || !warehouseId) {
      throw new Error(
        `Demo seed: allocation refs missing for ${spec.productSku} / ${spec.warehouseName}`,
      );
    }
    await prisma.stockAllocation.create({
      data: {
        productId,
        warehouseId,
        quantity: BigInt(spec.quantity),
        reservedQuantity: BigInt(spec.reservedQuantity),
        userId: adminId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  // --- Orders + invoices ---
  const orderIds: string[] = [];
  const invoiceIds: string[] = [];
  const orderIdByNumber = new Map<string, string>();
  const orderItemIdByOrderNumber = new Map<string, string>();

  for (const spec of DEMO_CATALOG_SEED.orders) {
    const productId = productBySku.get(spec.productSku);
    const warehouseId = warehouseByName.get(spec.warehouseName);
    if (!productId || !warehouseId) {
      throw new Error(`Demo seed: order refs missing for ${spec.productSku}`);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true },
    });
    if (!product) {
      throw new Error(`Demo seed: product missing ${spec.productSku}`);
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { name: true },
    });

    const subtotal = spec.unitPrice * spec.quantity;
    const total =
      subtotal + spec.tax + spec.shipping - spec.discount;
    const orderDate = new Date(spec.orderDate);
    const isPaid = spec.paymentStatus === "paid";
    const isDelivered = spec.status === "delivered";

    const order = await prisma.order.create({
      data: {
        orderNumber: spec.orderNumber,
        userId: adminId,
        clientId,
        status: spec.status,
        paymentStatus: spec.paymentStatus,
        subtotal,
        tax: spec.tax > 0 ? spec.tax : null,
        shipping: spec.shipping > 0 ? spec.shipping : null,
        discount: spec.discount > 0 ? spec.discount : null,
        total,
        notes: spec.notes,
        shippingAddress: address,
        billingAddress: address,
        trackingNumber: spec.trackingNumber ?? null,
        trackingCarrier: spec.trackingCarrier ?? null,
        trackingUrl: spec.trackingNumber
          ? `https://example.com/track/${spec.trackingNumber}`
          : null,
        shippedAt: isDelivered ? orderDate : null,
        deliveredAt: isDelivered ? orderDate : null,
        createdBy: clientId,
        updatedBy: adminId,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: {
            productId,
            productName: product.name,
            sku: product.sku,
            quantity: spec.quantity,
            price: spec.unitPrice,
            subtotal,
            warehouseId,
            warehouseName: warehouse?.name ?? spec.warehouseName,
            createdAt: orderDate,
          },
        },
      },
      select: {
        id: true,
        items: { select: { id: true }, take: 1 },
      },
    });

    orderIds.push(order.id);
    orderIdByNumber.set(spec.orderNumber, order.id);
    if (order.items[0]?.id) {
      orderItemIdByOrderNumber.set(spec.orderNumber, order.items[0].id);
    }

    const dueDate = new Date(orderDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const invoicePaid = spec.invoiceStatus === "paid";

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: spec.invoiceNumber,
        orderId: order.id,
        userId: adminId,
        clientId,
        status: spec.invoiceStatus,
        subtotal,
        tax: spec.tax > 0 ? spec.tax : null,
        shipping: spec.shipping > 0 ? spec.shipping : null,
        discount: spec.discount > 0 ? spec.discount : null,
        total,
        amountPaid: invoicePaid ? total : 0,
        amountDue: invoicePaid ? 0 : total,
        dueDate,
        issuedAt: orderDate,
        sentAt: orderDate,
        paidAt: invoicePaid ? orderDate : null,
        notes: `Demo invoice for ${spec.orderNumber}`,
        billingAddress: address,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: orderDate,
        updatedAt: orderDate,
      },
      select: { id: true },
    });
    invoiceIds.push(invoice.id);
    void isPaid;
  }

  // --- Stock transfers ---
  const transferIds: string[] = [];
  for (const spec of DEMO_CATALOG_SEED.transfers) {
    const productId = productBySku.get(spec.productSku);
    const fromWarehouseId = warehouseByName.get(spec.fromWarehouseName);
    const toWarehouseId = warehouseByName.get(spec.toWarehouseName);
    if (!productId || !fromWarehouseId || !toWarehouseId) {
      throw new Error(`Demo seed: transfer refs missing for ${spec.productSku}`);
    }
    const row = await prisma.stockTransfer.create({
      data: {
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity: BigInt(spec.quantity),
        status: spec.status,
        notes: spec.notes,
        userId: adminId,
        createdAt: now,
        completedAt: spec.status === "completed" ? now : null,
      },
      select: { id: true },
    });
    transferIds.push(row.id);
  }

  // --- Support tickets + replies ---
  const ticketIds: string[] = [];
  for (const spec of DEMO_CATALOG_SEED.tickets) {
    const productId = spec.productSku
      ? productBySku.get(spec.productSku)
      : undefined;
    const ticket = await prisma.supportTicket.create({
      data: {
        subject: spec.subject,
        description: spec.description,
        status: spec.status,
        priority: spec.priority,
        userId: clientId,
        assignedToId: adminId,
        productId: productId ?? null,
        notes: "Demo ticket seed",
        createdAt: now,
        updatedAt: now,
        ...(spec.replyBody
          ? {
              replies: {
                create: {
                  userId: adminId,
                  body: spec.replyBody,
                  createdAt: now,
                },
              },
            }
          : {}),
      },
      select: { id: true },
    });
    ticketIds.push(ticket.id);
  }

  // --- Product reviews ---
  const reviewIds: string[] = [];
  for (const spec of DEMO_CATALOG_SEED.reviews) {
    const productId = productBySku.get(spec.productSku);
    const orderId = orderIdByNumber.get(spec.orderNumber);
    const orderItemId = orderItemIdByOrderNumber.get(spec.orderNumber);
    if (!productId || !orderId) {
      throw new Error(
        `Demo seed: review refs missing for ${spec.productSku} / ${spec.orderNumber}`,
      );
    }
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true },
    });
    if (!product) continue;

    const row = await prisma.productReview.create({
      data: {
        productId,
        userId: clientId,
        orderId,
        orderItemId: orderItemId ?? null,
        productName: product.name,
        productSku: product.sku,
        rating: spec.rating,
        comment: spec.comment,
        status: spec.status,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });
    reviewIds.push(row.id);
  }

  // --- Notifications ---
  const notificationIds: string[] = [];
  const roleToUserId: Record<string, string> = {
    admin: adminId,
    client: clientId,
    supplier: supplierUserId,
  };
  for (const spec of DEMO_CATALOG_SEED.notifications) {
    const userId = roleToUserId[spec.role];
    if (!userId) continue;
    const row = await prisma.notification.create({
      data: {
        userId,
        type: spec.type,
        title: spec.title,
        message: spec.message,
        link: spec.link,
        read: spec.read,
        readAt: spec.read ? now : null,
        createdAt: now,
        metadata: { source: "demo-seed" } as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    notificationIds.push(row.id);
  }

  // --- Import history ---
  const importIds: string[] = [];
  for (const spec of DEMO_CATALOG_SEED.imports) {
    const row = await prisma.importHistory.create({
      data: {
        userId: adminId,
        importType: spec.importType,
        fileName: spec.fileName,
        fileSize: spec.fileSize,
        totalRows: spec.totalRows,
        successRows: spec.successRows,
        failedRows: spec.failedRows,
        errors:
          spec.failedRows > 0
            ? (["Row 2: demo validation error"] as unknown as Prisma.InputJsonValue)
            : undefined,
        status: spec.status,
        createdAt: now,
        completedAt: now,
      },
      select: { id: true },
    });
    importIds.push(row.id);
  }

  // --- System config ---
  const systemConfigIds: string[] = [];
  for (const spec of DEMO_CATALOG_SEED.systemConfigs) {
    const row = await prisma.systemConfig.create({
      data: {
        key: spec.key,
        value: spec.value,
        type: spec.type,
        label: spec.label,
        description: spec.description,
        category: spec.category,
        isPublic: spec.isPublic,
        createdAt: now,
        updatedAt: now,
        updatedBy: adminId,
      },
      select: { id: true },
    });
    systemConfigIds.push(row.id);
  }

  // --- Audit logs ---
  const auditIds: string[] = [];
  for (const spec of DEMO_CATALOG_SEED.audits) {
    const row = await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: spec.action,
        entityType: spec.entityType,
        entityId: productIds[0] ?? null,
        details: spec.details as Prisma.InputJsonValue,
        ipAddress: "127.0.0.1",
        userAgent: "demo-seed/REQ-0137",
        createdAt: now,
      },
      select: { id: true },
    });
    auditIds.push(row.id);
  }

  // --- Stub schema models (empty shells; no UI pages) ---
  const stubCounts: Record<string, number> = {};
  await prisma.department.create({ data: {} });
  stubCounts.Department = 1;
  await prisma.stockAlert.create({ data: {} });
  stubCounts.StockAlert = 1;
  await prisma.userAction.create({ data: {} });
  stubCounts.UserAction = 1;
  await prisma.session.create({
    data: { sessionToken: { demo: "seed-session" } },
  });
  stubCounts.Session = 1;
  await prisma.verificationToken.create({
    data: { token: { demo: "seed-token" } },
  });
  stubCounts.VerificationToken = 1;
  await prisma.permission.create({
    data: {
      userId: { demoUserId: adminId },
      resource: { name: "demo.explore" },
    },
  });
  stubCounts.Permission = 1;

  return {
    categoryIds,
    warehouseIds,
    productIds,
    localSupplierId: localSupplier.id,
    orderIds,
    invoiceIds,
    ticketIds,
    reviewIds,
    notificationIds,
    transferIds,
    importIds,
    systemConfigIds,
    auditIds,
    stubCounts,
  };
}
