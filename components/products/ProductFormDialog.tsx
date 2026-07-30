"use client";

import { useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProductStore } from "@/stores";
import {
  useCreateProduct,
  useUpdateProduct,
  useCategories,
  useSuppliers,
  useStockByProduct,
} from "@/hooks/queries";
import { useSyncDialogOpenState } from "@/hooks/use-sync-dialog-open-state";
import { planCatalogQuantityReconcile } from "@/lib/stock-allocation/catalog-quantity-reconcile";
import { formatCatalogAllocationSummary } from "@/lib/stock-allocation/catalog-allocation-copy";
import { useCatalogQuantityReconcilePreview } from "@/hooks/use-catalog-quantity-reconcile-preview";
import { AlertDialogWrapper } from "@/components/dialogs";
import { SelectEmptyContent } from "@/components/shared/SelectEmptyContent";
import { resolveSelectPlaceholder } from "@/lib/ui/select-empty-copy";
import type { UpdateProductInput } from "@/types";
import { logger } from "@/lib/logger";
import ProductName from "./form-fields/NameField";
import SKU from "./form-fields/SKUField";
import Quantity from "./form-fields/QuantityField";
import Price from "./form-fields/PriceField";
import ImageField from "./form-fields/ImageField";
import ExpirationDateField from "./form-fields/ExpirationDateField";
import { Product } from "@/types";
import {
  productSchema,
  productFormSubmitSchema,
  calculateProductStatus,
  type ProductFormData,
} from "@/lib/validations";
import {
  DeferredSelectGate,
  DIALOG_EDGE_SCROLL_BODY,
  DIALOG_EDGE_SCROLL_HEADER,
  DIALOG_EDGE_SCROLL_INNER,
  DIALOG_EDGE_SCROLL_SHELL,
  DIALOG_FORM_FIELD_ROSE,
  DIALOG_FORM_ERROR_TEXT,
  DIALOG_FORM_FEEDBACK_ROW,
  DIALOG_FORM_HINT_TEXT,
  DIALOG_FORM_WARN_TEXT,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  DialogFormLabel,
  DialogHeaderBrand,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
} from "@/components/shared";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { cn } from "@/lib/utils";
import { Package, PackagePlus, Tag, Truck, X } from "lucide-react";

