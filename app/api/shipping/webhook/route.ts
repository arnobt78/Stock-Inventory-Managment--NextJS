/**
 * Shippo Webhook Handler
 * POST /api/shipping/webhook — handle Shippo tracking events
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { sendOrderStatusUpdate } from "@/lib/email";
import type { OrderStatusUpdateData } from "@/lib/email/types";
import type { ShippoWebhookPayload } from "@/types";

import { invalidateOnOrderChange } from "@/lib/cache";
/**
 * POST /api/shipping/webhook
 * Handles Shippo webhook events (tracking updates)
 */
export async function POST(request: NextRequest) {
  try {
    const body: ShippoWebhookPayload = await request.json();
    const { event, data } = body;

    logger.info(`Received Shippo webhook: ${event}`);

    if (event === "track_updated" && data) {
      const { tracking_number, tracking_status, carrier } = data;

      if (!tracking_number) {
        logger.warn("Shippo webhook missing tracking number");
        return NextResponse.json({ received: true });
      }

      // Find order by tracking number
      const order = await prisma.order.findFirst({
        where: { trackingNumber: tracking_number },
      });

      if (!order) {
        logger.info(`Order not found for tracking number: ${tracking_number}`);
        return NextResponse.json({ received: true });
      }

      // Map Shippo status to our order status
      let newStatus = order.status;
      const shippoStatus = tracking_status?.status?.toLowerCase();

      if (shippoStatus === "delivered") {
        newStatus = "delivered";
      } else if (shippoStatus === "transit" || shippoStatus === "in_transit") {
        newStatus = "shipped";
      } else if (shippoStatus === "returned" || shippoStatus === "failure") {
        // Keep as shipped, but could add a flag for issues
        logger.warn(`Shipping issue for order ${order.id}: ${shippoStatus}`);
      }

      // Update order if status changed
      if (newStatus !== order.status) {
        const prevStatus = order.status;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: newStatus,
            updatedAt: new Date(),
          },
        });

        // Invalidate caches
    invalidateOnOrderChange();
        logger.info(
          `Order ${order.id} status updated to ${newStatus} via Shippo webhook`,
        );

        // Send order status update email (async, non-blocking)
        if (order.clientId) {
          const client = await prisma.user.findUnique({
            where: { id: order.clientId },
            select: { email: true, username: true },
          });

          if (client?.email) {
            const statusUpdateData: OrderStatusUpdateData = {
              orderNumber: order.orderNumber,
              clientName: client.username || "Valued Customer",
              clientEmail: client.email,
              previousStatus: prevStatus,
              newStatus,
              statusMessage:
                newStatus === "delivered"
                  ? "Your order has been delivered! We hope you enjoy your purchase."
                  : `Your order status has been updated to "${newStatus}".`,
            };
            sendOrderStatusUpdate(
              statusUpdateData,
              client.email,
              client.username || undefined,
            ).catch((err) =>
              logger.warn("Failed to send status update email", { error: err }),
            );
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Shippo webhook handler error:", error);
    // Return 200 even on error to prevent Shippo from retrying
    return NextResponse.json({ received: true, error: "Internal error" });
  }
}
