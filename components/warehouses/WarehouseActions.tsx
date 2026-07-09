"use client";

import { useState } from "react";
import { Warehouse } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteWarehouse } from "@/hooks/queries";
import { AlertDialogWrapper } from "@/components/dialogs";
import { MoreVertical, Edit, Trash2 } from "lucide-react";

interface WarehouseActionsProps {
  row: { original: Warehouse };
  onEdit: (warehouse: Warehouse) => void;
}

export default function WarehouseActions({
  row,
  onEdit,
}: WarehouseActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteWarehouseMutation = useDeleteWarehouse();
  const isDeleting = deleteWarehouseMutation.isPending;

  const handleEdit = () => {
    onEdit(row.original);
  };

  const handleDelete = async () => {
    try {
      await deleteWarehouseMutation.mutateAsync(row.original.id);
      setDeleteDialogOpen(false);
    } catch {
      // Error toast is handled by mutation hook
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
          <DropdownMenuItem
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Warehouse
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
            className="flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Warehouse"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogWrapper
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description={`This will permanently delete the warehouse "${row.original.name}".`}
        actionLabel="Delete"
        actionLoadingLabel="Deleting..."
        isLoading={isDeleting}
        onAction={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        actionVariant="destructive"
      />
    </>
  );
}
