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
  useCategories,
  useCreateCategory,
  useUpdateCategory,
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
  DIALOG_FORM_FIELD_SKY,
  DIALOG_TABLE_FRAME_SKY,
  DIALOG_TABLE_SECTION,
} from "@/components/shared";
import { Category } from "@/types";
import { createCategoryColumns } from "./CategoryTableColumns";

const CATEGORY_DIALOG_CONTENT_CLASS = `${DIALOG_EDGE_SCROLL_SHELL} poppins border-sky-400/30 dark:border-sky-400/30 shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]`;

interface AddCategoryDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editingCategory?: Category | null;
  onEditCategory?: (category: Category) => void;
}

export default function AddCategoryDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editingCategory: externalEditingCategory,
  onEditCategory,
}: AddCategoryDialogProps = {}) {
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
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryNotes, setCategoryNotes] = useState("");
  const [categoryStatus, setCategoryStatus] = useState(true); // Default to active
  const [internalEditingCategory, setInternalEditingCategory] =
    useState<Category | null>(null);

  // Use external or internal editing category
  const editingCategory =
    externalEditingCategory !== undefined
      ? externalEditingCategory
      : internalEditingCategory;

  const setEditingCategory =
    externalEditingCategory !== undefined && onEditCategory
      ? onEditCategory
      : setInternalEditingCategory;
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryNotes, setNewCategoryNotes] = useState("");
  const [newCategoryStatus, setNewCategoryStatus] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Sync external editingCategory with form fields
  useEffect(() => {
    if (externalEditingCategory) {
      setNewCategoryName(externalEditingCategory.name);
      setNewCategoryDescription(externalEditingCategory.description || "");
      setNewCategoryNotes(externalEditingCategory.notes || "");
      setNewCategoryStatus(externalEditingCategory.status ?? true);
    } else if (externalEditingCategory === null) {
      // Clear form when editingCategory is explicitly set to null
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryNotes("");
      setNewCategoryStatus(true);
    }
  }, [externalEditingCategory]);

  // Reset form fields when dialog closes (only when not editing)
  useEffect(() => {
    if (!open && !editingCategory) {
      setCategoryName("");
      setCategoryDescription("");
      setCategoryNotes("");
      setCategoryStatus(true);
    }
  }, [open, editingCategory]);

  // Use TanStack Query for data fetching
  const { data: categories = [], isLoading } = useCategories();

  // Use TanStack Query mutations
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const { toast } = useToast();
  const { user, isLoggedIn } = useAuth();

  // Determine loading states from mutations
  const isSubmitting = createCategoryMutation.isPending;
  const isEditing = updateCategoryMutation.isPending;

  const handleAddCategory = async () => {
    if (categoryName.trim() === "") {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
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
      await createCategoryMutation.mutateAsync({
        name: categoryName,
        userId: user.id,
        status: categoryStatus,
        description: categoryDescription.trim() || null,
        notes: categoryNotes.trim() || null,
      });

      // Clear inputs on success (toast is handled by mutation hook)
      setCategoryName("");
      setCategoryDescription("");
      setCategoryNotes("");
      setCategoryStatus(true);
    } catch (error) {
      // Error toast is handled by the mutation hook
      logger.error("Error adding category:", error);
    }
  };

  // Handle Edit Category - called from table actions
  const handleEditCategory = useCallback(
    (category: Category) => {
      if (externalEditingCategory !== undefined && onEditCategory) {
        // If controlled, call the external handler
        onEditCategory(category);
      } else {
        // If internal, set state directly
        setInternalEditingCategory(category);
      }
      setNewCategoryName(category.name);
      setNewCategoryDescription(category.description || "");
      setNewCategoryNotes(category.notes || "");
      setNewCategoryStatus(category.status ?? true);
      // Open dialog if controlled
      if (isControlled) {
        setOpen(true);
      }
    },
    [externalEditingCategory, onEditCategory, isControlled, setOpen],
  );

  // Handle Update Category
  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    if (newCategoryName.trim() === "") {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateCategoryMutation.mutateAsync({
        id: editingCategory.id,
        name: newCategoryName,
        status: newCategoryStatus,
        description: newCategoryDescription.trim() || null,
        notes: newCategoryNotes.trim() || null,
      });

      // Clear editing state on success (toast is handled by mutation hook)
      if (externalEditingCategory === undefined) {
        setInternalEditingCategory(null);
      } else if (onEditCategory) {
        onEditCategory(null as any);
      }
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryNotes("");
      setNewCategoryStatus(true);
      // Close dialog if controlled
      if (isControlled) {
        setOpen(false);
      }
    } catch (error) {
      // Error toast is handled by the mutation hook
      logger.error("Error editing category:", error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (externalEditingCategory === undefined) {
      setInternalEditingCategory(null);
    } else if (onEditCategory) {
      onEditCategory(null as any);
    }
    setNewCategoryName("");
    setNewCategoryDescription("");
    setNewCategoryNotes("");
    setNewCategoryStatus(true);
    // Close dialog if controlled
    if (isControlled) {
      setOpen(false);
    }
  };

  // Create table columns with edit handler
  const columns = useMemo<ColumnDef<Category>[]>(
    () => createCategoryColumns(handleEditCategory),
    [handleEditCategory],
  );

  // Set up TanStack Table
  const table = useReactTable({
    data: categories || [],
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
        setTimeout(clearBodyScrollLock, 100);
      }
    },
    [setOpen],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="h-10 font-medium">+Add Category</Button>
        )}
      </DialogTrigger>
      <DialogContent className={CATEGORY_DIALOG_CONTENT_CLASS}>
        <DialogHeader className={DIALOG_EDGE_SCROLL_HEADER}>
          <DialogTitle className="text-[22px] text-white">
            {editingCategory ? "Edit Category" : "Add Category"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {editingCategory
              ? "Update the category name"
              : "Enter the name of the new category"}
          </DialogDescription>
        </DialogHeader>
        <div className={DIALOG_EDGE_SCROLL_BODY}>
          <div className={DIALOG_EDGE_SCROLL_INNER}>
            {/* Edit Category Form (shown when editing) */}
            {editingCategory ? (
              <div className="mt-4">
                <div className="pb-4">
                  <label className="text-sm font-medium mb-2 block text-white/80">
                    Category Name
                  </label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category Name"
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_SKY)}
                  />
                </div>
                <div className="pb-4">
                  <Label className="text-sm font-medium mb-2 block text-white/80">
                    Description (Optional)
                  </Label>
                  <Textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Enter category description..."
                    rows={3}
                    maxLength={500}
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_SKY)}
                  />
                </div>
                <div className="pb-4">
                  <Label className="text-sm font-medium mb-2 block text-white/80">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    value={newCategoryNotes}
                    onChange={(e) => setNewCategoryNotes(e.target.value)}
                    placeholder="Enter category notes..."
                    rows={3}
                    maxLength={1000}
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_SKY)}
                  />
                </div>
                <div className="pb-4 flex items-start gap-2 min-w-0">
                  <Checkbox
                    id="edit-category-status"
                    checked={newCategoryStatus}
                    onCheckedChange={(checked) =>
                      setNewCategoryStatus(checked === true)
                    }
                    className="mt-0.5 shrink-0 border-sky-400/30 data-[state=checked]:bg-sky-500/70"
                  />
                  <Label
                    htmlFor="edit-category-status"
                    className="min-w-0 flex-1 text-sm font-medium leading-snug text-white/80 cursor-pointer"
                  >
                    Active (Inactive categories will not appear while creating
                    products)
                  </Label>
                </div>
                <DialogFooter className="mt-9 mb-4 flex w-full min-w-0 flex-col sm:flex-row items-center gap-2">
                  <Button
                    onClick={handleCancelEdit}
                    variant="secondary"
                    className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-white/10 bg-gradient-to-r from-gray-400/40 via-gray-300/30 to-gray-400/40 dark:bg-background/50 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.3)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.25)] transition duration-200 hover:bg-gradient-to-r hover:from-gray-400/60 hover:via-gray-300/50 hover:to-gray-400/60 dark:hover:bg-accent/50 hover:border-white/20 dark:hover:border-white/20 hover:shadow-[0_20px_45px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_20px_45px_rgba(255,255,255,0.4)]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCategory}
                    className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 hover:shadow-[0_20px_45px_rgba(2,132,199,0.6)]"
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
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="New Category"
                    className={cn("mt-4 w-full", DIALOG_FORM_FIELD_SKY)}
                  />
                </div>
                <div className="pb-4">
                  <Label className="text-sm font-medium mb-2 block text-white/80">
                    Description (Optional)
                  </Label>
                  <Textarea
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Enter category description..."
                    rows={3}
                    maxLength={500}
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_SKY)}
                  />
                </div>
                <div className="pb-4">
                  <Label className="text-sm font-medium mb-2 block text-white/80">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    value={categoryNotes}
                    onChange={(e) => setCategoryNotes(e.target.value)}
                    placeholder="Enter category notes..."
                    rows={3}
                    maxLength={1000}
                    className={cn("mt-2 w-full", DIALOG_FORM_FIELD_SKY)}
                  />
                </div>
                <div className="pb-4 flex items-start gap-2 min-w-0">
                  <Checkbox
                    id="category-status"
                    checked={categoryStatus}
                    onCheckedChange={(checked) =>
                      setCategoryStatus(checked === true)
                    }
                    className="mt-0.5 shrink-0 border-sky-400/30 data-[state=checked]:bg-sky-500/70"
                  />
                  <Label
                    htmlFor="category-status"
                    className="min-w-0 flex-1 text-sm font-medium leading-snug text-white/80 cursor-pointer"
                  >
                    Active (Inactive categories will not appear while creating
                    products)
                  </Label>
                </div>
                <DialogFooter className="mt-9 mb-4 flex w-full min-w-0 flex-col sm:flex-row items-center gap-2">
                  <DialogClose asChild>
                    <Button
                      variant={"secondary"}
                      className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-white/10 bg-gradient-to-r from-gray-400/40 via-gray-300/30 to-gray-400/40 dark:bg-background/50 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.3)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.25)] transition duration-200 hover:bg-gradient-to-r hover:from-gray-400/60 hover:via-gray-300/50 hover:to-gray-400/60 dark:hover:bg-accent/50 hover:border-white/20 dark:hover:border-white/20 hover:shadow-[0_20px_45px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_20px_45px_rgba(255,255,255,0.4)]"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddCategory}
                    className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 hover:shadow-[0_20px_45px_rgba(2,132,199,0.6)]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Add Category"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* Categories Table — x-scroll contained here, not on the dialog shell */}
            <div className={DIALOG_TABLE_SECTION}>
              <h3 className="text-lg font-medium mb-4 text-white/90 dark:text-white">
                Categories{" "}
                {categories && categories.length > 0 && (
                  <span className="text-white/90 dark:text-white">
                    ({categories.length})
                  </span>
                )}
              </h3>
              <DialogTableScrollArea frameClassName={DIALOG_TABLE_FRAME_SKY}>
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
                          No categories found.
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
