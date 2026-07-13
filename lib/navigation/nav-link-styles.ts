/**
 * Shared nav link class builders (REQ-0094).
 * Navbar + AdminSidebar use the same active/inactive tokens for consistent feel.
 */
import { cn } from "@/lib/utils";

/** Desktop or mobile navbar item — pair with next/link prefetch. */
export function navbarNavLinkClass(
  isActive: boolean,
  variant: "desktop" | "mobile" = "desktop",
): string {
  const base =
    variant === "mobile"
      ? "inline-flex w-full items-center justify-start px-2 text-sm font-normal transition-all duration-300 ease-in-out hover:backdrop-blur-md h-auto min-h-[44px]"
      : "inline-flex items-center text-sm font-normal will-change-[background,box-shadow,color] transition-[background-image,box-shadow,color] duration-300 ease-in-out rounded-md px-2 py-2";

  if (isActive) {
    return cn(
      base,
      "text-sky-600 dark:text-sky-400 bg-gradient-to-br from-sky-500/15 via-sky-500/10 to-sky-500/5 dark:from-sky-500/20 dark:via-sky-500/10 dark:to-sky-500/5 backdrop-blur-md",
      variant === "desktop" &&
        "shadow-[0_5px_15px_rgba(2,132,199,0.2)]",
    );
  }

  return cn(
    base,
    "text-gray-700 dark:text-muted-foreground hover:text-sky-600 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5",
    variant === "desktop" &&
      "hover:backdrop-blur-md hover:shadow-[0_5px_15px_rgba(2,132,199,0.25)] dark:hover:shadow-[0_5px_15px_rgba(255,255,255,0.15)]",
  );
}

/** Admin sidebar link — pathname-aware active state. */
export function adminSidebarLinkClass(
  pathname: string | null,
  href: string,
  options?: { isSub?: boolean; collapsed?: boolean },
): string {
  const isSub = options?.isSub ?? false;
  const collapsed = options?.collapsed ?? false;
  const isActive =
    pathname === href || (href !== "/admin" && (pathname?.startsWith(href) ?? false));

  return cn(
    "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-normal transition-colors",
    isSub && !collapsed ? "pl-8" : "",
    collapsed ? "justify-center px-0 w-9 h-9 mx-auto" : "",
    isActive
      ? "bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300"
      : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300",
  );
}
