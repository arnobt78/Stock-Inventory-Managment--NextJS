/**
 * Order Prisma Utilities
 * Helper functions for order database operations
 */

import { prisma } from "@/prisma/client";
import { createStripeRefund } from "@/lib/stripe";
import type { Prisma } from "@prisma/client";
import type { CreateOrderInput, UpdateOrderInput } from "@/types/order";
import { invalidateCache, cacheKeys } from "@/lib/cache";
import { decrementStockAllocations } from "@/lib/products/decrement-stock-allocations";
import {
  fulfillPendingOrderLines,
  releasePendingOrderLines,
  reservePendingOrderLines,
} from "@/lib/products/order-stock-reservation";
import { getOrderLineCatalogAvailable } from "@/lib/orders/order-line-stock-validation";
import {
  productRequiresWarehousePick,
  resolveWarehouseName,
  validateWarehousePick,
  syncRestoreConfirmedOrderAllocations,
  syncFulfillReactivatedOrderAllocations,
} from "@/lib/products/stock-allocation-order-sync";
import { logger } from "@/lib/logger";

/**
 * Generate unique order number
 * Format: ORD-YYYY-MMDD-HHMMSS-XXXX (e.g., ORD-2024-0116-143022-0001)
 *
 * @returns Promise<string> - Unique order number
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Check for existing orders today to generate sequential number
  const todayStart = new Date(year, now.getMonth(), now.getDate());
  const todayEnd = new Date(year, now.getMonth(), now.getDate() + 1);

  const todayOrders = await prisma.order.count({
    where: {
      createdAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
  });

  const sequence = String(todayOrders + 1).padStart(4, "0");
  return `ORD-${year}-${month}${day}-${hours}${minutes}${seconds}-${sequence}`;
}

/** REQ-0158 — party fields for order create (store owner ≠ always session). */
export type CreateOrderParty = {
  storeOwnerUserId: string;
  createdByUserId: string;
  /** Buyer; null = owner self-order */
  clientId: string | null;
};

/**
 * Create a new order with order items
 * Includes validation and automatic calculations
 *
 * REQ-0158: `userId` = store owner; `clientId` = buyer (null = self); `createdBy` = actor.
 */
export async function createOrder(
  data: CreateOrderInput,
  party: CreateOrderParty,
) {
  // Generate unique order number
  const orderNumber = await generateOrderNumber();

  // Calculate totals
  let subtotal = 0;
  const orderItemsData = [];

  // Fetch products and calculate line items
  const productsToReserve: {
    id: string;
    qty: number;
    warehouseId: string | null;
  }[] = [];

  for (const item of data.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product || product.deletedAt != null) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const price = Number(product.price);
    const lineSubtotal = price * item.quantity;
    subtotal += lineSubtotal;

    const ownerUserId = product.userId;
    const needsPick = await productRequiresWarehousePick(
      item.productId,
      ownerUserId,
    );

    const productReserved = Number(product.reservedQuantity ?? 0);
    const productQty = Number(product.quantity);
    let availableStock: number;

    if (needsPick) {
      // REQ-0111 — live DB rows; client uses TanStack cache + committedQuantity fallback
      const allocationRows = await prisma.stockAllocation.findMany({
        where: { productId: item.productId },
        select: { reservedQuantity: true },
      });
      availableStock = getOrderLineCatalogAvailable(
        productQty,
        productReserved,
        allocationRows.map((row) => ({
          reservedQuantity: Number(row.reservedQuantity ?? 0),
        })),
      );
    } else {
      availableStock = productQty - productReserved;
    }

    if (availableStock < item.quantity) {
      throw new Error(
        `Insufficient stock for product ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`,
      );
    }

    let warehouseId: string | null = item.warehouseId ?? null;
    let warehouseName: string | null = null;

    if (needsPick) {
      if (warehouseId) {
        await validateWarehousePick(item.productId, warehouseId, item.quantity);
        warehouseName = await resolveWarehouseName(warehouseId, ownerUserId);
        if (!warehouseName) {
          throw new Error(`Warehouse not found or unauthorized: ${warehouseId}`);
        }
      } else {
        // REQ-0106 — auto-assign: reserve on product path; fulfill greedily across warehouses
        warehouseId = null;
      }
    } else {
      warehouseId = null;
    }

    orderItemsData.push({
      productId: item.productId,
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      price,
      subtotal: lineSubtotal,
      warehouseId,
      warehouseName,
    });

    productsToReserve.push({
      id: item.productId,
      qty: item.quantity,
      warehouseId,
    });
  }

  // Calculate total
  const tax = data.tax || 0;
  const shipping = data.shipping || 0;
  const discount = data.discount || 0;
  const total = subtotal + tax + shipping - discount;

  // Create order with items (REQ-0158 party semantics)
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: party.storeOwnerUserId,
      clientId: party.clientId,
      status: "pending",
      paymentStatus: "unpaid",
      subtotal,
      tax: tax > 0 ? tax : null,
      shipping: shipping > 0 ? shipping : null,
      discount: discount > 0 ? discount : null,
      total,
      shippingAddress: data.shippingAddress
        ? (JSON.parse(
            JSON.stringify(data.shippingAddress),
          ) as Prisma.InputJsonValue)
        : null,
      billingAddress: data.billingAddress
        ? (JSON.parse(
            JSON.stringify(data.billingAddress),
          ) as Prisma.InputJsonValue)
        : null,
      notes: data.notes || null,
      createdBy: party.createdByUserId,
      items: {
        create: orderItemsData,
      },
    },
    include: {
      items: true,
    },
  });

  // REQ-0103 — disjoint reserve: allocation OR product, never both
  await reservePendingOrderLines(
    productsToReserve.map((p) => ({
      productId: p.id,
      quantity: p.qty,
      warehouseId: p.warehouseId,
    })),
  );

  // Invalidate product + allocation cache so UI shows updated reserved stock
  await Promise.all([
    invalidateCache(cacheKeys.products.pattern),
    invalidateCache(cacheKeys.stockAllocation.pattern),
  ]).catch((error) => {
    console.error(
      "Failed to invalidate product cache after order creation:",
      error,
    );
  });

  return order;
}

