/**
 * Navbar active-state helper — exact match or nested route (/products/xyz).
 */

export function isNavPathActive(
  pathname: string | null | undefined,
  itemPath: string,
): boolean {
  if (!pathname) return false;
  if (pathname === itemPath) return true;
  if (itemPath === "/") return false;
  return pathname.startsWith(`${itemPath}/`);
}
