/**
 * Maps Prisma session user → app User for SSR AuthProvider hydration (REQ-0025).
 * Keeps navbar avatar (incl. RoboHash fallback) visible on first paint without client /api/auth/session.
 */
import type { User as PrismaUser } from "@prisma/client";
import type { User } from "@/types";

export function mapSessionToAppUser(session: PrismaUser): User {
  return {
    id: session.id,
    name: session.name ?? undefined,
    email: session.email,
    image: session.image ?? undefined,
    role: session.role ?? "user",
  };
}
