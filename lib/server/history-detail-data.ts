/**
 * Server-side import history detail fetch for SSR prefetch.
 * Mirrors GET /api/import-history/:id auth + response shape.
 * REQ-0024
 */

import { getImportHistoryById } from "@/prisma/import-history";
import { transformHistoryDetail } from "@/lib/history/transform-history-detail";
import type { ImportHistoryForPage } from "@/types";
import type { SessionForDetail } from "@/lib/server/order-detail-data";

/** User-scoped import history detail for page SSR — null when not found. */
export async function getHistoryDetailForPage(
  session: SessionForDetail,
  id: string,
): Promise<ImportHistoryForPage | null> {
  const record = await getImportHistoryById(id, session.id);
  if (!record) return null;
  return transformHistoryDetail(record);
}
