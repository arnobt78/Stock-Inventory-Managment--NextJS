/**
 * Shared import history detail response transform — used by API GET and SSR prefetch.
 * REQ-0024: single source of truth for import history detail JSON shape.
 */

import type { ImportHistoryForPage, ImportHistoryErrorItem } from "@/types";
import type { Prisma } from "@prisma/client";

export type ImportHistoryRecord = Prisma.ImportHistoryGetPayload<
  Record<string, never>
>;

export function transformHistoryDetail(
  r: ImportHistoryRecord,
): ImportHistoryForPage {
  const raw = r.errors as unknown;
  const errors: ImportHistoryErrorItem[] | null = Array.isArray(raw)
    ? raw
    : null;
  return {
    id: r.id,
    userId: r.userId,
    importType: r.importType as ImportHistoryForPage["importType"],
    fileName: r.fileName,
    fileSize: r.fileSize,
    totalRows: r.totalRows,
    successRows: r.successRows,
    failedRows: r.failedRows,
    errors,
    status: r.status as ImportHistoryForPage["status"],
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}
