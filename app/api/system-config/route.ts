/**
 * System Configuration API Route
 * GET /api/system-config — get all configurations (admin)
 * PUT /api/system-config — update configurations (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  getAllSystemConfigs,
  updateSystemConfigs,
  initializeDefaultConfigs,
} from "@/prisma/system-config";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { updateSystemConfigsBodySchema } from "@/lib/validations/system-config";
import { getCache, invalidateCache, scheduleInvalidateSystemConfigCaches, setCache } from "@/lib/cache";
import type { SystemConfig, ConfigCategory } from "@/types";
import { CATEGORY_LABELS } from "@/types";

const CACHE_KEY = "system-config:all";

/**
 * Transform Prisma result to API response
 */
function transform(
  config: Awaited<ReturnType<typeof getAllSystemConfigs>>[number],
): SystemConfig {
  return {
    id: config.id,
    key: config.key,
    value: config.value,
    type: config.type as SystemConfig["type"],
    label: config.label,
    description: config.description,
    category: config.category as ConfigCategory,
    isPublic: config.isPublic,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt?.toISOString() ?? null,
    updatedBy: config.updatedBy,
  };
}

/**
 * GET /api/system-config
 * Get all system configurations (admin only)
 */
export async function GET(request: NextRequest) {
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

    // Only admin can access all configs
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check cache
    const cached = await getCache<SystemConfig[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        configs: cached,
        categories: CATEGORY_LABELS,
      });
    }

    // Initialize default configs if needed
    await initializeDefaultConfigs();

    // Get all configs
    const configs = await getAllSystemConfigs();
    const result = configs.map(transform);

    // Cache for 5 minutes
    await setCache(CACHE_KEY, result, 300);

    return NextResponse.json({
      configs: result,
      categories: CATEGORY_LABELS,
    });
  } catch (error) {
    logger.error("Error fetching system configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch system configurations" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/system-config
 * Update system configurations (admin only)
 */
export async function PUT(request: NextRequest) {
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

    // Only admin can update configs
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updateSystemConfigsBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid system config update data", {
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

    const { configs } = validationResult.data;

    // Update configs
    const updated = await updateSystemConfigs(configs, session.id);

    // Invalidate cache
    await invalidateCache(CACHE_KEY);
    await scheduleInvalidateSystemConfigCaches();
    logger.info("System configurations updated", {
      userId: session.id,
      updatedCount: updated.length,
      keys: configs.map((c) => c.key),
    });

    return NextResponse.json({
      success: true,
      message: `${updated.length} configuration(s) updated`,
    });
  } catch (error) {
    logger.error("Error updating system configs:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update system configurations",
      },
      { status: 500 },
    );
  }
}
