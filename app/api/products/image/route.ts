/**
 * Product Image Upload API Route Handler
 * Handles product image uploads to ImageKit
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  uploadProductImageToImageKit,
  deleteProductImageFromImageKit,
} from "@/lib/imagekit";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { scheduleInvalidateProductCaches } from "@/lib/cache";

/**
 * POST /api/products/image
 * Upload a product image to ImageKit
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sku = formData.get("sku") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate file name from SKU or use original file name
    const fileName = sku
      ? `product-${sku}-${Date.now()}`
      : `product-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9-_.]/g, "_")}`;

    // Upload to ImageKit
    const result = await uploadProductImageToImageKit(buffer, fileName);
    scheduleInvalidateProductCaches();
    logger.info("Product image uploaded successfully", {
      userId: session.id,
      sku,
      fileId: result.fileId,
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.url,
      imageFileId: result.fileId,
    });
  } catch (error) {
    logger.error("Error uploading product image:", error);
    return NextResponse.json(
      {
        error: "Failed to upload image",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/image
 * Delete a product image from ImageKit
 */
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Delete from ImageKit
    await deleteProductImageFromImageKit(fileId);
    scheduleInvalidateProductCaches();
    logger.info("Product image deleted successfully", {
      userId: session.id,
      fileId,
    });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting product image:", error);
    return NextResponse.json(
      {
        error: "Failed to delete image",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
