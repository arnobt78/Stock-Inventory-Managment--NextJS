"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts";
import { logger } from "@/lib/logger";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
} from "@/hooks/queries";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clearBodyScrollLock, cn } from "@/lib/utils";
import {
  DialogTableScrollArea,
  DIALOG_EDGE_SCROLL_BODY,
  DIALOG_EDGE_SCROLL_HEADER,
  DIALOG_EDGE_SCROLL_INNER,
  DIALOG_EDGE_SCROLL_SHELL,
  DIALOG_FORM_FIELD_EMERALD,
  DIALOG_TABLE_FRAME_EMERALD,
  DIALOG_TABLE_SECTION,
} from "@/components/shared";
import { Supplier } from "@/types";
import { createSupplierColumns } from "./SupplierTableColumns";

const SUPPLIER_DIALOG_CONTENT_CLASS = `${DIALOG_EDGE_SCROLL_SHELL} poppins border-emerald-400/30 dark:border-emerald-400/30 shadow-[0_30px_80px_rgba(16,185,129,0.35)] dark:shadow-[0_30px_80px_rgba(16,185,129,0.25)]`;

interface AddSupplierDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editingSupplier?: Supplier | null;
  onEditSupplier?: (supplier: Supplier) => void;
}

export default function AddSupplierDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editingSupplier: externalEditingSupplier,
  onEditSupplier,
}: AddSupplierDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled && controlledOnOpenChange) {
        controlledOnOpenChange(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, controlledOnOpenChange],
  );
  const [supplierName, setSupplierName] = useState("");
  const [supplierDescription, setSupplierDescription] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [supplierStatus, setSupplierStatus] = useState(true); // Default to active
  const [internalEditingSupplier, setInternalEditingSupplier] =
    useState<Supplier | null>(null);

  // Use external or internal editing supplier
  const editingSupplier =
    externalEditingSupplier !== undefined
      ? externalEditingSupplier
      : internalEditingSupplier;

  const setEditingSupplier =
    externalEditingSupplier !== undefined && onEditSupplier
      ? onEditSupplier
      : setInternalEditingSupplier;
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierDescription, setNewSupplierDescription] = useState("");
  const [newSupplierNotes, setNewSupplierNotes] = useState("");
  const [newSupplierStatus, setNewSupplierStatus] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Sync external editingSupplier with form fields
  useEffect(() => {
    if (externalEditingSupplier) {
      setNewSupplierName(externalEditingSupplier.name);
      setNewSupplierDescription(externalEditingSupplier.description || "");
      setNewSupplierNotes(externalEditingSupplier.notes || "");
      setNewSupplierStatus(externalEditingSupplier.status ?? true);
    } else if (externalEditingSupplier === null) {
      // Clear form when editingSupplier is explicitly set to null
      setNewSupplierName("");
      setNewSupplierDescription("");
      setNewSupplierNotes("");
      setNewSupplierStatus(true);
    }
  }, [externalEditingSupplier]);

  // Reset form fields when dialog closes (only when not editing)
  useEffect(() => {
    if (!open && !editingSupplier) {
      setSupplierName("");
      setSupplierDescription("");
      setSupplierNotes("");
      setSupplierStatus(true);
    }
  }, [open, editingSupplier]);

  // Use TanStack Query for data fetching
  const { data: suppliers = [], isLoading } = useSuppliers();

  // Use TanStack Query mutations
  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  const { toast } = useToast();
  const { user, isLoggedIn } = useAuth();

  // Determine loading states from mutations
  const isSubmitting = createSupplierMutation.isPending;
  const isEditing = updateSupplierMutation.isPending;

  const handleAddSupplier = async () => {
    if (supplierName.trim() === "") {
      toast({
        title: "Error",
        description: "Supplier name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSupplierMutation.mutateAsync({
        name: supplierName,
        userId: user.id,
        status: supplierStatus,
        description: supplierDescription.trim() || null,
        notes: supplierNotes.trim() || null,
      });

      // Clear inputs on success (toast is handled by mutation hook)
      setSupplierName("");
      setSupplierDescription("");
      setSupplierNotes("");
      setSupplierStatus(true);
    } catch (error) {
      // Error toast is handled by the mutation hook
      logger.error("Error adding supplier:", error);
    }
  };

  // Handle Edit Supplier - called from table actions
  const handleEditSupplier = useCallback(
    (supplier: Supplier) => {
      if (externalEditingSupplier !== undefined && onEditSupplier) {
        // If controlled, call the external handler
        onEditSupplier(supplier);
      } else {
        // If internal, set state directly
        setInternalEditingSupplier(supplier);
      }
      setNewSupplierName(supplier.name);
      setNewSupplierDescription(supplier.description || "");
      setNewSupplierNotes(supplier.notes || "");
      setNewSupplierStatus(supplier.status ?? true);
      // Open dialog if controlled
      if (isControlled) {
        setOpen(true);
      }
    },
    [externalEditingSupplier, onEditSupplier, isControlled, setOpen],
  );

  // Handle Update Supplier
  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return;

    if (newSupplierName.trim() === "") {
      toast({
        title: "Error",
        description: "Supplier name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSupplierMutation.mutateAsync({
        id: editingSupplier.id,
        name: newSupplierName,
        status: newSupplierStatus,
        description: newSupplierDescription.trim() || null,
        notes: newSupplierNotes.trim() || null,
      });

      // Clear editing state on success (toast is handled by mutation hook)
      if (externalEditingSupplier === undefined) {
        setInternalEditingSupplier(null);
      } else if (onEditSupplier) {
        onEditSupplier(null as any);
      }
      setNewSupplierName("");
      setNewSupplierDescription("");
      setNewSupplierNotes("");
      setNewSupplierStatus(true);
      // Close dialog if controlled
      if (isControlled) {
        setOpen(false);
      }
    } catch (error) {
      // Error toast is handled by the mutation hook
      logger.error("Error editing supplier:", error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (externalEditingSupplier === undefined) {
      setInternalEditingSupplier(null);
    } else if (onEditSupplier) {
      onEditSupplier(null as any);
    }
    setNewSupplierName("");
    setNewSupplierDescription("");
    setNewSupplierNotes("");
    setNewSupplierStatus(true);
    // Close dialog if controlled
    if (isControlled) {
      setOpen(false);
    }
  };

  // Create table columns with edit handler; close dialog before navigating so overlay/scroll-lock don't block the new page
  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => createSupplierColumns(handleEditSupplier, () => setOpen(false)),
    [handleEditSupplier, setOpen],
  );

  // Set up TanStack Table
  const table = useReactTable({
    data: suppliers || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        // Radix scroll lock can persist after close; clear so page stays clickable (#3797)
        setTimeout(clearBodyScrollLock, 100);
      }
    },
    [setOpen],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="h-10 font-medium">+Add Supplier</Button>
        )}
      </DialogTrigger>
      <DialogContent className={SUPPLIER_DIALOG_CONTENT_CLASS}>
        <DialogHeader className={DIALOG_EDGE_SCROLL_HEADER}>
          <DialogTitle className="text-[22px] text-white">
            {editingSupplier ? "Edit Supplier" : "Add Supplier"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {editingSupplier
              ? "Update the supplier name"
              : "Enter the name of the new supplier"}
          </DialogDescription>
        </DialogHeader>
        <div className={DIALOG_EDGE_SCROLL_BODY}>
          <div className={DIALOG_EDGE_SCROLL_INNER}>
            {/* Conditional rendering for Add/Edit forms */}
            {editingSupplier ? (
              <div className="mt-4">
                <div className="pb-4">
                  <label className="text-sm font-medium mb-2 block text-white/80 dark:text-white/80">
                    Supplier Name
                  </label>
                  <Input
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="Supplier Name"
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_EMERALD)}
                  />
                </div>
                <div className="pb-4">
                  <Label className="text-sm font-medium mb-2 block text-white/80 dark:text-white/80">
                    Description (Optional)
                  </Label>
                  <Textarea
                    value={newSupplierDescription}
                    onChange={(e) => setNewSupplierDescription(e.target.value)}
                    placeholder="Enter supplier description..."
                    rows={3}
                    maxLength={500}
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_EMERALD)}
                  />
                </div>
                <div className="pb-4">
                  <Label className="text-sm font-medium mb-2 block text-white/80 dark:text-white/80">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    value={newSupplierNotes}
                    onChange={(e) => setNewSupplierNotes(e.target.value)}
                    placeholder="Enter supplier notes..."
                    rows={3}
                    maxLength={1000}
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_EMERALD)}
                  />
                </div>
                <div className="pb-4 flex items-start gap-2 min-w-0">
                  <Checkbox
                    id="edit-supplier-status"
                    checked={newSupplierStatus}
                    onCheckedChange={(checked) =>
                      setNewSupplierStatus(checked === true)
                    }
                    className="mt-0.5 shrink-0 border-emerald-400/30 data-[state=checked]:bg-emerald-500/70"
                  />
                  <Label
                    htmlFor="edit-supplier-status"
                    className="min-w-0 flex-1 text-sm font-medium leading-snug text-white/80 dark:text-white/80 cursor-pointer"
                  >
                    Active (Inactive suppliers will not appear while creating
                    products)
                  </Label>
                </div>
                <DialogFooter className="mt-9 mb-4 flex w-full min-w-0 flex-col sm:flex-row items-center gap-2">
                  <Button
                    onClick={handleCancelEdit}
                    variant="secondary"
                    className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-white/10 dark:border-white/10 bg-gradient-to-r from-gray-400/40 via-gray-300/30 to-gray-400/40 dark:bg-background/50 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.3)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.25)] transition duration-200 hover:bg-gradient-to-r hover:from-gray-400/60 hover:via-gray-300/50 hover:to-gray-400/60 dark:hover:bg-accent/50 hover:border-white/20 dark:hover:border-white/20 hover:shadow-[0_20px_45px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_20px_45px_rgba(255,255,255,0.4)]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateSupplier}
                    className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-sky-400/30 dark:border-primary/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-primary/70 dark:via-primary/50 dark:to-primary/30 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 dark:hover:border-primary/40 dark:hover:from-primary/80 dark:hover:via-primary/60 dark:hover:to-primary/40"
                    disabled={isEditing}
                  >
                    {isEditing ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="pb-4">
                  <Input
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="New Supplier"
                    className={cn("mt-4 w-full", DIALOG_FORM_FIELD_EMERALD)}
                  />
                </div>
                <div className="pb-4">
                  <Label className="text-sm font-medium mb-2 block text-white/80 dark:text-white/80">
                    Description (Optional)
                  </Label>
                  <Textarea
                    value={supplierDescription}
                    onChange={(e) => setSupplierDescription(e.target.value)}
                    placeholder="Enter supplier description..."
                    rows={3}
                    maxLength={500}
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_EMERALD)}
                  />
                </div>
                <div className="pb-4">
                  <Label className="text-sm font-medium mb-2 block text-white/80 dark:text-white/80">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    value={supplierNotes}
                    onChange={(e) => setSupplierNotes(e.target.value)}
                    placeholder="Enter supplier notes..."
                    rows={3}
                    maxLength={1000}
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_EMERALD)}
                  />
                </div>
                <div className="pb-4 flex items-start gap-2 min-w-0">
                  <Checkbox
                    id="supplier-status"
                    checked={supplierStatus}
                    onCheckedChange={(checked) =>
                      setSupplierStatus(checked === true)
                    }
                    className="mt-0.5 shrink-0 border-emerald-400/30 data-[state=checked]:bg-emerald-500/70"
                  />
                  <Label
                    htmlFor="supplier-status"
                    className="min-w-0 flex-1 text-sm font-medium leading-snug text-white/80 dark:text-white/80 cursor-pointer"
                  >
                    Active (Inactive suppliers will not appear while creating
                    products)
                  </Label>
                </div>
                <DialogFooter className="mt-9 mb-4 flex w-full min-w-0 flex-col sm:flex-row items-center gap-2">
                  <DialogClose asChild>
                    <Button
                      variant={"secondary"}
                      className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-white/10 dark:border-white/10 bg-gradient-to-r from-gray-400/40 via-gray-300/30 to-gray-400/40 dark:bg-background/50 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.3)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.25)] transition duration-200 hover:bg-gradient-to-r hover:from-gray-400/60 hover:via-gray-300/50 hover:to-gray-400/60 dark:hover:bg-accent/50 hover:border-white/20 dark:hover:border-white/20 hover:shadow-[0_20px_45px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_20px_45px_rgba(255,255,255,0.4)]"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddSupplier}
                    className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-l from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/70 dark:via-sky-500/50 dark:to-sky-500/30 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 dark:hover:border-sky-300/40 dark:hover:from-sky-500/80 dark:hover:via-sky-500/60 dark:hover:to-sky-500/40 hover:shadow-[0_20px_45px_rgba(2,132,199,0.6)]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Add Supplier"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* Suppliers Table — x-scroll contained here, not on the dialog shell */}
            <div className={DIALOG_TABLE_SECTION}>
              <h3 className="text-lg font-medium mb-4 text-white/90 dark:text-white">
                Suppliers{" "}
                {suppliers && suppliers.length > 0 && (
                  <span className="text-white/90 dark:text-white">
                    ({suppliers.length})
                  </span>
                )}
              </h3>
              <DialogTableScrollArea
                frameClassName={DIALOG_TABLE_FRAME_EMERALD}
              >
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className="bg-white/40 dark:bg-white/10"
                      >
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            style={{
                              width: `${header.column.columnDef.size || 100}%`,
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="text-center text-gray-700 dark:text-white"
                        >
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row, index) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className={
                            index % 2 === 0
                              ? "bg-white/30 dark:bg-white/5"
                              : "bg-white/20 dark:bg-white/10"
                          }
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              style={{
                                width: `${cell.column.columnDef.size || 100}%`,
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="text-center text-gray-700 dark:text-white"
                        >
                          No suppliers found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DialogTableScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
