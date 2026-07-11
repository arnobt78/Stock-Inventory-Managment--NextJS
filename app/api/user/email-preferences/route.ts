/**
 * Email Preferences API Route Handler
 * App Router route handler for user email notification preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  getUserEmailPreferences,
  updateUserEmailPreferences,
} from "@/lib/email/preferences";
import { scheduleInvalidateEmailPreferenceCaches } from "@/lib/cache";
import type { EmailPreferences, UpdateEmailPreferencesInput } from "@/types/auth";
import { z } from "zod";

/**
 * Email preferences update schema
 */
const updateEmailPreferencesSchema = z.object({
  preferences: z.object({
    lowStockAlerts: z.boolean().optional(),
    stockOutNotifications: z.boolean().optional(),
    inventoryReports: z.boolean().optional(),
    productExpirationWarnings: z.boolean().optional(),
    orderConfirmations: z.boolean().optional(),
    invoiceEmails: z.boolean().optional(),
    shippingNotifications: z.boolean().optional(),
    orderStatusUpdates: z.boolean().optional(),
  }),
});

/**
 * GET /api/user/email-preferences
 * Get current user's email preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const preferences = await getUserEmailPreferences(userId);

    // Return preferences directly (matching API client expectations)
    return NextResponse.json(preferences);
  } catch (error) {
    logger.error("Error fetching email preferences", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to fetch email preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/email-preferences
 * Update current user's email preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const body = await request.json();

    // Validate request body
    const validationResult = updateEmailPreferencesSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid email preferences data", {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { preferences } = validationResult.data as UpdateEmailPreferencesInput;

    // Update preferences
    const updatedPreferences = await updateUserEmailPreferences(
      userId,
      preferences
    );
    await scheduleInvalidateEmailPreferenceCaches();
    // Return preferences directly (matching API client expectations)
    return NextResponse.json(updatedPreferences);
  } catch (error) {
    logger.error("Error updating email preferences", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to update email preferences" },
      { status: 500 }
    );
  }
}
