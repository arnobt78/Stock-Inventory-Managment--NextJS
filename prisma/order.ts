/**
 * Order Prisma Utilities
 * Helper functions for order database operations
 */

import { prisma } from "@/prisma/client";
import { createStripeRefund } from "@/lib/stripe";
import type { Prisma } from "@prisma/client";
import type { CreateOrderInput, UpdateOrderInput } from "@/types/order";
import { invalidateCache, cacheKeys } from "@/lib/cache";

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

/**
 * Create a new order with order items
 * Includes validation and automatic calculations
 *
 * @param data - Order creation data
 * @param userId - User ID creating the order
 * @returns Promise<Order> - Created order with items
 */
export async function createOrder(data: CreateOrderInput, userId: string) {
  // Generate unique order number
  const orderNumber = await generateOrderNumber();

  // Calculate totals
  let subtotal = 0;
  const orderItemsData = [];

  // Fetch products and calculate line items
  const productsToReserve: { id: string; qty: number }[] = [];

  for (const item of data.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product || product.deletedAt != null) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    // Check available stock (total quantity minus already reserved)
    const availableStock =
      Number(product.quantity) - Number(product.reservedQuantity ?? 0);
    if (availableStock < item.quantity) {
      throw new Error(
        `Insufficient stock for product ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`,
      );
    }

    const price = Number(product.price);
    const lineSubtotal = price * item.quantity;
    subtotal += lineSubtotal;

    orderItemsData.push({
      productId: item.productId,
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      price,
      subtotal: lineSubtotal,
    });

    productsToReserve.push({ id: item.productId, qty: item.quantity });
  }

  // Calculate total
  const tax = data.tax || 0;
  const shipping = data.shipping || 0;
  const discount = data.discount || 0;
  const total = subtotal + tax + shipping - discount;

  // Create order with items
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      clientId: data.clientId || null,
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
      createdBy: userId,
      items: {
        create: orderItemsData,
      },
    },
    include: {
      items: true,
    },
  });

  // Reserve stock for pending orders (increment reservedQuantity)
  // Stock will be deducted (quantity reduced, reserved released) when order is confirmed/paid
  for (const p of productsToReserve) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        reservedQuantity: { increment: p.qty },
      },
    });
  }

  // Invalidate product cache so UI shows updated reserved stock
  await invalidateCache(cacheKeys.products.pattern).catch((error) => {
    console.error(
      "Failed to invalidate product cache after order creation:",
      error,
    );
  });

  return order;
}

/**
 * Get orders by user ID
 * Fetches all orders created by a specific user
 *
 * @param userId - User ID
 * @returns Promise<Order[]> - Array of orders
 */
export async function getOrdersByUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
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
              imageUrl: true, // REQ-0059: line-item thumbnails on detail pages
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
              imageUrl: true, // REQ-0059: line-item thumbnails on detail pages
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
              imageUrl: true, // REQ-0059: line-item thumbnails on detail pages
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
              imageUrl: true, // REQ-0059: line-item thumbnails on detail pages
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
              imageUrl: true, // REQ-0059: line-item thumbnails on detail pages
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
    } else if (wasPending) {
      // Order was pending, now cancelled: release reserved stock only
      for (const item of orderWithItems.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            reservedQuantity: { decrement: item.quantity },
          },
        });
      }
    }
  } else if (isBecomingConfirmedOrPaid && wasPending) {
    // Pending order becoming confirmed/paid: deduct quantity AND release reservation
    for (const item of orderWithItems.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: { decrement: item.quantity },
          reservedQuantity: { decrement: item.quantity },
        },
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
  }

  // Invalidate product cache to reflect stock changes
  if (
    (isBeingCancelled && wasConfirmedOrPaid) ||
    isBecomingConfirmedOrPaid ||
    isBeingReactivated
  ) {
    await invalidateCache(cacheKeys.products.pattern).catch((error) => {
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
    } else if (wasPending) {
      // Order was pending: release reserved stock
      for (const item of orderWithItems.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            reservedQuantity: { decrement: item.quantity },
          },
        });
      }
    }
  }

  // Invalidate product cache so product table and product detail show correct quantity
  // (after restore for confirmed/paid orders, or to clear any stale cache for pending cancels)
  await invalidateCache(cacheKeys.products.pattern).catch((error) => {
    // Log error but don't fail the request - cache invalidation is not critical
    console.error(
      "Failed to invalidate product cache after order cancellation:",
      error,
    );
  });

  return cancelledOrder;
}
