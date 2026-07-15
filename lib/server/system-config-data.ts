/**
 * Server-side system config fetch for admin settings SSR.
 * Mirrors GET /api/system-config shape (configs + category labels).
 */

import { getCache, setCache } from "@/lib/cache";
import {
  getAllSystemConfigs,
  initializeDefaultConfigs,
} from "@/prisma/system-config";
import { CATEGORY_LABELS } from "@/types";
import type { SystemConfig } from "@/types";

const CACHE_KEY = "system-config:all";

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
    category: config.category as SystemConfig["category"],
    isPublic: config.isPublic,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt?.toISOString() ?? null,
    updatedBy: config.updatedBy,
  };
}

export type SystemConfigForPage = {
  configs: SystemConfig[];
  categories: Record<string, string>;
};

/** Fetch all system configs for admin settings page (Redis-cached). */
export async function getSystemConfigForAdmin(): Promise<SystemConfigForPage> {
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<SystemConfig[]>(CACHE_KEY);
  if (cached) {
    return { configs: cached, categories: CATEGORY_LABELS };
  }

  await initializeDefaultConfigs();
  const configs = (await getAllSystemConfigs()).map(transform);
  await setCache(CACHE_KEY, configs, 300, { fetchedAt: cacheReadStartedAt });

  return { configs, categories: CATEGORY_LABELS };
}
