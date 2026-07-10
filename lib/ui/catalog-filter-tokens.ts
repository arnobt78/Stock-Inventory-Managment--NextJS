/**
 * REQ-0041 — shared hue tokens for catalog status filters and export menus.
 * Category (sky), supplier (emerald), warehouse select (cyan); export violet/teal.
 */
import type { LucideIcon } from "lucide-react";
import { FolderTree, Truck, Warehouse } from "lucide-react";

export type CatalogEntity = "category" | "supplier" | "warehouse";

export type CatalogStatusFilter = "all" | "active" | "inactive";

export type ExportAccent = "violet" | "teal";

export const CATALOG_ENTITY_META: Record<
  CatalogEntity,
  {
    allLabel: string;
    icon: LucideIcon;
    selectTriggerClass: string;
    selectPlaceholderClass: string;
    selectContentClass: string;
    selectItemClass: string;
  }
> = {
  category: {
    allLabel: "All Categories",
    icon: FolderTree,
    selectTriggerClass:
      "h-10 w-full sm:w-[180px] rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 dark:from-sky-500/25 dark:via-sky-500/15 dark:to-sky-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:from-sky-500/35 hover:via-sky-500/25 hover:to-sky-500/15 dark:hover:border-sky-300/40 dark:hover:from-sky-500/35 dark:hover:via-sky-500/25 dark:hover:to-sky-500/15 font-normal",
    selectPlaceholderClass:
      "h-10 w-full sm:w-[180px] rounded-[28px] border border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] font-normal flex items-center justify-between px-3 py-2 text-sm",
    selectContentClass:
      "rounded-[28px] border border-sky-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md shadow-[0_10px_30px_rgba(2,132,199,0.15)]",
    selectItemClass:
      "text-gray-700 dark:text-white/80 focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
  supplier: {
    allLabel: "All Suppliers",
    icon: Truck,
    selectTriggerClass:
      "h-10 w-full sm:w-[180px] rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-emerald-500/10 dark:from-emerald-500/25 dark:via-emerald-500/15 dark:to-emerald-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] backdrop-blur-md transition duration-200 hover:border-emerald-300/40 hover:from-emerald-500/35 hover:via-emerald-500/25 hover:to-emerald-500/15 dark:hover:border-emerald-300/40 dark:hover:from-emerald-500/35 dark:hover:via-emerald-500/25 dark:hover:to-emerald-500/15 font-normal",
    selectPlaceholderClass:
      "h-10 w-full sm:w-[180px] rounded-[28px] border border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-emerald-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] font-normal flex items-center justify-between px-3 py-2 text-sm",
    selectContentClass:
      "rounded-[28px] border border-emerald-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md shadow-[0_10px_30px_rgba(16,185,129,0.15)]",
    selectItemClass:
      "text-gray-700 dark:text-white/80 focus:bg-emerald-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
  warehouse: {
    allLabel: "All Warehouses",
    icon: Warehouse,
    selectTriggerClass:
      "h-10 w-full sm:w-[180px] rounded-[28px] border border-cyan-400/30 dark:border-cyan-400/30 bg-gradient-to-r from-cyan-500/25 via-cyan-500/15 to-cyan-500/10 dark:from-cyan-500/25 dark:via-cyan-500/15 dark:to-cyan-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(6,182,212,0.2)] backdrop-blur-md transition duration-200 hover:border-cyan-300/40 hover:from-cyan-500/35 hover:via-cyan-500/25 hover:to-cyan-500/15 dark:hover:border-cyan-300/40 dark:hover:from-cyan-500/35 dark:hover:via-cyan-500/25 dark:hover:to-cyan-500/15 font-normal",
    selectPlaceholderClass:
      "h-10 w-full sm:w-[180px] rounded-[28px] border border-cyan-400/30 bg-gradient-to-r from-cyan-500/25 via-cyan-500/15 to-cyan-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(6,182,212,0.2)] font-normal flex items-center justify-between px-3 py-2 text-sm",
    selectContentClass:
      "rounded-[28px] border border-cyan-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md shadow-[0_10px_30px_rgba(6,182,212,0.15)]",
    selectItemClass:
      "text-gray-700 dark:text-white/80 focus:bg-cyan-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
};

export const EXPORT_MENU_STYLES: Record<
  ExportAccent,
  { triggerClass: string; contentClass: string; itemFocusClass: string }
> = {
  violet: {
    triggerClass:
      "group h-10 w-full sm:w-auto flex items-center gap-2 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 dark:from-violet-500/25 dark:via-violet-500/15 dark:to-violet-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(139,92,246,0.2)] backdrop-blur-md transition duration-200 hover:border-violet-300/40 hover:from-violet-500/35 hover:via-violet-500/25 hover:to-violet-500/15 dark:hover:border-violet-300/40 dark:hover:from-violet-500/35 dark:hover:via-violet-500/25 dark:hover:to-violet-500/15",
    contentClass:
      "rounded-[28px] border border-violet-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md",
    itemFocusClass:
      "cursor-pointer text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
  teal: {
    triggerClass:
      "group h-10 w-full sm:w-auto flex items-center gap-2 rounded-[28px] border border-teal-400/30 dark:border-teal-400/30 bg-gradient-to-r from-teal-500/25 via-teal-500/15 to-teal-500/10 dark:from-teal-500/25 dark:via-teal-500/15 dark:to-teal-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(20,184,166,0.2)] backdrop-blur-md transition duration-200 hover:border-teal-300/40 hover:from-teal-500/35 hover:via-teal-500/25 hover:to-teal-500/15 dark:hover:border-teal-300/40 dark:hover:from-teal-500/35 dark:hover:via-teal-500/25 dark:hover:to-teal-500/15",
    contentClass:
      "rounded-[28px] border border-teal-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md",
    itemFocusClass:
      "cursor-pointer text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white focus:bg-teal-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
};
