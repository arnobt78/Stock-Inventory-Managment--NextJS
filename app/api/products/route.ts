/**
 * Products API Route Handler
 * GET: list products (admin by userId, supplier by supplierId); uses Redis cache; supplier response includes productOwnerName.
 * POST: create product (with optional QR/image); PATCH/DELETE in [id] route.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  generateAndUploadQRCode,
  deleteQRCodeFromImageKit,
  deleteProductImageFromImageKit,
  cleanupProductMediaFromImageKit,
} from "@/lib/imagekit";
import { isImageKitNotFoundError } from "@/lib/imagekit-errors";
import { isPrismaRelationViolation } from "@/lib/api/prisma-errors";
import {
  getDeleteStrategy,
  isActiveOrderStatus,
} from "@/lib/products/delete-policy";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { prisma } from "@/prisma/client";
import { getSupplierByUserId } from "@/prisma/supplier";
import { checkAndSendStockAlerts } from "@/lib/email/notifications";
import {
  getCache,
  setCache,
  invalidateCache,
  cacheKeys,
  invalidateOnProductChange,
  scheduleAfterResponse,
  scheduleInvalidateStockAllocationCaches,
} from "@/lib/cache";
import { getStockAllocationsByProduct } from "@/prisma/stock-allocation";
import { planCatalogQuantityReconcile } from "@/lib/stock-allocation/catalog-quantity-reconcile";
import { applyCatalogQuantityReconcile } from "@/lib/stock-allocation/apply-catalog-quantity-reconcile";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createAuditLog } from "@/prisma/audit-log";
import {
  createProductBodySchema,
  updateProductBodySchema,
} from "@/lib/validations/product";
// NOTE: Performance tracking wrapper is available but deferred until after all features are implemented
// import { withPerformanceTracking } from "@/lib/api/performance-wrapper";

/**
 * GET /api/products
 * Fetch all products for the authenticated user
 * Uses Redis caching for improved performance
 *
 * TODO (Future): Wrap with withPerformanceTracking() after all features are implemented
 * Example: export const GET = withPerformanceTracking(async (request) => { ... })
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

    const isSupplier = session.role === "supplier";
    let cacheKey: string;
    let productWhere: { userId: string } | { supplierId: string };

    if (isSupplier) {
      const supplier = await getSupplierByUserId(session.id);
      if (!supplier) {
        return NextResponse.json([]);
      }
      // Include withOwnerNames so cached response includes productOwnerName (avoids stale cache without it)
      cacheKey = cacheKeys.products.list({
        supplierId: supplier.id,
        withOwnerNames: true,
      });
      productWhere = { supplierId: supplier.id };
    } else {
      cacheKey = cacheKeys.products.list({ userId: session.id });
      productWhere = { userId: session.id };
    }

    // Try to get from cache first
    const cachedProducts = await getCache<unknown[]>(cacheKey);
    if (cachedProducts) {
      logger.info(`✅ Cache hit for products: ${cacheKey}`);
      return NextResponse.json(cachedProducts);
    }

    // Cache miss: fetch from database
    logger.info(
      `❌ Cache miss for products: ${cacheKey} - fetching from database`,
    );

    // Fetch products (by userId for admin, by supplierId for supplier)
    const products = await prisma.product.findMany({
      where: mergeProductListWhere(productWhere),
      orderBy: { createdAt: "desc" },
    });

    // Fetch all categories and suppliers once
    const categoryIds = [...new Set(products.map((p) => p.categoryId))];
    const supplierIds = [...new Set(products.map((p) => p.supplierId))];

    const categorySupplierPromise = Promise.all([
      prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      }),
      prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, name: true },
      }),
    ]);

    // For supplier view: fetch product owner (user) names for "Product Owner" column
    const ownerPromise = isSupplier
      ? prisma.user.findMany({
          where: {
            id: { in: [...new Set(products.map((p) => p.userId))] },
          },
          select: { id: true, name: true },
        })
      : Promise.resolve([]);

    const [[categories, suppliers], ownerUsers] = await Promise.all([
      categorySupplierPromise,
      ownerPromise,
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));
    const ownerNameMap = new Map(
      ownerUsers.map((u) => [u.id, u.name ?? u.id]),
    );

    // Transform products with lookups
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: Number(product.quantity),
      reservedQuantity: Number(product.reservedQuantity ?? 0),
      status: product.status,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      category: categoryMap.get(product.categoryId) || "Unknown",
      supplier: supplierMap.get(product.supplierId) || "Unknown",
      userId: product.userId,
      createdBy: product.createdBy,
      updatedBy: product.updatedBy || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
      qrCodeUrl: product.qrCodeUrl || null,
      imageUrl: product.imageUrl || null,
      imageFileId: product.imageFileId || null,
      expirationDate: product.expirationDate?.toISOString() || null,
      ...(isSupplier && {
        productOwnerName: ownerNameMap.get(product.userId) ?? null,
      }),
    }));

    // Cache the result for 5 minutes
    await setCache(cacheKey, transformedProducts, 300);

    return NextResponse.json(transformedProducts);
  } catch (error) {
    logger.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role === "supplier") {
      return NextResponse.json(
        { error: "Suppliers cannot create products; only admins can." },
        { status: 403 },
      );
    }

    const userId = session.id;
    const body = await request.json();

    const validationResult = createProductBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid product creation data", {
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
      name,
      sku,
      price,
      quantity,
      status,
      categoryId,
      supplierId,
      imageUrl,
      imageFileId,
      expirationDate,
    } = validationResult.data;

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "SKU must be unique" },
        { status: 400 },
      );
    }

    // Create product with audit fields
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        price,
        quantity: BigInt(quantity) as any,
        status,
        userId,
        createdBy: userId, // Set createdBy same as userId
        categoryId,
        supplierId,
        imageUrl: imageUrl || null,
        imageFileId: imageFileId || null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        createdAt: new Date(),
        updatedAt: null, // Set to null on creation - will be set when updated
      },
    });

    createAuditLog({
      userId,
      action: "create",
      entityType: "product",
      entityId: product.id,
      details: { productName: product.name, sku: product.sku },
    }).catch(() => {});

    // Fetch category and supplier data for the response
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    // Generate QR code and upload to ImageKit (async, don't block response)
    generateAndUploadQRCode(
      JSON.stringify({
        productId: product.id,
        sku: product.sku,
        name: product.name,
      }),
      `product-${product.sku}`,
      200,
      "/stock-inventory/qr-codes/",
    )
      .then(async (qrCodeData) => {
        // Update product with QR code URL and fileId
        await prisma.product.update({
          where: { id: product.id },
          data: {
            qrCodeUrl: qrCodeData.url,
            qrCodeFileId: qrCodeData.fileId,
          },
        });
      })
      .catch((error) => {
        // Log error but don't fail the request
        logger.error("Failed to generate QR code for new product:", error);
      });

    // Check stock level and send email alerts if needed (async, don't block response)
    // Fetch user email for notifications
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    checkAndSendStockAlerts(
      {
        name: product.name,
        quantity: Number(product.quantity),
        sku: product.sku,
        category: category?.name,
      },
      undefined, // No previous quantity for new products
      user?.email || undefined,
      user?.name || undefined,
      userId, // Pass userId to check email preferences
    ).catch((error) => {
      // Log error but don't fail the request
      logger.error(
        "Failed to check and send stock alerts for new product:",
        error,
      );
    });

    // Global invalidation: products affect categories, suppliers, dashboard
    await invalidateOnProductChange();
    // Transform product to match expected format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: Number(product.quantity),
      status: product.status,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      category: category?.name || "Unknown",
      supplier: supplier?.name || "Unknown",
      userId: product.userId,
      createdBy: product.createdBy,
      updatedBy: product.updatedBy || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
      qrCodeUrl: product.qrCodeUrl || null,
    };

    return NextResponse.json(transformedProduct, { status: 201 });
  } catch (error) {
    logger.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/products
 * Update an existing product
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role === "supplier") {
      return NextResponse.json(
        { error: "Suppliers cannot update products; only admins can." },
        { status: 403 },
      );
    }

    const userId = session.id;
    const body = await request.json();

    const validationResult = updateProductBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid product update data", {
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
      id,
      name,
      sku,
      price,
      quantity,
      status,
      categoryId,
      supplierId,
      imageUrl,
      imageFileId,
      expirationDate,
    } = validationResult.data;

    // Verify product belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: mergeProductListWhere({ id, userId }),
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found or unauthorized" },
        { status: 404 },
      );
    }

    // Check if SKU is being changed and if new SKU already exists
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: "SKU must be unique" },
          { status: 400 },
        );
      }
    }

    // Handle image deletion if imageUrl is being cleared
    const oldImageFileId = existingProduct.imageFileId;
    if (imageUrl === "" && oldImageFileId) {
      // Delete old image from ImageKit (async, don't block)
      deleteProductImageFromImageKit(oldImageFileId).catch((error) => {
        if (!isImageKitNotFoundError(error)) {
          logger.warn("Failed to delete old product image:", error);
        }
      });
    }

    const productUpdateData = {
      ...(name && { name }),
      ...(sku && { sku }),
      ...(price !== undefined && { price }),
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(supplierId && { supplierId }),
      ...(imageUrl !== undefined && {
        imageUrl: imageUrl === "" ? null : imageUrl,
      }),
      ...(imageFileId !== undefined && {
        imageFileId: imageFileId === "" ? null : imageFileId,
      }),
      ...(expirationDate !== undefined && {
        expirationDate:
          expirationDate === "" || expirationDate === null
            ? null
            : new Date(expirationDate),
      }),
      updatedBy: session.id,
      updatedAt: new Date(),
    };

    const quantityChanged =
      quantity !== undefined &&
      existingProduct.quantity !== BigInt(quantity);

    let stockReconcile: { unitsRemovedFromWarehouses: number } | undefined;

    if (quantityChanged) {
      const allocationRows = await getStockAllocationsByProduct(id);
      const reconcilePlan = planCatalogQuantityReconcile({
        currentCatalog: Number(existingProduct.quantity),
        newCatalog: quantity,
        productReserved: Number(existingProduct.reservedQuantity ?? 0),
        allocations: allocationRows.map((row) => ({
          id: row.id,
          quantity: Number(row.quantity),
          reservedQuantity: Number(row.reservedQuantity ?? 0),
        })),
      });

      if (!reconcilePlan.ok) {
        return NextResponse.json(
          {
            error: reconcilePlan.blockedReason,
            reservedCommitment: reconcilePlan.reservedCommitment,
            totalAllocated: reconcilePlan.totalAllocated,
            reducible: reconcilePlan.reducible,
            overage: reconcilePlan.overage,
          },
          { status: 409 },
        );
      }

      if (reconcilePlan.shrinkSteps.length > 0) {
        stockReconcile = await applyCatalogQuantityReconcile({
          productId: id,
          newCatalog: quantity,
          shrinkSteps: reconcilePlan.shrinkSteps,
          productUpdate: productUpdateData,
        });
      } else {
        await prisma.product.update({
          where: { id },
          data: {
            ...productUpdateData,
            quantity: BigInt(quantity) as never,
          },
        });
      }

      await scheduleInvalidateStockAllocationCaches();
    } else {
      await prisma.product.update({
        where: { id },
        data: productUpdateData,
      });
    }

    const product = await prisma.product.findUniqueOrThrow({ where: { id } });

    const fieldsUpdated: string[] = [];
    if (name && name !== existingProduct.name) fieldsUpdated.push("Name");
    if (sku && sku !== existingProduct.sku) fieldsUpdated.push("SKU");
    if (price !== undefined && Number(existingProduct.price) !== price) fieldsUpdated.push("Price");
    if (quantity !== undefined && existingProduct.quantity !== BigInt(quantity)) fieldsUpdated.push("Quantity");
    if (status && status !== existingProduct.status) fieldsUpdated.push("Status");
    if (categoryId && categoryId !== existingProduct.categoryId) fieldsUpdated.push("Category");
    if (supplierId && supplierId !== existingProduct.supplierId) fieldsUpdated.push("Supplier");
    if (imageUrl !== undefined) fieldsUpdated.push("Image");
    if (expirationDate !== undefined) fieldsUpdated.push("Expiration Date");

    createAuditLog({
      userId: session.id,
      action: "update",
      entityType: "product",
      entityId: product.id,
      details: {
        productName: product.name,
        ...(fieldsUpdated.length > 0 && { fieldsUpdated }),
      },
    }).catch(() => {});

    // Fetch category and supplier data for the response
    const category = await prisma.category.findUnique({
      where: { id: product.categoryId },
    });
    const supplier = await prisma.supplier.findUnique({
      where: { id: product.supplierId },
    });

    // Regenerate QR code if SKU or name changed (async, don't block response)
    if (sku || name) {
      // Get the old fileId before updating product
      const oldFileId = product.qrCodeFileId;

      generateAndUploadQRCode(
        JSON.stringify({
          productId: product.id,
          sku: product.sku,
          name: product.name,
        }),
        `product-${product.sku}`,
        200,
        "/stock-inventory/qr-codes/",
      )
        .then(async (qrCodeData) => {
          // Update product with new QR code URL and fileId
          await prisma.product.update({
            where: { id: product.id },
            data: {
              qrCodeUrl: qrCodeData.url,
              qrCodeFileId: qrCodeData.fileId,
            },
          });

          // Delete old QR code from ImageKit if it exists
          if (oldFileId) {
            try {
              await deleteQRCodeFromImageKit(oldFileId);
              logger.debug(
                `Deleted old QR code file from ImageKit: ${oldFileId}`,
              );
            } catch (deleteError) {
              if (!isImageKitNotFoundError(deleteError)) {
                logger.warn(
                  `Failed to delete old QR code from ImageKit: ${oldFileId}`,
                  deleteError,
                );
              }
            }
          }
        })
        .catch((error) => {
          // Log error but don't fail the request
          logger.error(
            "Failed to regenerate QR code for updated product:",
            error,
          );
        });
    }

    // Check stock level and send email alerts if needed (async, don't block response)
    // Only check if quantity changed and product is low stock or out of stock
    const previousQuantity = Number(existingProduct.quantity);
    const currentQuantity = Number(product.quantity);
    if (previousQuantity !== currentQuantity) {
      // Fetch user email for notifications
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      checkAndSendStockAlerts(
        {
          name: product.name,
          quantity: currentQuantity,
          sku: product.sku,
          category: category?.name,
        },
        previousQuantity, // Pass previous quantity to avoid duplicate alerts
        user?.email || undefined,
        user?.name || undefined,
        userId, // Pass userId to check email preferences
      ).catch((error) => {
        // Log error but don't fail the request
        logger.error(
          "Failed to check and send stock alerts for updated product:",
          error,
        );
      });
    }

    // Global invalidation: products affect categories, suppliers, dashboard
    await invalidateOnProductChange();
    // Transform product to match expected format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: Number(product.quantity),
      status: product.status,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      category: category?.name || "Unknown",
      supplier: supplier?.name || "Unknown",
      userId: product.userId,
      createdBy: product.createdBy,
      updatedBy: product.updatedBy || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
      qrCodeUrl: product.qrCodeUrl || null,
      imageUrl: product.imageUrl || null,
      imageFileId: product.imageFileId || null,
      expirationDate: product.expirationDate?.toISOString() || null,
      ...(stockReconcile
        ? { stockReconcile: { unitsRemovedFromWarehouses: stockReconcile.unitsRemovedFromWarehouses } }
        : {}),
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    logger.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/products
 * Hard-delete when no order history; soft-delete (archive) when only completed orders exist.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role === "supplier") {
      return NextResponse.json(
        { error: "Suppliers cannot delete products; only admins can." },
        { status: 403 },
      );
    }

    const userId = session.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const existingProduct = await prisma.product.findFirst({
      where: mergeProductListWhere({ id, userId }),
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found, already archived, or unauthorized" },
        { status: 404 },
      );
    }

    const orderItems = await prisma.orderItem.findMany({
      where: { productId: id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const strategy = getDeleteStrategy(orderItems);

    if (strategy === "block") {
      const activeOrders = orderItems
        .filter((item) => isActiveOrderStatus(item.order.status))
        .map((item) => item.order);

      const uniqueActiveOrders = Array.from(
        new Map(activeOrders.map((order) => [order.id, order])).values(),
      );

      const ordersWithInvoices = uniqueActiveOrders.filter(
        (order) => order.invoice,
      );

      let errorMessage = `Cannot delete product "${existingProduct.name}" because `;
      const reasons: string[] = [];
      const statusCounts: Record<string, number> = {};
      uniqueActiveOrders.forEach((order) => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      const statusMessages = Object.entries(statusCounts).map(
        ([status, count]) =>
          `${count} ${status} order${count > 1 ? "s" : ""}`,
      );
      reasons.push(
        `it has ${uniqueActiveOrders.length} active order${uniqueActiveOrders.length > 1 ? "s" : ""} (${statusMessages.join(", ")})`,
      );

      if (ordersWithInvoices.length > 0) {
        reasons.push(
          `${ordersWithInvoices.length} invoice${ordersWithInvoices.length > 1 ? "s" : ""} ${ordersWithInvoices.length > 1 ? "are" : "is"} associated with ${ordersWithInvoices.length > 1 ? "these orders" : "this order"}`,
        );
      }

      const completedOrders = orderItems.filter(
        (item) => !isActiveOrderStatus(item.order.status),
      );
      if (completedOrders.length > 0) {
        const uniqueCompletedOrders = Array.from(
          new Map(
            completedOrders.map((item) => [item.order.id, item.order]),
          ).values(),
        );
        reasons.push(
          `Additionally, there ${uniqueCompletedOrders.length > 1 ? "are" : "is"} ${uniqueCompletedOrders.length} completed order${uniqueCompletedOrders.length > 1 ? "s" : ""} (delivered/cancelled) in the system history`,
        );
      }

      errorMessage += `${reasons.join(". ")}. Please wait until all active orders are delivered or cancelled before deleting this product.`;

      return NextResponse.json(
        {
          error: errorMessage,
          details: {
            activeOrdersCount: uniqueActiveOrders.length,
            invoicesCount: ordersWithInvoices.length,
            totalOrdersCount: Array.from(
              new Map(
                orderItems.map((item) => [item.order.id, item.order]),
              ).values(),
            ).length,
            activeOrderStatuses: Object.fromEntries(
              Object.entries(
                uniqueActiveOrders.reduce(
                  (acc, order) => {
                    acc[order.status] = (acc[order.status] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                ),
              ),
            ),
          },
        },
        { status: 409 },
      );
    }

    if (strategy === "soft") {
      await prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: session.id,
          updatedAt: new Date(),
          updatedBy: session.id,
        },
      });

      createAuditLog({
        userId: session.id,
        action: "delete",
        entityType: "product",
        entityId: id,
        details: {
          productName: existingProduct.name,
          mode: "soft",
        },
      }).catch(() => {});

      await invalidateOnProductChange();
      return NextResponse.json({ success: true, mode: "soft" as const });
    }

    // Hard delete: DB first (fast response), ImageKit cleanup deferred after response
    await prisma.stockAllocation.deleteMany({ where: { productId: id } });

    await prisma.product.delete({
      where: { id },
    });

    const mediaSnapshot = {
      qrCodeFileId: existingProduct.qrCodeFileId,
      imageFileId: existingProduct.imageFileId,
    };
    scheduleAfterResponse(async () => {
      try {
        await cleanupProductMediaFromImageKit(mediaSnapshot);
      } catch (error) {
        if (!isImageKitNotFoundError(error)) {
          logger.warn(
            `Deferred ImageKit cleanup after hard delete failed for product ${id}:`,
            error,
          );
        }
      }
    }, "product-hard-delete-imagekit");

    createAuditLog({
      userId: session.id,
      action: "delete",
      entityType: "product",
      entityId: id,
      details: { productName: existingProduct.name, mode: "hard" },
    }).catch(() => {});
    await invalidateOnProductChange();
    return NextResponse.json({ success: true, mode: "hard" as const });
  } catch (error) {
    logger.error("Error deleting product:", error);

    if (isPrismaRelationViolation(error)) {
      return NextResponse.json(
        {
          error:
            "Product cannot be removed because it is linked to order history. Products with past orders are archived instead of permanently deleted.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete product. Please try again later." },
      { status: 500 },
    );
  }
}