/**
 * Get Self orders for a store owner (personal /orders list).
 * REQ-0158: userId = owner AND (clientId null OR clientId = owner).
 * Client-buyer orders on the same store are excluded (see /admin/orders merge).
 *
 * @param userId - Store owner user ID
 * @returns Promise<Order[]> - Array of self orders
 */
export async function getOrdersByUser(userId: string) {
  return prisma.order.findMany({
    where: {
      userId,
      OR: [{ clientId: null }, { clientId: userId }],
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get order by ID
 * Fetches a single order with all details
 *
 * @param orderId - Order ID
 * @param userId - User ID (for authorization check)
 * @returns Promise<Order | null> - Order or null if not found
 */
export async function getOrderById(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId, // Ensure user can only access their own orders
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              userId: true,
              categoryId: true,
              supplierId: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get orders by client ID (for client role: orders where they are the customer)
 */
export async function getOrdersByClientId(clientId: string) {
  return prisma.order.findMany({
    where: { clientId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              userId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get orders that contain at least one product from the given supplier.
 * Used for role=supplier: "View Orders" = orders that include their products (from any client/admin).
 */
export async function getOrdersContainingSupplierProducts(supplierId: string) {
  const orderIds = await prisma.orderItem.findMany({
    where: {
      product: {
        supplierId,
      },
    },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  const ids = orderIds.map((o) => o.orderId);
  if (ids.length === 0) {
    return [];
  }
  return prisma.order.findMany({
    where: { id: { in: ids } },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              userId: true,
              supplierId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get orders that contain at least one product owned by the given user (product owner).
 * Used for admin "Client Orders": orders placed by others that include my products.
 */
export async function getOrdersContainingProductOwnerProducts(
  productOwnerUserId: string,
) {
  const orderIds = await prisma.orderItem.findMany({
    where: {
      product: {
        userId: productOwnerUserId,
      },
    },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  const ids = orderIds.map((o) => o.orderId);
  if (ids.length === 0) {
    return [];
  }
  return prisma.order.findMany({
    where: { id: { in: ids } },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              userId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get order by ID for admin (any order by id).
 */
export async function getOrderByIdForAdmin(orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              userId: true,
              categoryId: true,
              supplierId: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get order by ID for product owner (only if order contains at least one product owned by this user).
 */
export async function getOrderByIdForProductOwner(
  orderId: string,
  productOwnerUserId: string,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              userId: true,
              categoryId: true,
              supplierId: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });
  if (!order) return null;
  const hasMyProduct = order.items.some(
    (item) => item.product.userId === productOwnerUserId,
  );
  return hasMyProduct ? order : null;
}

/**
 * Get order by ID for client (only if order.clientId === clientId)
 */
export async function getOrderByIdForClient(orderId: string, clientId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      clientId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              categoryId: true,
              supplierId: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get order by ID for supplier (only if order contains at least one product from this supplier).
 */
export async function getOrderByIdForSupplier(
  orderId: string,
  supplierId: string,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              userId: true,
              supplierId: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });
  if (!order) return null;
  const hasSupplierProduct = order.items.some(
    (item) => item.product.supplierId === supplierId,
  );
  return hasSupplierProduct ? order : null;
}

/**
 * Update order
 * Updates order fields and manages status transitions
 *
 * @param orderId - Order ID
 * @param data - Update data
 * @param userId - User ID (for authorization)
 * @returns Promise<Order> - Updated order
 */
export async function updateOrder(
  orderId: string,
  data: UpdateOrderInput,
  userId: string,
) {
  // Check if order exists and belongs to user
  const existingOrder = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!existingOrder) {
    throw new Error("Order not found or unauthorized");
  }

  // Prepare update data
  const updateData: {
    status?: string;
    paymentStatus?: string;
    shippingAddress?: Prisma.InputJsonValue;
    billingAddress?: Prisma.InputJsonValue;
    trackingNumber?: string;
    trackingCarrier?: string;
    trackingUrl?: string;
    estimatedDelivery?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    notes?: string;
    updatedAt: Date;
    updatedBy: string;
  } = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  // Update fields if provided
  if (data.status) updateData.status = data.status;
  if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;
  if (data.shippingAddress)
    updateData.shippingAddress = JSON.parse(
      JSON.stringify(data.shippingAddress),
    ) as Prisma.InputJsonValue;
  if (data.billingAddress)
    updateData.billingAddress = JSON.parse(
      JSON.stringify(data.billingAddress),
    ) as Prisma.InputJsonValue;
  if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
  if (data.trackingCarrier) updateData.trackingCarrier = data.trackingCarrier;
  if (data.trackingUrl) updateData.trackingUrl = data.trackingUrl;
  if (data.estimatedDelivery)
    updateData.estimatedDelivery = data.estimatedDelivery;
  if (data.shippedAt) updateData.shippedAt = data.shippedAt;
  if (data.deliveredAt) updateData.deliveredAt = data.deliveredAt;
  if (data.cancelledAt) updateData.cancelledAt = data.cancelledAt;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Get order items to check if we need to update stock
  const orderWithItems = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!orderWithItems) {
    throw new Error("Order not found");
  }

  // Track if stock needs to be adjusted based on status changes
  const previousStatus = existingOrder.status;
  const newStatus = updateData.status || previousStatus;
  const previousPaymentStatus = existingOrder.paymentStatus;
  const newPaymentStatus = updateData.paymentStatus || previousPaymentStatus;

  // Determine status categories
  const wasPending = previousStatus === "pending";
  const wasConfirmedOrPaid =
    previousStatus === "confirmed" ||
    previousStatus === "processing" ||
    previousStatus === "shipped" ||
    previousStatus === "delivered" ||
    previousPaymentStatus === "paid";
  const isConfirmedOrPaid =
    newStatus === "confirmed" ||
    newStatus === "processing" ||
    newStatus === "shipped" ||
    newStatus === "delivered" ||
    newPaymentStatus === "paid";

  // If order is being cancelled
  const isBeingCancelled =
    newStatus === "cancelled" && previousStatus !== "cancelled";

  // If order status/payment changes to confirmed/paid (only if not already confirmed/paid)
  const isBecomingConfirmedOrPaid = isConfirmedOrPaid && !wasConfirmedOrPaid;

  // If order was cancelled and is now being reactivated to confirmed/paid
  const isBeingReactivated =
    previousStatus === "cancelled" && isConfirmedOrPaid;

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              categoryId: true,
              supplierId: true,
              imageUrl: true, // REQ-0059: keep thumbnails stable after status updates
            },
          },
        },
      },
    },
  });

  // Handle stock adjustments based on status changes
  const allocationItems = orderWithItems.items.map((item) => ({
    productId: item.productId,
    warehouseId: item.warehouseId ?? null,
    quantity: item.quantity,
  }));

  if (isBeingCancelled) {
    if (wasConfirmedOrPaid) {
      // Order was confirmed/paid, now cancelled: restore actual stock
      for (const item of orderWithItems.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
          },
        });
      }
      try {
        await syncRestoreConfirmedOrderAllocations(allocationItems);
      } catch (error) {
        logger.warn("Failed to restore allocation stock on order cancel", {
          orderId,
          error,
        });
      }
    } else if (wasPending) {
      try {
        await releasePendingOrderLines(allocationItems);
      } catch (error) {
        logger.warn("Failed to release reservation on order cancel", {
          orderId,
          error,
        });
      }
    }
  } else if (isBecomingConfirmedOrPaid && wasPending) {
    try {
      await fulfillPendingOrderLines(allocationItems);
    } catch (error) {
      logger.warn("Failed to fulfill stock for order", {
        orderId,
        error,
      });
    }
  } else if (isBeingReactivated) {
    // Cancelled order being reactivated to confirmed/paid: deduct quantity only
    // (No reservation exists for cancelled orders)
    for (const item of orderWithItems.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: { decrement: item.quantity },
        },
      });
    }

    try {
      await syncFulfillReactivatedOrderAllocations(allocationItems);
      await decrementStockAllocations(
        orderWithItems.items
          .filter((item) => !item.warehouseId)
          .map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
      );
    } catch (error) {
      logger.warn("Failed to fulfill allocation stock on order reactivation", {
        orderId,
        error,
      });
    }
  }

  // Invalidate product + allocation cache to reflect stock changes
  if (
    (isBeingCancelled && wasConfirmedOrPaid) ||
    isBecomingConfirmedOrPaid ||
    isBeingReactivated ||
    (isBeingCancelled && wasPending)
  ) {
    await Promise.all([
      invalidateCache(cacheKeys.products.pattern),
      invalidateCache(cacheKeys.stockAllocation.pattern),
    ]).catch((error) => {
      // Log error but don't fail the request - cache invalidation is not critical
      console.error(
        "Failed to invalidate product cache after order update:",
        error,
      );
    });
  }

  return updatedOrder;
}

/**
 * Delete/Cancel order
 * Cancels an order (soft delete by setting cancelledAt)
 *
 * @param orderId - Order ID
 * @param userId - User ID (for authorization)
 * @returns Promise<Order> - Cancelled order
 */
export async function cancelOrder(orderId: string, userId: string) {
  // Check if order exists and belongs to user
  const existingOrder = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!existingOrder) {
    throw new Error("Order not found or unauthorized");
  }

  // Get order items before cancellation to restore stock
  const orderWithItems = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: true,
    },
  });

  if (!orderWithItems) {
    throw new Error("Order not found or unauthorized");
  }

  // Cancel order (soft delete)
  // If order was paid, set paymentStatus to "refunded" and trigger Stripe refund
  const wasPaid =
    orderWithItems.paymentStatus === "paid" ||
    orderWithItems.status === "confirmed" ||
    orderWithItems.status === "processing" ||
    orderWithItems.status === "shipped" ||
    orderWithItems.status === "delivered";

  // Fetch linked invoice (needed for Stripe refund + invoice cancel)
  const linkedInvoice = await prisma.invoice.findUnique({
    where: { orderId },
    select: { id: true, status: true, stripePaymentIntentId: true },
  });

  // Trigger Stripe refund when order was paid and we have a PaymentIntent ID
  if (wasPaid) {
    const paymentIntentId =
      orderWithItems.stripePaymentIntentId ??
      linkedInvoice?.stripePaymentIntentId;
    if (paymentIntentId) {
      try {
        await createStripeRefund(paymentIntentId, "requested_by_customer");
      } catch (refundErr) {
        // Log but don't fail - order will still be cancelled; admin can refund manually in Stripe
        console.error("Stripe refund failed during order cancellation:", refundErr);
      }
    }
  }

  const cancelledOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "cancelled",
      paymentStatus: wasPaid ? "refunded" : orderWithItems.paymentStatus,
      cancelledAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
    },
    include: {
      items: true,
    },
  });

  // Cancel linked invoice if it exists (so unpaid/outstanding stats update)
  if (linkedInvoice && linkedInvoice.status !== "cancelled") {
    await prisma.invoice.update({
      where: { id: linkedInvoice.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        amountDue: 0,
        updatedAt: new Date(),
      },
    });
  }

  // Handle stock based on previous order status
  const wasPending = orderWithItems.status === "pending";
  const wasConfirmedOrPaid =
    orderWithItems.status === "confirmed" ||
    orderWithItems.status === "processing" ||
    orderWithItems.status === "shipped" ||
    orderWithItems.status === "delivered" ||
    orderWithItems.paymentStatus === "paid";

  if (orderWithItems.status !== "cancelled") {
    const allocationItems = orderWithItems.items.map((item) => ({
      productId: item.productId,
      warehouseId: item.warehouseId ?? null,
      quantity: item.quantity,
    }));

    if (wasConfirmedOrPaid) {
      // Order was confirmed/paid: restore actual stock
      for (const item of orderWithItems.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
          },
        });
      }
      try {
        await syncRestoreConfirmedOrderAllocations(allocationItems);
      } catch (error) {
        logger.warn("Failed to restore allocation stock on cancelOrder", {
          orderId,
          error,
        });
      }
    } else if (wasPending) {
      try {
        await releasePendingOrderLines(allocationItems);
      } catch (error) {
        logger.warn("Failed to release reservation on cancelOrder", {
          orderId,
          error,
        });
      }
    }
  }

  // Invalidate product + allocation cache
  await Promise.all([
    invalidateCache(cacheKeys.products.pattern),
    invalidateCache(cacheKeys.stockAllocation.pattern),
  ]).catch((error) => {
    // Log error but don't fail the request - cache invalidation is not critical
    console.error(
      "Failed to invalidate product cache after order cancellation:",
      error,
    );
  });

  return cancelledOrder;
}
