/**
 * Server-side data fetching for admin History (Import History + Activity Log) page SSR.
 * Only import this from server code (e.g. app/admin/activity-history/page.tsx).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { getImportHistoryByUser } from "@/prisma/import-history";
import {
  getAuditLogsForActivity,
  type ActivityLogPeriod,
} from "@/prisma/audit-log";
import { prisma } from "@/prisma/client";
import type { ImportHistoryForPage, ImportHistoryErrorItem, AuditLog } from "@/types";

/**
 * Fetch import history for the given user.
 * Uses the same cache key and transform as GET /api/import-history.
 */
export async function getHistoryForUser(
  userId: string,
): Promise<ImportHistoryForPage[]> {
  const cacheKey = cacheKeys.history.list({ userId });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<ImportHistoryForPage[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const records = await getImportHistoryByUser(userId);

  const transformed: ImportHistoryForPage[] = records.map((r) => {
    const errors = r.errors as ImportHistoryErrorItem[] | null;
    return {
      id: r.id,
      userId: r.userId,
      importType: r.importType as ImportHistoryForPage["importType"],
      fileName: r.fileName,
      fileSize: r.fileSize,
      totalRows: r.totalRows,
      successRows: r.successRows,
      failedRows: r.failedRows,
      errors: Array.isArray(errors) ? errors : null,
      status: r.status as ImportHistoryForPage["status"],
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    };
  });

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch audit logs for activity history section with date filter.
 * Only returns logs for the given user (self / product owner).
 */
export async function getActivityLogsForPage(
  period: ActivityLogPeriod = "7days",
  userId: string,
): Promise<AuditLog[]> {
  const logs = await getAuditLogsForActivity(period, userId);
  const userIds = [...new Set(logs.map((l) => l.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return logs.map((l) => ({
    id: l.id,
    userId: l.userId,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    details: l.details,
    ipAddress: l.ipAddress,
    userAgent: l.userAgent,
    createdAt: l.createdAt.toISOString(),
    user: (() => {
      const u = userMap.get(l.userId);
      return u
        ? {
            id: l.userId,
            name: u.name ?? null,
            username: u.name ?? undefined,
            email: u.email,
          }
        : undefined;
    })(),
  })) as AuditLog[];
}
