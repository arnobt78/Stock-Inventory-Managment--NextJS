"use client";

import React, { type ReactNode } from "react";

/**
 * Wrapper for pages that need a left sidebar + scrollable right content.
 * Use inside Navbar children. Sidebar stays visible (sticky); only the right content scrolls with main.
 * On phone screens the sidebar collapses to icon-only width; on sm+ it expands to full width.
 */
export interface PageWithSidebarProps {
  sidebarContent: ReactNode;
  /** Collapsed (icon-only) sidebar for phone screens */
  sidebarCollapsed?: ReactNode;
  children: ReactNode;
}

export default function PageWithSidebar({
  sidebarContent,
  sidebarCollapsed,
  children,
}: PageWithSidebarProps) {
  return (
    <div className="flex w-full gap-0 sm:gap-2 min-h-0">
      {/* Collapsed sidebar — phone only */}
      {sidebarCollapsed && (
        <aside
          className="sm:hidden sticky top-0 z-10 flex h-[calc(100vh-3.5rem)] w-12 flex-shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl"
          aria-label="Page navigation"
        >
          {sidebarCollapsed}
        </aside>
      )}
      {/* Full sidebar — sm and up */}
      <aside
        className={`sticky top-0 z-10 flex h-[calc(100vh-4.5rem)] w-64 flex-shrink-0 flex-col overflow-y-auto rounded-lg border border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl ${sidebarCollapsed ? "hidden sm:flex" : "hidden sm:flex"}`}
        aria-label="Page navigation"
      >
        {sidebarContent}
      </aside>
      {/* When no collapsed sidebar provided, show full sidebar always (legacy) */}
      {!sidebarCollapsed && (
        <aside
          className="sm:hidden sticky top-0 z-10 flex h-[calc(100vh-3.5rem)] w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl"
          aria-label="Page navigation"
        >
          {sidebarContent}
        </aside>
      )}
      <div className="min-w-0 flex-1 sm:py-6">{children}</div>
    </div>
  );
}
