"use client";

import { useState, useEffect, useRef } from "react";
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
} from "@/hooks/queries";
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
import { DeferredSelectGate, DIALOG_FORM_FIELD_ROSE, GLASS_BUTTON_DISABLED, GLASS_BUTTON_ICON_HOVER, GLASS_BUTTON_SHELL_RESET, GLASS_GHOST_BUTTON, GLASS_PRIMARY_BUTTON } from "@/components/shared";
import { cn } from "@/lib/utils";

interface AddProductDialogProps {
  allProducts: Product[];
  userId: string;
  children?: React.ReactNode;
}

export default function AddProductDialog({
  allProducts,
  userId,
  children,
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
  const dialogCloseRef = useRef<HTMLButtonElement | null>(null);

  // Keep UI state in Zustand (openProductDialog, selectedProduct)
  const {
    setOpenProductDialog,
    openProductDialog,
    setSelectedProduct,
    selectedProduct,
  } = useProductStore();

  // Use TanStack Query for data fetching
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();

  // Filter to only show active categories and suppliers in dropdowns
  // Include currently selected category/supplier even if inactive (for edit mode)
  const activeCategories = categories.filter(
    (category) => category.status !== false || category.id === selectedCategory,
  );
  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status !== false || supplier.id === selectedSupplier,
  );

  // Use TanStack Query mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  useEffect(() => {
    if (selectedProduct) {
      reset({
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        quantity: selectedProduct.quantity,
        price: selectedProduct.price,
        imageUrl: selectedProduct.imageUrl || "",
        imageFileId: selectedProduct.imageFileId || "",
        expirationDate: selectedProduct.expirationDate
          ? new Date(selectedProduct.expirationDate).toISOString().split("T")[0]
          : "",
      });
      setSelectedCategory(selectedProduct.categoryId || "");
      setSelectedSupplier(selectedProduct.supplierId || "");
    } else {
      // Reset form to default values for adding a new product
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
    // Clear inline validation errors on every dialog open/close or product change
    setCategoryError("");
    setSupplierError("");
  }, [selectedProduct, openProductDialog, reset]);

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
        // Update existing product using TanStack Query mutation
        await updateProductMutation.mutateAsync({
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
        });

        // Close dialog on success (toast is handled by mutation hook)
        setOpenProductDialog(false);
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
  const isFormValid = productFormSubmitSchema.safeParse({
    ...formValues,
    categoryId: selectedCategory,
    supplierId: selectedSupplier,
  }).success;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // When opening the dialog for adding a new product, clear any selected product
      setSelectedProduct(null);
    } else {
      // When closing the dialog, also clear the selected product to ensure clean state
      setSelectedProduct(null);
    }
    setOpenProductDialog(open);
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
        className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-rose-400/30 dark:border-rose-400/30 shadow-[0_30px_80px_rgba(225,29,72,0.35)] dark:shadow-[0_30px_80px_rgba(225,29,72,0.25)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[22px] text-white">
            {selectedProduct ? "Update Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Enter the details of the product below.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ProductName />
              <SKU allProducts={allProducts} />
              <Quantity />
              <Price />
              <ExpirationDateField />
              <ImageField />
              <div className="mt-5 flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">
                  Category
                </label>
                {/* Always string value — avoids controlled/uncontrolled flip from `|| undefined` */}
                <DeferredSelectGate
                  enabled={openProductDialog}
                  placeholder={
                    <div
                      className="flex h-11 w-full items-center rounded-md border border-rose-400/30 bg-white/10 px-2 text-sm text-white/60"
                      aria-hidden
                    >
                      {activeCategories.find((c) => c.id === selectedCategory)
                        ?.name ?? "Select Category"}
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
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent
                        className="border-rose-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                        position="popper"
                        sideOffset={5}
                        align="start"
                      >
                        {activeCategories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className="cursor-pointer text-gray-700 dark:text-white focus:bg-rose-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </DeferredSelectGate>
                {categoryError && (
                  <p className="text-xs text-red-400 mt-1">{categoryError}</p>
                )}
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">
                  Supplier
                </label>
                <DeferredSelectGate
                  enabled={openProductDialog}
                  placeholder={
                    <div
                      className="flex h-11 w-full items-center rounded-md border border-rose-400/30 bg-white/10 px-2 text-sm text-white/60"
                      aria-hidden
                    >
                      {activeSuppliers.find((s) => s.id === selectedSupplier)
                        ?.name ?? "Select Supplier"}
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
                      <SelectTrigger className={cn("h-11 w-full", DIALOG_FORM_FIELD_ROSE)}>
                        <SelectValue placeholder="Select Supplier" />
                      </SelectTrigger>
                      <SelectContent
                        className="border-rose-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                        position="popper"
                        sideOffset={5}
                        align="start"
                      >
                        {activeSuppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.id}
                            className="cursor-pointer text-gray-700 dark:text-white focus:bg-rose-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                          >
                            {supplier.name}
                          </SelectItem>
                        ))}
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
                  className={cn("h-11 w-full sm:w-auto px-11", GLASS_GHOST_BUTTON)}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="ghost"
                className={cn(
                  GLASS_BUTTON_ICON_HOVER,
                  GLASS_BUTTON_SHELL_RESET,
                  GLASS_BUTTON_DISABLED,
                  "h-11 w-full sm:w-auto px-11",
                  GLASS_PRIMARY_BUTTON.rose,
                )}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting
                  ? "Loading..."
                  : selectedProduct
                    ? "Update Product"
                    : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