interface AddProductDialogProps {
  allProducts: Product[];
  userId: string;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export default function AddProductDialog({
  allProducts,
  userId,
  children,
  onOpenChange,
}: AddProductDialogProps) {
  const methods = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      sku: "",
      quantity: "" as unknown as number,
      price: "" as unknown as number,
      imageUrl: "",
      imageFileId: "",
      expirationDate: "",
    },
  });

  const { reset, watch } = methods;

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  // Inline validation errors for category/supplier — outside RHF so Zod productSchema cannot cover them
  const [categoryError, setCategoryError] = useState<string>("");
  const [supplierError, setSupplierError] = useState<string>("");
  const [quantityReconcileError, setQuantityReconcileError] = useState(""); // fallback when shrink confirm race; live preview handles normal edit
  const [shrinkConfirmOpen, setShrinkConfirmOpen] = useState(false);
  const [pendingUpdatePayload, setPendingUpdatePayload] =
    useState<UpdateProductInput | null>(null);
  const [pendingShrinkUnits, setPendingShrinkUnits] = useState(0);
  const dialogCloseRef = useRef<HTMLButtonElement | null>(null);

  // Keep UI state in Zustand (openProductDialog, selectedProduct)
  const {
    setOpenProductDialog,
    openProductDialog,
    setSelectedProduct,
    selectedProduct,
  } = useProductStore();

  // Use TanStack Query for data fetching
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();

  // Filter to only show active categories and suppliers in dropdowns
  // Include currently selected category/supplier even if inactive (for edit mode)
  const activeCategories = categories.filter(
    (category) => category.status !== false || category.id === selectedCategory,
  );
  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status !== false || supplier.id === selectedSupplier,
  );
  // REQ-0217 — empty list copy (placeholder + open panel); skip flash while loading
  const categoryInvite = resolveSelectPlaceholder("category", {
    count: activeCategories.length,
    isLoading: categoriesLoading,
    invite: "Select Category",
  });
  const supplierInvite = resolveSelectPlaceholder("supplier", {
    count: activeSuppliers.length,
    isLoading: suppliersLoading,
    invite: "Select Supplier",
  });

  // Use TanStack Query mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const { data: productAllocations = [] } = useStockByProduct(
    selectedProduct?.id ?? "",
    undefined,
    { enabled: openProductDialog && !!selectedProduct },
  );

  useSyncDialogOpenState(
    openProductDialog,
    () => {
      if (selectedProduct) {
        reset({
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          quantity: selectedProduct.quantity,
          price: selectedProduct.price,
          imageUrl: selectedProduct.imageUrl || "",
          imageFileId: selectedProduct.imageFileId || "",
          expirationDate: selectedProduct.expirationDate
            ? new Date(selectedProduct.expirationDate)
                .toISOString()
                .split("T")[0]
            : "",
        });
        setSelectedCategory(selectedProduct.categoryId || "");
        setSelectedSupplier(selectedProduct.supplierId || "");
      } else {
        reset({
          productName: "",
          sku: "",
          quantity: "" as unknown as number,
          price: "" as unknown as number,
          imageUrl: "",
          imageFileId: "",
          expirationDate: "",
        });
        setSelectedCategory("");
        setSelectedSupplier("");
      }
      setCategoryError("");
      setSupplierError("");
      setQuantityReconcileError("");
    },
    selectedProduct?.id ?? "create",
  );

  const submitProductUpdate = async (payload: UpdateProductInput) => {
    await updateProductMutation.mutateAsync(payload);
    setOpenProductDialog(false);
    setShrinkConfirmOpen(false);
    setPendingUpdatePayload(null);
    setPendingShrinkUnits(0);
  };

  const onSubmit = async (data: ProductFormData) => {
    const submitValidation = productFormSubmitSchema.safeParse({
      ...data,
      categoryId: selectedCategory,
      supplierId: selectedSupplier,
    });
    if (!submitValidation.success) {
      for (const issue of submitValidation.error.errors) {
        const field = issue.path[0];
        if (field === "categoryId") {
          setCategoryError(issue.message);
        }
        if (field === "supplierId") {
          setSupplierError(issue.message);
        }
      }
      return;
    }
    setCategoryError("");
    setSupplierError("");
    // Convert empty strings to 0 for quantity and price
    const quantity =
      typeof data.quantity === "string" && data.quantity === ""
        ? 0
        : Number(data.quantity);
    const price =
      typeof data.price === "string" && data.price === ""
        ? 0
        : Number(data.price);

    // Calculate status - always returns a valid ProductStatus
    const status = calculateProductStatus(quantity);

    // Format expiration date (convert to ISO string or null)
    const expirationDate =
      data.expirationDate && data.expirationDate !== ""
        ? new Date(data.expirationDate).toISOString()
        : null;

    try {
      if (!selectedProduct) {
        // Create new product using TanStack Query mutation
        await createProductMutation.mutateAsync({
          name: data.productName,
          sku: data.sku,
          price: price,
          quantity: quantity,
          status,
          categoryId: selectedCategory,
          supplierId: selectedSupplier,
          userId: userId,
          imageUrl: data.imageUrl || undefined,
          imageFileId: data.imageFileId || undefined,
          expirationDate: expirationDate || undefined,
        });

        // Close dialog on success (toast is handled by mutation hook)
        dialogCloseRef.current?.click();
        setOpenProductDialog(false);
      } else {
        const reconcilePlan = planCatalogQuantityReconcile({
          currentCatalog: selectedProduct.quantity,
          newCatalog: quantity,
          productReserved: selectedProduct.reservedQuantity ?? 0,
          allocations: productAllocations.map((row) => ({
            id: row.id,
            quantity: row.quantity,
            reservedQuantity: row.reservedQuantity,
          })),
        });

        if (!reconcilePlan.ok) {
          setQuantityReconcileError(
            reconcilePlan.blockedReason ??
              "Cannot lower catalog quantity with current warehouse allocations.",
          );
          return;
        }

        setQuantityReconcileError("");

        const updatePayload: UpdateProductInput = {
          id: selectedProduct.id,
          name: data.productName,
          sku: data.sku,
          price: price,
          quantity: quantity,
          status,
          categoryId: selectedCategory,
          supplierId: selectedSupplier,
          imageUrl: data.imageUrl || undefined,
          imageFileId: data.imageFileId || undefined,
          expirationDate: expirationDate,
        };

        if (reconcilePlan.unitsRemoved > 0) {
          setPendingUpdatePayload(updatePayload);
          setPendingShrinkUnits(reconcilePlan.unitsRemoved);
          setShrinkConfirmOpen(true);
          return;
        }

        await submitProductUpdate(updatePayload);
      }
    } catch (error) {
      // Mutation onError already toasts; catch log is a dev signal (4xx skipped in prod Sentry)
      logger.error("Product operation error:", error);
    }
  };

  // Determine if form is submitting based on mutation states
  const isSubmitting =
    createProductMutation.isPending || updateProductMutation.isPending;

  const formValues = watch();
  const reconcilePreview = useCatalogQuantityReconcilePreview({
    selectedProduct,
    allocations: productAllocations,
    quantityRaw: formValues.quantity,
  });
  const isFormValid = productFormSubmitSchema.safeParse({
    ...formValues,
    categoryId: selectedCategory,
    supplierId: selectedSupplier,
  }).success;
  const canSubmitUpdate =
    isFormValid && (!selectedProduct || reconcilePreview.ok);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // When opening the dialog for adding a new product, clear any selected product
      setSelectedProduct(null);
    } else {
      // When closing the dialog, also clear the selected product to ensure clean state
      setSelectedProduct(null);
    }
    setOpenProductDialog(open);
    onOpenChange?.(open);
  };

  return (
    <Dialog open={openProductDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="h-10 font-medium inline-flex items-center justify-center rounded-xl border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/40 via-rose-500/30 to-rose-500/20 dark:from-rose-500/40 dark:via-rose-500/30 dark:to-rose-500/20 text-white shadow-[0_15px_35px_rgba(225,29,72,0.35)] backdrop-blur-md transition duration-200 hover:border-rose-300/50 hover:from-rose-500/50 hover:via-rose-500/40 hover:to-rose-500/30 dark:hover:border-rose-300/50 dark:hover:from-rose-500/50 dark:hover:via-rose-500/40 dark:hover:to-rose-500/30">
            +Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          DIALOG_EDGE_SCROLL_SHELL,
          "poppins border-rose-400/30 dark:border-rose-400/30 shadow-[0_30px_80px_rgba(225,29,72,0.35)] dark:shadow-[0_30px_80px_rgba(225,29,72,0.25)]",
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeaderBrand
          className={DIALOG_EDGE_SCROLL_HEADER}
          icon={Package}
          tone="rose"
          title={selectedProduct ? "Update Product" : "Add Product"}
          description="Enter the details of the product below."
        />
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className={DIALOG_EDGE_SCROLL_BODY}
          >
            <div className={DIALOG_EDGE_SCROLL_INNER}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ProductName />
              <SKU allProducts={allProducts} />
              <Quantity />
              <Price />
              <ExpirationDateField />
              <ImageField />
              {selectedProduct && productAllocations.length > 0 ? (
                <div className={DIALOG_FORM_FEEDBACK_ROW}>
                  <p className={DIALOG_FORM_HINT_TEXT}>
                    {formatCatalogAllocationSummary(
                      reconcilePreview.catalogPreviewQty,
                      reconcilePreview.allocatedTotal,
                      reconcilePreview.unallocatedPreview,
                    )}
                  </p>
                  {reconcilePreview.reservedCommitment > 0 ? (
                    <p className={DIALOG_FORM_HINT_TEXT}>
                      {reconcilePreview.reservedCommitment} reserved on active orders
                      — catalog cannot go below that
                    </p>
                  ) : null}
                  {!reconcilePreview.ok && reconcilePreview.blockedReason ? (
                    <p className={DIALOG_FORM_ERROR_TEXT} role="alert">
                      {reconcilePreview.blockedReason}
                    </p>
                  ) : null}
                  {reconcilePreview.ok && reconcilePreview.shrinkUnits > 0 ? (
                    <p className={DIALOG_FORM_WARN_TEXT}>
                      Will remove {reconcilePreview.shrinkUnits} unreserved unit(s)
                      from warehouse allocations on save
                    </p>
                  ) : null}
                  {quantityReconcileError ? (
                    <p className={DIALOG_FORM_ERROR_TEXT} role="alert">
                      {quantityReconcileError}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-5 flex flex-col gap-2">
                <DialogFormLabel icon={Tag} required>
                  Category
                </DialogFormLabel>
                {/* Always string value — avoids controlled/uncontrolled flip from `|| undefined` */}
                <DeferredSelectGate
                  enabled={openProductDialog}
                  placeholder={
                    <div
                      className={cn(
                        "flex h-11 w-full items-center rounded-md px-2 text-sm text-white/60",
                        DIALOG_FORM_FIELD_ROSE,
                      )}
                      aria-hidden
                    >
                      {activeCategories.find((c) => c.id === selectedCategory)
                        ?.name ?? categoryInvite}
                    </div>
                  }
                >
                  {({ selectRemountKey }) => (
                    <Select
                      key={selectRemountKey}
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value);
                        setCategoryError("");
                      }}
                    >
                      <SelectTrigger className={cn("h-11 w-full", DIALOG_FORM_FIELD_ROSE)}>
                        <SelectValue placeholder={categoryInvite} />
                      </SelectTrigger>
                      <SelectContent
                        className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                        position="popper"
                        sideOffset={5}
                        align="start"
                      >
                        {activeCategories.length === 0 ? (
                          <SelectEmptyContent entity="category" />
                        ) : (
                          activeCategories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id}
                              className={DIALOG_SELECT_ITEM_CLASS}
                            >
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </DeferredSelectGate>
                {categoryError && (
                  <p className="text-xs text-red-400 mt-1">{categoryError}</p>
                )}
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <DialogFormLabel icon={Truck} required>
                  Supplier
                </DialogFormLabel>
                <DeferredSelectGate
                  enabled={openProductDialog}
                  placeholder={
                    <div
                      className={cn(
                        "flex h-11 w-full items-center rounded-md px-2 text-sm text-white/60",
                        DIALOG_FORM_FIELD_ROSE,
                      )}
                      aria-hidden
                    >
                      {selectedSupplier ? (
                        <AvatarInlineLink
                          label={
                            activeSuppliers.find(
                              (s) => s.id === selectedSupplier,
                            )?.name ?? supplierInvite
                          }
                          seed={
                            activeSuppliers.find(
                              (s) => s.id === selectedSupplier,
                            )?.userId ?? selectedSupplier
                          }
                          size={22}
                          linkClassName="text-sm font-normal text-white/90"
                        />
                      ) : (
                        supplierInvite
                      )}
                    </div>
                  }
                >
                  {({ selectRemountKey }) => (
                    <Select
                      key={selectRemountKey}
                      value={selectedSupplier}
                      onValueChange={(value) => {
                        setSelectedSupplier(value);
                        setSupplierError("");
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-11 w-full [&>span]:line-clamp-none",
                          DIALOG_FORM_FIELD_ROSE,
                        )}
                      >
                        <SelectValue placeholder={supplierInvite}>
                          {selectedSupplier ? (
                            <AvatarInlineLink
                              label={
                                activeSuppliers.find(
                                  (s) => s.id === selectedSupplier,
                                )?.name ?? supplierInvite
                              }
                              seed={
                                activeSuppliers.find(
                                  (s) => s.id === selectedSupplier,
                                )?.userId ?? selectedSupplier
                              }
                              size={22}
                              linkClassName="text-sm font-normal text-white/90"
                            />
                          ) : (
                            supplierInvite
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                        position="popper"
                        sideOffset={5}
                        align="start"
                      >
                        {activeSuppliers.length === 0 ? (
                          <SelectEmptyContent entity="supplier" />
                        ) : (
                          activeSuppliers.map((supplier) => (
                            <SelectItem
                              key={supplier.id}
                              value={supplier.id}
                              className={DIALOG_SELECT_ITEM_CLASS}
                            >
                              <AvatarInlineLink
                                label={supplier.name}
                                seed={supplier.userId ?? supplier.id}
                                size={22}
                                linkClassName="text-sm font-normal text-popover-foreground"
                              />
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </DeferredSelectGate>
                {supplierError && (
                  <p className="text-xs text-red-400 mt-1">{supplierError}</p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2">
              <DialogClose asChild>
                <Button
                  ref={dialogCloseRef}
                  variant="secondary"
                  className={cn("h-11 w-full sm:w-auto px-11 gap-2", GLASS_GHOST_BUTTON)}
                >
                  <X className="h-4 w-4 shrink-0" aria-hidden />
                  Cancel
                </Button>
              </DialogClose>
              <DialogSubmitButton
                isPending={isSubmitting}
                pendingLabel={
                  selectedProduct ? "Updating product…" : "Adding product…"
                }
                label={selectedProduct ? "Update Product" : "Add Product"}
                icon={PackagePlus}
                hue="rose"
                disabled={!canSubmitUpdate}
                className="h-11 px-11"
              />
            </DialogFooter>
            </div>
          </form>
        </FormProvider>
      </DialogContent>

      <AlertDialogWrapper
        open={shrinkConfirmOpen}
        onOpenChange={setShrinkConfirmOpen}
        title="Reduce warehouse allocations?"
        description={`Lowering catalog quantity will remove ${pendingShrinkUnits} unreserved unit(s) from warehouse allocations. Reserved stock is not affected.`}
        actionLabel="Update product"
        actionLoadingLabel="Updating…"
        isLoading={updateProductMutation.isPending}
        onAction={async () => {
          if (!pendingUpdatePayload) return;
          await submitProductUpdate(pendingUpdatePayload);
        }}
        onCancel={() => {
          setShrinkConfirmOpen(false);
          setPendingUpdatePayload(null);
          setPendingShrinkUnits(0);
        }}
        actionVariant="destructive"
      />
    </Dialog>
  );
}
