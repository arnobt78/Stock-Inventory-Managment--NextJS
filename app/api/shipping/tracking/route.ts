/**
 * Shipping Tracking API Route
 * POST /api/shipping/tracking — add manual tracking number
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getTrackingUrl } from "@/lib/shippo";
import { prisma } from "@/prisma/client";
import { getSupplierByUserId } from "@/prisma/supplier";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { sendShippingNotification } from "@/lib/email";
import type { ShippingNotificationData } from "@/lib/email/types";
import { addTrackingBodySchema } from "@/lib/validations/shipping";
import type { GenerateLabelResponse } from "@/types";

import { invalidateOnOrderChange } from "@/lib/cache";
/**
 * POST /api/shipping/tracking
 * Add manual tracking number to an order
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = addTrackingBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid shipping tracking request", {
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

    const { orderId, trackingNumber, trackingCarrier } = validationResult.data;

    // Fetch order with items and product supplierIds for auth
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { supplierId: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Allow: admin, order creator, client, or supplier on this order
    const isAdmin = session.role === "admin";
    const isCreator = order.userId === session.id;
    const isClient = order.clientId === session.id;
    let isSupplierOnOrder = false;
    if (session.role === "supplier") {
      const supplier = await getSupplierByUserId(session.id);
      isSupplierOnOrder =
        !!supplier &&
        order.items.some((item) => item.product.supplierId === supplier.id);
    }
    if (!isAdmin && !isCreator && !isClient && !isSupplierOnOrder) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const carrier = trackingCarrier || "usps";
    const trackingUrl = getTrackingUrl(carrier, trackingNumber);

    // Update order with tracking info
    const shippedAt = new Date();
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        trackingCarrier: carrier.toLowerCase(),
        trackingUrl,
        status: "shipped",
        shippedAt,
        updatedAt: shippedAt,
      },
    });

    // Get client info for shipping notification email
    let clientEmail: string | null = null;
    let clientName = "Valued Customer";
    if (order.clientId) {
      const client = await prisma.user.findUnique({
        where: { id: order.clientId },
        select: { email: true, username: true },
      });
      if (client?.email) {
        clientEmail = client.email;
        clientName = client.username || "Valued Customer";
      }
    }

    // Parse shipping address for email
    const shippingAddr = order.shippingAddress as {
      name?: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    } | null;

    // Send shipping notification email (async, non-blocking)
    if (clientEmail && trackingNumber) {
      const shippingNotificationData: ShippingNotificationData = {
        orderNumber: order.orderNumber,
        clientName,
        clientEmail,
        trackingNumber,
        carrier: carrier.toUpperCase(),
        shippingDate: new Date().toISOString(),
        estimatedDelivery: "3-5 business days",
        shippingAddress: shippingAddr
          ? {
              street: shippingAddr.street || "",
              city: shippingAddr.city || "",
              state: shippingAddr.state || "",
              zipCode: shippingAddr.zipCode || "",
              country: shippingAddr.country || "USA",
            }
          : {
              street: "Address on file",
              city: "",
              zipCode: "",
              country: "USA",
            },
        items: order.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
        })),
        trackingUrl: trackingUrl || undefined,
      };
      sendShippingNotification(
        shippingNotificationData,
        clientEmail,
        clientName,
      ).catch((err) =>
        logger.warn("Failed to send shipping notification email", {
          error: err,
        }),
      );
    }

    // Invalidate caches
    await invalidateOnOrderChange();
    const response: GenerateLabelResponse = {
      orderId,
      trackingNumber,
      trackingCarrier:
        carrier.toLowerCase() as GenerateLabelResponse["trackingCarrier"],
      trackingUrl: trackingUrl || undefined,
      status: "shipped",
      updatedAt: shippedAt.toISOString(),
    };

    logger.info(`Tracking number added to order ${orderId}: ${trackingNumber}`);

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error adding tracking number:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to add tracking number",
      },
      { status: 500 },
    );
  }
}
