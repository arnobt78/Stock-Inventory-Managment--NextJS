/**
 * Order Detail API Route Handler
 * App Router route handler for individual order operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  getOrderById,
  getOrderByIdForAdmin,
  getOrderByIdForClient,
  getOrderByIdForSupplier,
  getOrderByIdForProductOwner,
  updateOrder,
  cancelOrder,
} from "@/prisma/order";
import { getSupplierByUserId } from "@/prisma/supplier";
import { prisma } from "@/prisma/client";
import { updateOrderSchema } from "@/lib/validations";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { sendOrderStatusUpdate } from "@/lib/email/notifications";
import { createOrderNotification } from "@/lib/notifications/in-app";
import { createAuditLog } from "@/prisma/audit-log";
import { getOrderDetailForPage } from "@/lib/server/order-detail-data";

/**
 * GET /api/orders/:id
 * Get order details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Rate limiting check
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transformedOrder = await getOrderDetailForPage(
      { id: session.id, role: session.role },
      id,
    );

    if (!transformedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(transformedOrder);
  } catch (error) {
    logger.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/orders/:id
 * Update order
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Rate limiting check
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.id;
    const body = await request.json();

    // Validate request body
    const validationResult = updateOrderSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid order update data", {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const updateData = validationResult.data;

    // Get existing order to track status changes.
    // Admin can update any order (including client orders); other roles
    // can only update their own orders or orders linked to their products.
    const isAdmin = session.role === "admin";
    let existingOrder: Awaited<ReturnType<typeof getOrderById>> | null;
    if (isAdmin) {
      existingOrder = await getOrderByIdForAdmin(id);
    } else {
      existingOrder = await getOrderById(id, userId);
      if (!existingOrder) {
        existingOrder = await getOrderByIdForProductOwner(id, userId);
      }
    }
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Prepare update data with proper date conversions
    // Note: We use a more flexible type here since updateOrder accepts Record<string, unknown>
    const updatePayload: Record<string, unknown> = {};

    if (updateData.status) updatePayload.status = updateData.status;
    if (updateData.paymentStatus)
      updatePayload.paymentStatus = updateData.paymentStatus;
    if (updateData.shippingAddress)
      updatePayload.shippingAddress = updateData.shippingAddress as Record<
        string,
        unknown
      >;
    if (updateData.billingAddress)
      updatePayload.billingAddress = updateData.billingAddress as Record<
        string,
        unknown
      >;
    if (updateData.trackingNumber)
      updatePayload.trackingNumber = updateData.trackingNumber;
    if (updateData.trackingUrl && updateData.trackingUrl !== "")
      updatePayload.trackingUrl = updateData.trackingUrl;
    if (updateData.estimatedDelivery && updateData.estimatedDelivery !== "")
      updatePayload.estimatedDelivery = new Date(updateData.estimatedDelivery);
    if (updateData.shippedAt && updateData.shippedAt !== "")
      updatePayload.shippedAt = new Date(updateData.shippedAt);
    if (updateData.deliveredAt && updateData.deliveredAt !== "")
      updatePayload.deliveredAt = new Date(updateData.deliveredAt);
    if (updateData.cancelledAt && updateData.cancelledAt !== "")
      updatePayload.cancelledAt = new Date(updateData.cancelledAt);
    if (updateData.notes !== undefined) updatePayload.notes = updateData.notes;

    // Update order — for admin, use the order's own userId so the
    // Prisma updateOrder filter matches.
    const order = await updateOrder(id, updatePayload, isAdmin ? existingOrder.userId : userId);

    const auditDetails: Record<string, unknown> = {};
    if (existingOrder.orderNumber) auditDetails.orderNumber = existingOrder.orderNumber;
    if (updateData.status && existingOrder.status !== updateData.status) {
      auditDetails.statusFrom = existingOrder.status;
      auditDetails.statusTo = updateData.status;
    }
    const newTracking = order.trackingNumber ?? updateData.trackingNumber;
    const newCarrier = order.trackingCarrier;
    if (newTracking) {
      auditDetails.trackingNumber = newTracking;
      if (newCarrier) auditDetails.trackingCarrier = newCarrier;
    }
    if (order.labelUrl) auditDetails.labelSource = "Generated via Shippo";

    createAuditLog({
      userId,
      action: "update",
      entityType: "order",
      entityId: id,
      details: Object.keys(auditDetails).length > 0 ? auditDetails : undefined,
    }).catch(() => {});

    // Global invalidation: orders affect product/category/supplier detail Recent Orders
    const { invalidateOnOrderChange } = await import("@/lib/cache");
    await invalidateOnOrderChange();

    // Track changes for notifications
    const statusChanged =
      updateData.status && updateData.status !== existingOrder.status;
    const isNowShipped = statusChanged && updateData.status === "shipped";
    const trackingAdded =
      (updateData.trackingNumber || updateData.trackingUrl) &&
      !existingOrder.trackingNumber &&
      !existingOrder.trackingUrl;
    const trackingChanged =
      (updateData.trackingNumber &&
        updateData.trackingNumber !== existingOrder.trackingNumber) ||
      (updateData.trackingUrl &&
        updateData.trackingUrl !== existingOrder.trackingUrl &&
        updateData.trackingUrl !== "");
    const notesChanged =
      updateData.notes !== undefined &&
      updateData.notes !== existingOrder.notes;
    const otherFieldsChanged =
      (updateData.paymentStatus &&
        updateData.paymentStatus !== existingOrder.paymentStatus) ||
      updateData.estimatedDelivery ||
      updateData.shippedAt ||
      updateData.deliveredAt;

    // Create in-app notification for order status update (async, non-blocking)
    if (statusChanged) {
      createOrderNotification(
        "order_status_update",
        order.orderNumber,
        `Order ${order.orderNumber} status updated from ${existingOrder.status} to ${updateData.status}`,
        userId,
        order.id,
      ).catch((error) => {
        // Log error but don't fail the request
        logger.error(
          "Failed to create in-app notification for order status update:",
          error,
        );
      });
    }

    // Create in-app notification for order edit (tracking, notes, or other significant changes)
    // Only if status didn't change (to avoid duplicate notifications)
    if (
      !statusChanged &&
      (trackingChanged || notesChanged || otherFieldsChanged)
    ) {
      const changeMessages: string[] = [];
      if (trackingChanged) {
        changeMessages.push("tracking information updated");
      }
      if (notesChanged) {
        changeMessages.push("notes updated");
      }
      if (
        updateData.paymentStatus &&
        updateData.paymentStatus !== existingOrder.paymentStatus
      ) {
        changeMessages.push(
          `payment status changed to ${updateData.paymentStatus}`,
        );
      }

      if (changeMessages.length > 0) {
        createOrderNotification(
          "order_status_update",
          order.orderNumber,
          `Order ${order.orderNumber} edited: ${changeMessages.join(", ")}`,
          userId,
          order.id,
        ).catch((error) => {
          // Log error but don't fail the request
          logger.error(
            "Failed to create in-app notification for order edit:",
            error,
          );
        });
      }
    }

    // Create in-app notification for shipping (when status changes to shipped OR tracking info added)
    if (isNowShipped || (updateData.status === "shipped" && trackingAdded)) {
      const trackingInfo =
        updateData.trackingNumber || existingOrder.trackingNumber;
      const message = trackingInfo
        ? `Order ${order.orderNumber} has been shipped. Tracking: ${trackingInfo}`
        : `Order ${order.orderNumber} has been shipped.`;

      createOrderNotification(
        "shipping_notification",
        order.orderNumber,
        message,
        userId,
        order.id,
      ).catch((error) => {
        // Log error but don't fail the request
        logger.error(
          "Failed to create in-app notification for shipping:",
          error,
        );
      });
    }

    // Send order status update email if status changed
    if (
      statusChanged &&
      existingOrder.shippingAddress &&
      typeof existingOrder.shippingAddress === "object"
    ) {
      const shippingAddr = existingOrder.shippingAddress as {
        email?: string;
        name?: string;
      };
      if (shippingAddr.email) {
        sendOrderStatusUpdate(
          {
            orderNumber: order.orderNumber,
            clientName: shippingAddr.name || "Customer",
            clientEmail: shippingAddr.email,
            previousStatus: existingOrder.status,
            newStatus: updateData.status ?? order.status,
            orderUrl: `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
            }/orders/${order.id}`,
            estimatedDelivery: order.estimatedDelivery?.toISOString(),
          },
          shippingAddr.email,
          shippingAddr.name,
        ).catch((error) => {
          // Log error but don't fail the request
          logger.error("Failed to send order status update email:", error);
        });
      }
    }

    // Transform order for response
    // Note: order.items is included from updateOrder's include clause
    const orderWithItems = order as typeof order & {
      items: Array<{
        id: string;
        orderId: string;
        productId: string;
        productName: string;
        sku: string | null;
        quantity: number;
        price: number;
        subtotal: number;
        createdAt: Date;
      }>;
    };

    const transformedOrder = {
      id: orderWithItems.id,
      orderNumber: orderWithItems.orderNumber,
      userId: orderWithItems.userId,
      clientId: orderWithItems.clientId,
      status: orderWithItems.status,
      paymentStatus: orderWithItems.paymentStatus,
      subtotal: orderWithItems.subtotal,
      tax: orderWithItems.tax,
      shipping: orderWithItems.shipping,
      discount: orderWithItems.discount,
      total: orderWithItems.total,
      shippingAddress: orderWithItems.shippingAddress,
      billingAddress: orderWithItems.billingAddress,
      notes: orderWithItems.notes,
      trackingNumber: orderWithItems.trackingNumber,
      trackingCarrier: orderWithItems.trackingCarrier ?? null,
      trackingUrl: orderWithItems.trackingUrl,
      labelUrl: orderWithItems.labelUrl ?? null,
      estimatedDelivery:
        orderWithItems.estimatedDelivery?.toISOString() || null,
      shippedAt: orderWithItems.shippedAt?.toISOString() || null,
      deliveredAt: orderWithItems.deliveredAt?.toISOString() || null,
      cancelledAt: orderWithItems.cancelledAt?.toISOString() || null,
      createdAt: orderWithItems.createdAt.toISOString(),
      updatedAt: orderWithItems.updatedAt?.toISOString() || null,
      createdBy: orderWithItems.createdBy,
      updatedBy: orderWithItems.updatedBy,
      items: (orderWithItems.items || []).map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        createdAt: item.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    logger.error("Error updating order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update order",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/orders/:id
 * Cancel order (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Rate limiting check
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.id;

    // Get existing order before cancellation for notification.
    // Admin can cancel any order; other roles only their own.
    const isAdmin = session.role === "admin";
    let existingOrder: Awaited<ReturnType<typeof getOrderById>> | null;
    if (isAdmin) {
      existingOrder = await getOrderByIdForAdmin(id);
    } else {
      existingOrder = await getOrderById(id, userId);
      if (!existingOrder) {
        existingOrder = await getOrderByIdForProductOwner(id, userId);
      }
    }
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Cancel order — for admin, use the order's own userId so the
    // Prisma cancelOrder filter matches.
    const order = await cancelOrder(id, isAdmin ? existingOrder.userId : userId);

    createAuditLog({
      userId,
      action: "delete",
      entityType: "order",
      entityId: id,
      details: { orderNumber: existingOrder.orderNumber, summary: "Order cancelled" },
    }).catch(() => {});

    // Global invalidation: orders affect product/category/supplier detail Recent Orders
    const { invalidateOnOrderChange } = await import("@/lib/cache");
    await invalidateOnOrderChange();

    // Create in-app notification for order cancellation (async, non-blocking)
    createOrderNotification(
      "order_status_update",
      order.orderNumber,
      `Order ${order.orderNumber} has been cancelled`,
      userId,
      order.id,
    ).catch((error) => {
      // Log error but don't fail the request
      logger.error(
        "Failed to create in-app notification for order cancellation:",
        error,
      );
    });

    // Transform order for response
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      clientId: order.clientId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      notes: order.notes,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier ?? null,
      trackingUrl: order.trackingUrl,
      labelUrl: order.labelUrl ?? null,
      estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      cancelledAt: order.cancelledAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt?.toISOString() || null,
      createdBy: order.createdBy,
      updatedBy: order.updatedBy,
      items: (order.items || []).map(
        (item: {
          id: string;
          orderId: string;
          productId: string;
          productName: string;
          sku: string | null;
          quantity: number;
          price: number;
          subtotal: number;
          createdAt: Date;
        }) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          createdAt: item.createdAt.toISOString(),
        }),
      ),
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    logger.error("Error cancelling order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel order",
      },
      { status: 500 },
    );
  }
}
