/**
 * QR Code API Route Handler
 * Generates QR codes for products and uploads them to ImageKit
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import {
  generateAndUploadQRCode,
  deleteQRCodeFromImageKit,
} from "@/lib/imagekit";
import { logger } from "@/lib/logger";
import { generateProductQrCodeBodySchema } from "@/lib/validations/product";
import { scheduleInvalidateProductCaches } from "@/lib/cache";
import { prisma } from "@/prisma/client";

/**
 * POST /api/products/qr-code
 * Generate QR code for a product and upload to ImageKit
 * Body: { productId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = generateProductQrCodeBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid product QR code request", {
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

    const { productId } = validationResult.data;

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify product belongs to authenticated user
    if (product.userId !== session.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this product" },
        { status: 403 }
      );
    }

    // Generate QR code data (product URL or product info)
    // Using product SKU as identifier for QR code
    const qrCodeDataString = JSON.stringify({
      productId: product.id,
      sku: product.sku,
      name: product.name,
    });

    // Get the old fileId before generating new QR code
    const oldFileId = product.qrCodeFileId;

    // Generate and upload QR code to ImageKit
    const qrCodeData = await generateAndUploadQRCode(
      qrCodeDataString,
      `product-${product.sku}`,
      200,
      "/stock-inventory/qr-codes/"
    );

    // Update product with QR code URL and fileId
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        qrCodeUrl: qrCodeData.url,
        qrCodeFileId: qrCodeData.fileId,
      },
    });

    // Delete old QR code from ImageKit if it exists
    if (oldFileId) {
      try {
        await deleteQRCodeFromImageKit(oldFileId);
        logger.debug(`Deleted old QR code file from ImageKit: ${oldFileId}`);
      } catch (deleteError) {
        // Log error but don't fail - old file cleanup is not critical
        logger.error(
          `Failed to delete old QR code from ImageKit: ${oldFileId}`,
          deleteError
        );
      }
    }
    await scheduleInvalidateProductCaches();
    return NextResponse.json(
      {
        qrCodeUrl: updatedProduct.qrCodeUrl,
        productId: updatedProduct.id,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error generating QR code:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate QR code",
      },
      { status: 500 }
    );
  }
}
