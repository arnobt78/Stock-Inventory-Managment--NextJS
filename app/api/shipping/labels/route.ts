/**
 * Shipping Labels API Route
 * POST /api/shipping/labels — generate shipping label via Shippo
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  getShippo,
  isShippoConfigured,
  isShippoTestMode,
  DEFAULT_FROM_ADDRESS,
  getTrackingUrl,
} from "@/lib/shippo";
import { prisma } from "@/prisma/client";
import { getSupplierByUserId } from "@/prisma/supplier";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { sendShippingNotification } from "@/lib/email";
import type { ShippingNotificationData } from "@/lib/email/types";
import { generateLabelBodySchema } from "@/lib/validations/shipping";
import type { GenerateLabelResponse } from "@/types";

import { invalidateOnOrderChange } from "@/lib/cache";
/**
 * POST /api/shipping/labels
 * Generate a shipping label for an order
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

    if (!isShippoConfigured()) {
      return NextResponse.json(
        { error: "Shipping service is not configured" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const validationResult = generateLabelBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid shipping label request", {
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

    const {
      orderId,
      carrier,
      service,
      rateObjectId,
      fromAddress,
      toAddress,
      parcel,
    } = validationResult.data;

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

    // Check if order already has tracking
    if (order.trackingNumber) {
      return NextResponse.json(
        { error: "Order already has a tracking number" },
        { status: 400 },
      );
    }

    const shippo = getShippo();
    let trackingNumber: string;
    let labelUrl: string | undefined;
    let trackingCarrier: string = carrier || "usps";

    // If rateObjectId provided, purchase that specific rate
    if (rateObjectId) {
      const transaction = await shippo.transactions.create({
        rate: rateObjectId,
        labelFileType: "PDF",
        async: false,
      });

      if (transaction.status !== "SUCCESS") {
        const errorMessage =
          transaction.messages?.map((m) => m.text).join(", ") ||
          "Failed to create shipping label";
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      trackingNumber = transaction.trackingNumber || "";
      labelUrl = transaction.labelUrl;
      // Rate can be a string (rate ID) or a CoreRate object
      const rateObj =
        typeof transaction.rate === "object" ? transaction.rate : null;
      trackingCarrier = rateObj?.provider || carrier || "usps";
    } else {
      // Create shipment and get cheapest rate
      // Cast shippingAddress from Prisma Json to our expected shape
      const shippingAddr = order.shippingAddress as {
        name?: string;
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        phone?: string;
      } | null;

      const shipmentToAddress = toAddress || {
        name: shippingAddr?.name || "Customer",
        street1: shippingAddr?.street || "123 Test St",
        city: shippingAddr?.city || "Test City",
        state: shippingAddr?.state || "NY",
        zip: shippingAddr?.zipCode || "10001",
        country: shippingAddr?.country || "US",
        phone: shippingAddr?.phone || "",
        email: "",
      };

      const toCountry = (shipmentToAddress.country || "US").toUpperCase();
      const isInternational = toCountry !== "US";

      // For international shipments, USPS (and others) require a customs declaration.
      // We use DEFAULT_FROM_ADDRESS / .env for certify signer and origin.
      // Shippo requires: combined weight of all customs items <= parcel weight.
      const baseParcelWeight = parcel?.weight || "2";
      const totalQty =
        order.items.reduce((sum, i) => sum + i.quantity, 0) || 1;
      const parcelWeightNum = parseFloat(baseParcelWeight) || 2;

      let customsDeclarationId: string | undefined;
      let parcelWeightForShipment = baseParcelWeight;

      if (isInternational) {
        // Assign weight per unit so that sum(quantity * weightPerUnit) <= parcel weight.
        // Use floor to avoid rounding over: e.g. 2/3 = 0.66 so 3*0.66 = 1.98 <= 2.
        const weightPerUnit =
          totalQty > 0
            ? Math.floor((parcelWeightNum / totalQty) * 100) / 100
            : parcelWeightNum;
        const weightPerItemStr =
          weightPerUnit > 0 ? weightPerUnit.toFixed(2) : "0.01";

        const customsItems =
          order.items.length > 0
            ? order.items.map((item) => ({
                description: item.productName.slice(0, 256),
                quantity: item.quantity,
                netWeight: weightPerItemStr,
                massUnit: "lb" as const,
                valueAmount: item.subtotal.toFixed(2),
                valueCurrency: "USD" as const,
                originCountry: "US" as const,
              }))
            : [
                {
                  description: "Merchandise",
                  quantity: 1,
                  netWeight: baseParcelWeight,
                  massUnit: "lb" as const,
                  valueAmount: order.subtotal.toFixed(2),
                  valueCurrency: "USD" as const,
                  originCountry: "US" as const,
                },
              ];

        const combinedCustomsWeight = order.items.length
          ? order.items.reduce(
              (sum, item) => sum + item.quantity * weightPerUnit,
              0,
            )
          : parcelWeightNum;
        // Ensure parcel weight is at least the combined customs weight (Shippo validation).
        const minParcelWeight = Math.ceil(combinedCustomsWeight * 100) / 100;
        parcelWeightForShipment =
          parcelWeightNum >= minParcelWeight
            ? baseParcelWeight
            : minParcelWeight.toFixed(2);

        const declaration = await shippo.customsDeclarations.create({
          contentsType: "MERCHANDISE",
          nonDeliveryOption: "RETURN",
          certify: true,
          certifySigner: fromAddress?.name || DEFAULT_FROM_ADDRESS.name,
          incoterm: "DDU",
          eelPfc: "NOEEI_30_37_a",
          items: customsItems,
        });
        customsDeclarationId = declaration.objectId;
      }

      const shipmentPayload: Parameters<typeof shippo.shipments.create>[0] = {
        addressFrom: {
          name: fromAddress?.name || DEFAULT_FROM_ADDRESS.name,
          street1: fromAddress?.street1 || DEFAULT_FROM_ADDRESS.street1,
          city: fromAddress?.city || DEFAULT_FROM_ADDRESS.city,
          state: fromAddress?.state || DEFAULT_FROM_ADDRESS.state,
          zip: fromAddress?.zip || DEFAULT_FROM_ADDRESS.zip,
          country: fromAddress?.country || DEFAULT_FROM_ADDRESS.country,
          phone: fromAddress?.phone || DEFAULT_FROM_ADDRESS.phone,
          email: fromAddress?.email || DEFAULT_FROM_ADDRESS.email,
        },
        addressTo: shipmentToAddress,
        parcels: [
          {
            length: parcel?.length || "10",
            width: parcel?.width || "8",
            height: parcel?.height || "4",
            distanceUnit: "in",
            weight: parcelWeightForShipment,
            massUnit: "lb",
          },
        ],
      };
      if (customsDeclarationId) {
        shipmentPayload.customsDeclaration = customsDeclarationId;
      }

      const shipment = await shippo.shipments.create(shipmentPayload);

      // Find rate for specified carrier or get cheapest
      let selectedRate = shipment.rates?.find(
        (r) =>
          r.provider?.toLowerCase() === carrier?.toLowerCase() &&
          (!service || r.servicelevel?.token === service),
      );

      if (!selectedRate && shipment.rates && shipment.rates.length > 0) {
        // Get cheapest rate
        const firstRate = shipment.rates[0];
        if (firstRate) {
          selectedRate = shipment.rates.reduce(
            (min, r) =>
              parseFloat(r.amount || "0") < parseFloat(min?.amount || "0")
                ? r
                : min,
            firstRate,
          );
        }
      }

      if (!selectedRate) {
        return NextResponse.json(
          { error: "No shipping rates available" },
          { status: 400 },
        );
      }

      // Purchase label
      const transaction = await shippo.transactions.create({
        rate: selectedRate.objectId || "",
        labelFileType: "PDF",
        async: false,
      });

      if (transaction.status !== "SUCCESS") {
        const errorMessage =
          transaction.messages?.map((m) => m.text).join(", ") ||
          "Failed to create shipping label";
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      trackingNumber = transaction.trackingNumber || "";
      labelUrl = transaction.labelUrl;
      // Rate can be a string (rate ID) or a CoreRate object
      const rateObj2 =
        typeof transaction.rate === "object" ? transaction.rate : null;
      trackingCarrier = rateObj2?.provider || selectedRate.provider || "usps";
    }

    // In test mode, generate a test tracking number if none provided
    if (isShippoTestMode() && !trackingNumber) {
      trackingNumber = `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }

    // Get tracking URL
    const trackingUrl = getTrackingUrl(trackingCarrier, trackingNumber);

    // Update order with tracking info
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        trackingCarrier: trackingCarrier.toLowerCase(),
        trackingUrl,
        labelUrl,
        status: "shipped",
        updatedAt: new Date(),
      },
      include: {
        items: true,
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

    // Send shipping notification email (async, non-blocking)
    if (clientEmail && trackingNumber) {
      // Cast order shipping address for the email
      const orderShippingAddr = order.shippingAddress as {
        name?: string;
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      } | null;

      const shippingNotificationData: ShippingNotificationData = {
        orderNumber: order.orderNumber,
        clientName,
        clientEmail,
        trackingNumber,
        carrier: trackingCarrier.toUpperCase(),
        shippingDate: new Date().toISOString(),
        estimatedDelivery: "3-5 business days",
        shippingAddress: orderShippingAddr
          ? {
              street: orderShippingAddr.street || "",
              city: orderShippingAddr.city || "",
              state: orderShippingAddr.state || "",
              zipCode: orderShippingAddr.zipCode || "",
              country: orderShippingAddr.country || "USA",
            }
          : {
              street: "Address on file",
              city: "",
              zipCode: "",
              country: "USA",
            },
        items: updatedOrder.items.map((item) => ({
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
    invalidateOnOrderChange();
    const response: GenerateLabelResponse = {
      orderId,
      trackingNumber,
      trackingCarrier:
        trackingCarrier.toLowerCase() as GenerateLabelResponse["trackingCarrier"],
      labelUrl,
      trackingUrl: trackingUrl || undefined,
      status: "shipped",
      updatedAt: new Date().toISOString(),
    };

    logger.info(
      `Shipping label generated for order ${orderId}: ${trackingNumber}`,
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error generating shipping label:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate shipping label",
      },
      { status: 500 },
    );
  }
}
