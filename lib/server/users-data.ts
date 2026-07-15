/**
 * Server-side data for admin User Management page
 * Fetches all users (no password). Only import from server code (e.g. app/admin/user-management/page.tsx, GET /api/users).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { getAllUsers } from "@/prisma/user-admin";
import type { UserForAdmin } from "@/types";

function transform(
  r: Awaited<ReturnType<typeof getAllUsers>>[number],
): UserForAdmin {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    username: r.username,
    role: r.role as UserForAdmin["role"],
    image: r.image,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
  };
}

export async function getUsersForAdmin(): Promise<UserForAdmin[]> {
  const cacheKey = cacheKeys.userManagement.list({});
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<UserForAdmin[]>(cacheKey);
  if (cached) return cached;

  const records = await getAllUsers();
  const result = records.map(transform);
  await setCache(cacheKey, result, 300, { fetchedAt: cacheReadStartedAt });
  return result;
}
