/**
 * Orders API Route Handler
 * App Router route handler for order CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  createOrder,
  getOrdersByUser,
  getOrdersByClientId,
  getOrdersContainingSupplierProducts,
} from "@/prisma/order";
import { getSupplierByUserId } from "@/prisma/supplier";
import { getInvoiceLinkMap, buildOrderForPageRow } from "@/lib/server/orders-data";
import { createOrderSchema } from "@/lib/validations";
import { getCache, setCache, cacheKeys, invalidateOnOrderChange } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { sendOrderConfirmation } from "@/lib/email/notifications";
import { createOrderNotification, createClientOrderReceivedNotification } from "@/lib/notifications/in-app";
import { prisma } from "@/prisma/client";
import { createAuditLog } from "@/prisma/audit-log";
import type { CreateOrderInput } from "@/types";
import {
  resolveBuyerDisplayFromUsers,
  resolveBuyerUserId,
  resolveStoreOwnerUserId,
} from "@/lib/orders/order-party";

/**
 * GET /api/orders
 * Fetch all orders for the authenticated user
 * Uses Redis caching for improved performance
 */
export async function GET(request: NextRequest) {
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

    const userId = session.id;
    const isClient = session.role === "client";
    const isSupplier = session.role === "supplier";
    const supplier =
      isSupplier ? await getSupplierByUserId(userId) : null;
    if (isSupplier && !supplier) {
      return NextResponse.json([]);
    }

    const cacheKey = isClient
      ? cacheKeys.orders.list({ userId, byClient: true })
      : isSupplier
        ? cacheKeys.orders.list({ supplierId: supplier!.id })
        : cacheKeys.orders.list({ userId });

    // Check cache first
    const cacheReadStartedAt = Date.now();
    const cachedOrders = await getCache<unknown[]>(cacheKey);
    if (cachedOrders) {
      return NextResponse.json(cachedOrders);
    }

    // Fetch from database
    const orders = isClient
      ? await getOrdersByClientId(userId)
      : isSupplier
        ? await getOrdersContainingSupplierProducts(supplier!.id)
        : await getOrdersByUser(userId);

    // REQ-0159 — placedBy = buyer (clientId when set), not store owner
    const buyerIds = [
      ...new Set(orders.map((o) => resolveBuyerUserId(o)).filter(Boolean)),
    ];
    // Batch invoice linkage (REQ-0061) alongside buyer lookup — one query each
    const [users, invoiceLinkMap] = await Promise.all([
      buyerIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: buyerIds } },
            select: { id: true, name: true, email: true },
          })
        : Promise.resolve([]),
      getInvoiceLinkMap(orders.map((o) => o.id)),
    ]);
    const userMap = new Map(users.map((u) => [u.id, u]));

    // For client role, resolve product owner from order items
    let orderProductOwnerMap = new Map<string, { name: string | null; email: string }>();
    if (isClient && orders.length > 0) {
      const allProductIds = [
        ...new Set(orders.flatMap((o) => o.items.map((item) => item.productId))),
      ];
      const products = allProductIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: allProductIds } },
            select: { id: true, userId: true },
          })
        : [];
      const productOwnerIdMap = new Map(products.map((p) => [p.id, p.userId]));
      const ownerIds = [...new Set(products.map((p) => p.userId))];
      const ownerUsers = ownerIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: { id: true, name: true, email: true },
          })
        : [];
      const ownerUserMap = new Map(ownerUsers.map((u) => [u.id, u]));
      for (const order of orders) {
        const firstProductId = order.items[0]?.productId;
        const ownerId = firstProductId ? productOwnerIdMap.get(firstProductId) : undefined;
        const owner = ownerId ? ownerUserMap.get(ownerId) : undefined;
        if (owner) {
          orderProductOwnerMap.set(order.id, { name: owner.name, email: owner.email });
        }
      }
    }

    // Transform orders for response
    const transformedOrders = orders.map((order) => {
      const buyer = resolveBuyerDisplayFromUsers(
        { userId: order.userId, clientId: order.clientId },
        userMap,
      );
      const placedByName = buyer.name;
      const placedByEmail = buyer.email;
      const po = isClient ? orderProductOwnerMap.get(order.id) : undefined;
      const invoiceForOrder = invoiceLinkMap.get(order.id) ?? null;
      return {
        ...buildOrderForPageRow(
          {
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
            trackingUrl: order.trackingUrl,
            estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
            shippedAt: order.shippedAt?.toISOString() || null,
            deliveredAt: order.deliveredAt?.toISOString() || null,
            cancelledAt: order.cancelledAt?.toISOString() || null,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt?.toISOString() || null,
            createdBy: order.createdBy,
            updatedBy: order.updatedBy,
            items: order.items.map((item) => ({
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
            placedByName,
            placedByEmail,
            ...(po
              ? {
                  productOwnerName: po.name ?? po.email,
                  productOwnerEmail: po.email,
                }
              : {}),
          },
          invoiceForOrder,
        ),
        trackingCarrier: order.trackingCarrier ?? null,
        labelUrl: order.labelUrl ?? null,
      };
    });

    // Cache the result for 5 minutes
    await setCache(cacheKey, transformedOrders, 300, { fetchedAt: cacheReadStartedAt });

    return NextResponse.json(transformedOrders);
  } catch (error) {
    logger.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders
 * Create a new order
 * Includes inventory validation and automatic stock checks
 */
export async function POST(request: NextRequest) {
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

    const userId = session.id;
    const body = await request.json();

    // Validate request body
    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid order creation data", {
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

    const orderData = validationResult.data as CreateOrderInput;
    const role = session.role;
    const isClientRole = role === "client";

    // REQ-0158 — resolve store owner from line products; buyer = client or null (self)
    const productIdsForParty = orderData.items.map((i) => i.productId);
    const productsForParty = await prisma.product.findMany({
      where: { id: { in: productIdsForParty } },
      select: { id: true, userId: true },
    });
    const ownerFromProducts = resolveStoreOwnerUserId(
      productsForParty.map((p) => p.userId),
    );

    let storeOwnerUserId: string;
    let clientId: string | null;
    if (isClientRole) {
      storeOwnerUserId = ownerFromProducts ?? userId;
      clientId = userId;
    } else {
      // Admin/user self (or optional body.clientId when ordering for a client)
      storeOwnerUserId = userId;
      const bodyClientId =
        typeof orderData.clientId === "string" && orderData.clientId.length > 0
          ? orderData.clientId
          : null;
      clientId =
        bodyClientId && bodyClientId !== userId ? bodyClientId : null;
    }

    const order = await createOrder(orderData, {
      storeOwnerUserId,
      createdByUserId: userId,
      clientId,
    });

    createAuditLog({
      userId,
      action: "create",
      entityType: "order",
      entityId: order.id,
      details: { orderNumber: order.orderNumber },
    }).catch(() => {});

    // Global invalidation: orders affect product/category/supplier detail Recent Orders
    await invalidateOnOrderChange();
    // Create in-app notification for order confirmation (async, non-blocking)
    const notifyUserId = order.clientId ?? order.userId;
    createOrderNotification(
      "order_confirmation",
      order.orderNumber,
      `Your order ${order.orderNumber} has been successfully created. Total: $${order.total.toFixed(2)}`,
      notifyUserId,
      order.id,
    ).catch((error) => {
      // Log error but don't fail the request
      logger.error("Failed to create in-app notification for order:", error);
    });

    // Notify product owners that a client placed an order containing their products (async, non-blocking)
    if (isClientRole && order.clientId) {
      const productIds = order.items.map((item) => item.productId);
      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { userId: true },
        });
        const ownerIds = [...new Set(products.map((p) => p.userId))].filter(
          (id) => id !== order.clientId,
        );
        if (ownerIds.length > 0) {
          const buyer = await prisma.user.findUnique({
            where: { id: order.clientId },
            select: { name: true, email: true },
          });
          const buyerDisplay = buyer
            ? `${buyer.name ?? "Customer"} (${buyer.email})`
            : "A client";
          Promise.all(
            ownerIds.map((ownerId) =>
              createClientOrderReceivedNotification(
                order.id,
                order.orderNumber,
                buyerDisplay,
                ownerId,
              ),
            ),
          ).catch((error) => {
            logger.error(
              "Failed to create product-owner order notifications:",
              error,
            );
          });
        }
      }
    }

    // Send order confirmation email (async, non-blocking)
    if (order.shippingAddress && typeof order.shippingAddress === "object") {
      const shippingAddr = order.shippingAddress as {
        email?: string;
        name?: string;
      };
      if (shippingAddr.email) {
        sendOrderConfirmation(
          {
            orderNumber: order.orderNumber,
            orderDate: order.createdAt.toISOString(),
            clientName: shippingAddr.name || "Customer",
            clientEmail: shippingAddr.email,
            items: order.items.map((item) => ({
              productName: item.productName,
              sku: item.sku || undefined,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            })),
            subtotal: order.subtotal,
            tax: order.tax || undefined,
            shipping: order.shipping || undefined,
            total: order.total,
            shippingAddress: order.shippingAddress as {
              street: string;
              city: string;
              state?: string;
              zipCode: string;
              country: string;
            },
            orderStatus: order.status,
            estimatedDelivery: order.estimatedDelivery?.toISOString(),
          },
          shippingAddr.email,
          shippingAddr.name,
        ).catch((error) => {
          // Log error but don't fail the request
          logger.error("Failed to send order confirmation email:", error);
        });
      }
    }

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
      items: order.items.map((item) => ({
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

    return NextResponse.json(transformedOrder, { status: 201 });
  } catch (error) {
    logger.error("Error creating order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create order",
      },
      { status: 500 },
    );
  }
}
