/**
 * REQ-0039/0040 — shared avatar URL resolution for all SafeAvatarImage consumers.
 * Primary: Google OAuth or custom profile image; fallback: stable robohash per seed.
 */
import type { User } from "@/types";

/** Robohash seed URL — same seed always gets the same robot. */
export function getRoboHashAvatarUrl(nameOrId: string): string {
  return `https://robohash.org/${encodeURIComponent(nameOrId)}?set=set1&size=80x80`;
}

export type UserAvatarSources = {
  src: string;
  fallbackSrc: string;
};

/**
 * Primary image + robohash fallback for any entity keyed by stable seed (userId, name, etc.).
 * Reviews/tickets use userId; Navbar uses name || id via resolveUserAvatarSources.
 */
export function resolveAvatarSourcesFromSeed(
  seed: string,
  primaryImage?: string | null,
): UserAvatarSources {
  const fallbackSrc = getRoboHashAvatarUrl(seed);
  const preferredImage =
    primaryImage &&
    typeof primaryImage === "string" &&
    primaryImage.trim() !== ""
      ? primaryImage.trim()
      : null;

  return {
    src: preferredImage ?? fallbackSrc,
    fallbackSrc,
  };
}

/**
 * Resolves primary + fallback for logged-in user (Navbar/Sidebar).
 * When Google/custom image fails to load, SafeAvatarImage swaps to fallbackSrc.
 */
export function resolveUserAvatarSources(
  user: Pick<User, "id" | "name" | "image"> | null,
): UserAvatarSources | null {
  if (!user) return null;

  const seed = user.name?.trim() || String(user.id ?? "user");
  return resolveAvatarSourcesFromSeed(seed, user.image);
}
