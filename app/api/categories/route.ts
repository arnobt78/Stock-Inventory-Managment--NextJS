/**
 * Categories API Route Handler
 * App Router route handler for category CRUD operations
 * Migrated from Pages API to App Router
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { createAuditLog } from "@/prisma/audit-log";
import {
  createCategoryBodySchema,
  updateCategoryBodySchema,
} from "@/lib/validations/category";
import { scheduleInvalidateCategoryCaches } from "@/lib/cache";

/**
 * GET /api/categories
 * Fetch all categories for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    const categories = await prisma.category.findMany({
      where: { userId },
    });

    return NextResponse.json(categories);
  } catch (error) {
    logger.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const body = await request.json();

    const validationResult = createCategoryBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid category creation data", {
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

    // Create category with audit fields and new optional fields
    const category = await prisma.category.create({
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
      entityType: "category",
      entityId: category.id,
      details: { name: category.name },
    }).catch(() => {});

    // Global invalidation: categories affect products, dashboard
    scheduleInvalidateCategoryCaches();
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    logger.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories
 * Update an existing category
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const body = await request.json();

    const validationResult = updateCategoryBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid category update data", {
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

    // Verify category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found or unauthorized" },
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
      updatedBy: userId, // Track who updated the category
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

    // Update category with audit fields and new optional fields
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    createAuditLog({
      userId,
      action: "update",
      entityType: "category",
      entityId: id,
      details: { name: category.name },
    }).catch(() => {});

    // Global invalidation: categories affect products, dashboard
    scheduleInvalidateCategoryCaches();
    return NextResponse.json(category);
  } catch (error) {
    logger.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories
 * Delete a category
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
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Verify category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    createAuditLog({
      userId,
      action: "delete",
      entityType: "category",
      entityId: id,
      details: { name: existingCategory.name },
    }).catch(() => {});

    // Global invalidation: categories affect products, dashboard
    scheduleInvalidateCategoryCaches();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
