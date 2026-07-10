"use client";

import { useState } from "react";
import { Supplier } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateSupplier, useDeleteSupplier } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { logger } from "@/lib/logger";
import { clearBodyScrollLock } from "@/lib/utils";
import { AlertDialogWrapper } from "@/components/dialogs";
import { useRouter } from "next/navigation";
import { MoreVertical, Eye, Edit, Trash2, Copy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DIALOG_TABLE_ACTION_ICON } from "@/components/shared/dialog-edge-scroll";
import type { TableColumnContext } from "@/components/category/CategoryTableColumns";

interface SupplierActionsProps {
  row: {
    original: Supplier;
  };
  onEdit: (supplier: Supplier) => void;
  /** When set (e.g. from Add Supplier dialog), called before navigating so the dialog closes and the new page is not blocked by overlay/scroll-lock */
  onBeforeNavigate?: () => void;
  context?: TableColumnContext;
}

/**
 * Supplier Actions Component
 * Provides edit and delete actions for supplier table rows
 */
export default function SupplierActions({
  row,
  onEdit,
  onBeforeNavigate,
  context = "page",
}: SupplierActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const createSupplierMutation = useCreateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();
  const isCopying = createSupplierMutation.isPending;
  const isDeleting = deleteSupplierMutation.isPending;
  const isGlobalDemo = Boolean(row.original.isGlobalDemo);

  const handleViewDetails = () => {
    if (onBeforeNavigate) {
      onBeforeNavigate();
      clearBodyScrollLock();
      // Defer navigation so dialog overlay/scroll-lock can unmount first (Radix #3797)
      const href = `/suppliers/${row.original.id}`;
      setTimeout(() => router.push(href), 150);
    } else {
      router.push(`/suppliers/${row.original.id}`);
    }
  };

  // Handle Copy Supplier
  const handleCopySupplier = async () => {
    try {
      if (!user?.id) {
        logger.error("User ID is required for copying supplier");
        return;
      }

      // Create supplier copy using TanStack Query mutation
      await createSupplierMutation.mutateAsync({
        name: `${row.original.name} (copy)`,
        userId: user.id,
        status: row.original.status ?? true,
        description: row.original.description,
        notes: row.original.notes,
      });

      // Refresh router (toast is handled by mutation hook)
      router.refresh();
    } catch (error) {
      // Error toast is handled by the mutation hook
      logger.error("Error copying supplier:", error);
    }
  };

  const handleEditSupplier = () => {
    try {
      onEdit(row.original);
    } catch (error) {
      logger.error("Error opening edit dialog:", error);
    }
  };

  const handleDeleteSupplier = async () => {
    try {
      await deleteSupplierMutation.mutateAsync(row.original.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      logger.error("Error deleting supplier:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical
              className={cn(
                "h-4 w-4",
                context === "dialog"
                  ? DIALOG_TABLE_ACTION_ICON
                  : "text-gray-600 dark:text-gray-300",
              )}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-md shadow-lg"
        >
          {onBeforeNavigate ? (
            <DropdownMenuItem
              onClick={handleViewDetails}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link
                href={`/suppliers/${row.original.id}`}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={handleCopySupplier}
            disabled={isCopying || isGlobalDemo}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {isCopying ? "Duplicating..." : "Create Duplicate"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleEditSupplier}
            disabled={isGlobalDemo}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Supplier
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting || isGlobalDemo}
            className="flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Supplier"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialogWrapper
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description={`This action cannot be undone. This will permanently delete the supplier "${row.original.name}".`}
        actionLabel="Delete"
        actionLoadingLabel="Deleting..."
        isLoading={isDeleting}
        onAction={handleDeleteSupplier}
        onCancel={() => setDeleteDialogOpen(false)}
        actionVariant="destructive"
      />
    </>
  );
}
