/**
 * REQ-0088 — seed connected demo catalog after demo users exist.
 * Creates categories, warehouses, products, allocations, and a sample paid order + invoice.
 */

import type { PrismaClient } from "@prisma/client";
import { DEMO_CATALOG_SEED } from "@/lib/auth/demo-seed-data";

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
  orderId: string;
  invoiceId: string;
};

/** Insert demo catalog rows owned by admin and linked to Test Supplier. */
export async function seedDemoCatalog(
  prisma: PrismaClient,
  ids: DemoSeedUserIds,
): Promise<DemoCatalogSeedResult> {
  const now = new Date();
  const { adminId, clientId, demoSupplierId } = ids;

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
        reservedQuantity: BigInt(0),
        status: spec.status,
        categoryId,
        supplierId: demoSupplierId,
        userId: adminId,
        createdBy: adminId,
        updatedBy: adminId,
        expirationDate: new Date(spec.expirationDate),
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, sku: true },
    });
    productIds.push(row.id);
    productBySku.set(row.sku, row.id);
  }

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

  let orderId = "";
  let invoiceId = "";

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
    const total = subtotal + spec.tax;
    const orderDate = new Date(spec.orderDate);

    const order = await prisma.order.create({
      data: {
        orderNumber: spec.orderNumber,
        userId: adminId,
        clientId,
        status: spec.status,
        paymentStatus: spec.paymentStatus,
        subtotal,
        tax: spec.tax > 0 ? spec.tax : null,
        total,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: orderDate,
        updatedAt: orderDate,
        deliveredAt: orderDate,
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
      select: { id: true },
    });
    orderId = order.id;

    const dueDate = new Date(orderDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: spec.invoiceNumber,
        orderId: order.id,
        userId: adminId,
        clientId,
        status: spec.invoiceStatus,
        subtotal,
        tax: spec.tax > 0 ? spec.tax : null,
        total,
        amountPaid: total,
        amountDue: 0,
        dueDate,
        issuedAt: orderDate,
        paidAt: orderDate,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: orderDate,
        updatedAt: orderDate,
      },
      select: { id: true },
    });
    invoiceId = invoice.id;
  }

  return {
    categoryIds,
    warehouseIds,
    productIds,
    orderId,
    invoiceId,
  };
}
