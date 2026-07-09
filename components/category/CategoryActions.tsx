"use client";

import { useState } from "react";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateCategory, useDeleteCategory } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { logger } from "@/lib/logger";
import { AlertDialogWrapper } from "@/components/dialogs";
import { useRouter } from "next/navigation";
import { MoreVertical, Eye, Edit, Trash2, Copy } from "lucide-react";
import Link from "next/link";

interface CategoryActionsProps {
  row: {
    original: Category;
  };
  onEdit: (category: Category) => void;
}

/**
 * Category Actions Component
 * Provides edit and delete actions for category table rows
 */
export default function CategoryActions({ row, onEdit }: CategoryActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const isCopying = createCategoryMutation.isPending;
  const isDeleting = deleteCategoryMutation.isPending;

  // Handle Copy Category
  const handleCopyCategory = async () => {
    try {
      if (!user?.id) {
        logger.error("User ID is required for copying category");
        return;
      }

      // Create category copy using TanStack Query mutation
      await createCategoryMutation.mutateAsync({
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
      logger.error("Error copying category:", error);
    }
  };

  // Handle Edit Category
  const handleEditCategory = () => {
    try {
      onEdit(row.original);
    } catch (error) {
      logger.error("Error opening edit dialog:", error);
    }
  };

  // Handle Delete Category Confirmation
  const handleDeleteCategory = async () => {
    try {
      // Delete category using TanStack Query mutation
      await deleteCategoryMutation.mutateAsync(row.original.id);
      // Close dialog on success (toast is handled by mutation hook)
      setDeleteDialogOpen(false);
    } catch (error) {
      // Error toast is handled by the mutation hook
      logger.error("Error deleting category:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-md shadow-lg"
        >
          <DropdownMenuItem asChild>
            <Link
              href={`/categories/${row.original.id}`}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCopyCategory}
            disabled={isCopying}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {isCopying ? "Duplicating..." : "Create Duplicate"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleEditCategory}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Category
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
            className="flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Category"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialogWrapper
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description={`This action cannot be undone. This will permanently delete the category "${row.original.name}".`}
        actionLabel="Delete"
        actionLoadingLabel="Deleting..."
        isLoading={isDeleting}
        onAction={handleDeleteCategory}
        onCancel={() => setDeleteDialogOpen(false)}
        actionVariant="destructive"
      />
    </>
  );
}
