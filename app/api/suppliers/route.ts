/**
 * Suppliers API Route Handler
 * App Router route handler for supplier CRUD operations
 * Migrated from Pages API to App Router
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { createAuditLog } from "@/prisma/audit-log";
import { getSuppliersForAdminIncludingDemo, getDemoSupplierUserId } from "@/prisma/supplier";
import {
  createSupplierBodySchema,
  updateSupplierBodySchema,
} from "@/lib/validations/supplier";
import { scheduleInvalidateSupplierCaches } from "@/lib/cache";

/**
 * GET /api/suppliers
 * Fetch all suppliers for the authenticated user.
 * For admin/user: includes their own suppliers plus the global Demo Supplier (test@supplier.com)
 * so every admin can assign products to the demo supplier. Clients do not use this list.
 * Each supplier includes isGlobalDemo: true when it is the demo supplier (read-only for admins).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const isClient = session.role === "client";

    const suppliers = isClient
      ? await prisma.supplier.findMany({ where: { userId } })
      : await getSuppliersForAdminIncludingDemo(userId);

    const demoUserId = await getDemoSupplierUserId();
    const withFlags = suppliers.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt?.toISOString() ?? null,
      isGlobalDemo: demoUserId != null && s.userId === demoUserId,
    }));

    return NextResponse.json(withFlags);
  } catch (error) {
    logger.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/suppliers
 * Create a new supplier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const body = await request.json();

    const validationResult = createSupplierBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid supplier creation data", {
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

    const { name, status, description, notes } = validationResult.data;

    // Create supplier with audit fields and new optional fields
    const supplier = await prisma.supplier.create({
      data: {
        name,
        userId,
        status: status ?? true,
        description:
          description && typeof description === "string"
            ? description.trim() || null
            : null,
        notes:
          notes && typeof notes === "string" ? notes.trim() || null : null,
        createdBy: userId, // Set createdBy same as userId
        createdAt: new Date(),
        updatedAt: null, // Set to null on creation - will be set when updated
      },
    });

    createAuditLog({
      userId,
      action: "create",
      entityType: "supplier",
      entityId: supplier.id,
      details: { name: supplier.name },
    }).catch(() => {});

    // Global invalidation: suppliers affect products, dashboard
    await scheduleInvalidateSupplierCaches();
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    logger.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/suppliers
 * Update an existing supplier
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const body = await request.json();

    const validationResult = updateSupplierBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid supplier update data", {
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

    const { id, name, status, description, notes } = validationResult.data;

    // Verify supplier belongs to user
    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, userId },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found or unauthorized" },
        { status: 404 }
      );
    }

    // Prepare update data with new optional fields
    const updateData: {
      name: string;
      updatedBy: string;
      updatedAt: Date;
      status?: boolean;
      description?: string | null;
      notes?: string | null;
    } = {
      name,
      updatedBy: userId, // Track who updated the supplier
      updatedAt: new Date(), // Update timestamp
    };

    // Add optional fields if provided
    if (status !== undefined) {
      updateData.status = Boolean(status);
    }
    if (description !== undefined) {
      updateData.description = description && typeof description === "string" ? description.trim() || null : null;
    }
    if (notes !== undefined) {
      updateData.notes = notes && typeof notes === "string" ? notes.trim() || null : null;
    }

    // Update supplier with audit fields and new optional fields
    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    createAuditLog({
      userId,
      action: "update",
      entityType: "supplier",
      entityId: id,
      details: { name: supplier.name },
    }).catch(() => {});

    // Global invalidation: suppliers affect products, dashboard
    await scheduleInvalidateSupplierCaches();
    return NextResponse.json(supplier);
  } catch (error) {
    logger.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/suppliers
 * Delete a supplier
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // Verify supplier belongs to user
    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, userId },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    createAuditLog({
      userId,
      action: "delete",
      entityType: "supplier",
      entityId: id,
      details: { name: existingSupplier.name },
    }).catch(() => {});

    // Global invalidation: suppliers affect products, dashboard
    await scheduleInvalidateSupplierCaches();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
