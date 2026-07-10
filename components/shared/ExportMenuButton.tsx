"use client";

/**
 * REQ-0041 — catalog export menu with muted chevron that rotates 180° when open.
 */
import { ChevronDown, Download } from "lucide-react";
import { FiFileText, FiGrid } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EXPORT_MENU_STYLES,
  type ExportAccent,
} from "@/lib/ui/catalog-filter-tokens";
import { cn } from "@/lib/utils";

export type ExportMenuButtonProps = {
  label: string;
  accent?: ExportAccent;
  onExportCsv: () => void;
  onExportExcel: () => void;
  className?: string;
  /** Disable when filtered list is empty (orders/invoices). */
  disabled?: boolean;
};

export function ExportMenuButton({
  label,
  accent = "violet",
  onExportCsv,
  onExportExcel,
  className,
  disabled = false,
}: ExportMenuButtonProps) {
  const styles = EXPORT_MENU_STYLES[accent];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            styles.triggerClass,
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          {label}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={styles.contentClass}>
        <DropdownMenuItem onClick={onExportCsv} className={styles.itemFocusClass}>
          <FiFileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onExportExcel}
          className={styles.itemFocusClass}
        >
          <FiGrid className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
