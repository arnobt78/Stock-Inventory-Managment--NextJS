/**
 * Order Dialog Component
 * Unified dialog for creating and editing orders
 * Merged from OrderCreateDialog and OrderEditDialog following CategoryDialog pattern
 */

"use client";

import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import {
  useForm,
  FormProvider,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateOrder,
  useUpdateOrder,
  useProducts,
  useClientBrowseProducts,
} from "@/hooks/queries";
import {
  OrderDialogCreateLineItem,
  type OrderFormData,
} from "@/components/orders/OrderDialogCreateLineItem";
import { OrderAddressFields } from "@/components/orders/OrderAddressFields";
import { ensureStockAllocationsAndValidate } from "@/lib/orders/order-line-stock-validation";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  DialogDateField,
  DialogFormLabel,
  DialogHeaderBrand,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  createOrderSchema,
  updateOrderSchema,
  type UpdateOrderFormData,
} from "@/lib/validations";
import { FormField } from "@/components/forms";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
  BillingAddress,
  CreateOrderInput,
} from "@/types";
import { logger } from "@/lib/logger";
import {
  CircleDollarSign,
  DollarSign,
  MapPin,
  Package,
  Percent,
  Plus,
  Receipt,
  Save,
  StickyNote,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/** ISO date string for native date inputs (REQ-0126). */
function toDateInputValue(value?: Date | string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : (d.toISOString().split("T")[0] ?? "");
}

interface OrderDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editingOrder?: Order | null;
  onEditOrder?: (order: Order | null) => void;
  /** For client role: product owner ID - products shown come from this owner */
  defaultOwnerId?: string;
}

/**
 * Order status options
 */
const orderStatusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

/**
 * Payment status options
 */
const paymentStatusOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "refunded", label: "Refunded" },
];

/** Tax: 7% of subtotal (hardcoded). */
const TAX_RATE = 0.07;
/** Shipping: fixed $4.99 (hardcoded). */
const SHIPPING_FIXED = 4.99;

/**
 * Discount percent by subtotal tiers (hardcoded):
 * &lt; $100 → 10%, $100–$300 → 20%, $300–$500 → 30%, $500+ → 50%
 */
function getDiscountPercent(subtotal: number): number {
  if (subtotal < 100) return 10;
  if (subtotal < 300) return 20;
  if (subtotal < 500) return 30;
  return 50;
}

/**
 * Compute tax, shipping, and discount amounts from subtotal.
 * Used for display and for create-order payload (all roles).
 */
function getOrderFeesFromSubtotal(subtotal: number): {
  taxAmount: number;
  shippingAmount: number;
  discountPercent: number;
  discountAmount: number;
} {
  const taxAmount = subtotal * TAX_RATE;
  const discountPercent = getDiscountPercent(subtotal);
  const discountAmount = subtotal * (discountPercent / 100);
  // Free shipping on the 10% (< $100) discount tier — keeps total <= subtotal on small orders.
  const shippingAmount = discountPercent === 10 ? 0 : SHIPPING_FIXED;
  return { taxAmount, shippingAmount, discountPercent, discountAmount };
}

/**
 * Order Dialog Component
 * Unified dialog for creating and editing orders
 * Follows CategoryDialog pattern with controlled/internal state and conditional rendering
 */
export default function OrderDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editingOrder: externalEditingOrder,
  onEditOrder,
  defaultOwnerId,
}: OrderDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalEditingOrder, setInternalEditingOrder] =
    useState<Order | null>(null);
  const dialogCloseRef = useRef<HTMLButtonElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use controlled or internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(value);
      } else {
        setInternalOpen(value);
        controlledOnOpenChange?.(value);
      }
    },
    [isControlled, controlledOnOpenChange],
  );

  // Use external or internal editing order
  const editingOrder =
    externalEditingOrder !== undefined
      ? externalEditingOrder
      : internalEditingOrder;

  const setEditingOrder =
    externalEditingOrder !== undefined && onEditOrder
      ? onEditOrder
      : setInternalEditingOrder;

  // Fetch products for selection (used in create form)
  // Client + defaultOwnerId: use browse products from selected owner
  const isClientCreatingOrder = user?.role === "client" && !!defaultOwnerId;
  const { data: adminProducts = [] } = useProducts();
  const { data: browseData } = useClientBrowseProducts({
    ownerId: defaultOwnerId ?? "",
  });
  const clientProducts = browseData?.products ?? [];
  const products = isClientCreatingOrder ? clientProducts : adminProducts;
  const productOwner = browseData?.owner;

  // When client creates order and selected owner has no products, show dynamic placeholder in product dropdown
  const productSelectPlaceholder =
    isClientCreatingOrder && clientProducts.length === 0 && productOwner
      ? `${productOwner.name} hasn't added any products yet`
      : "Select Product";

  // Filter to only show available products (status !== "Stock Out")
  const availableProducts = useMemo(
    () =>
      products.filter(
        (product: { status?: string; quantity?: number }) =>
          product.status !== "Stock Out" && Number(product.quantity ?? 0) > 0,
      ),
    [products],
  );

  // Use TanStack Query mutations
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();

  // Determine loading states from mutations
  const isCreating = createOrderMutation.isPending;
  const isUpdating = updateOrderMutation.isPending;
  const isSubmitting = isCreating || isUpdating;

  // ==================== CREATE ORDER FORM ====================
  // Initialize create form
  const createFormMethods = useForm<OrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      items: [{ productId: "", quantity: undefined }],
      useSameAddress: true,
      shippingAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      billingAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      tax: 0,
      shipping: 0,
      discount: 0,
      notes: "",
    },
  });

  const {
    control: createControl,
    watch: createWatch,
    setValue: createSetValue,
    reset: createReset,
    formState: { errors: createErrors },
  } = createFormMethods;

  // Use field array for dynamic order items
  const { fields, append, remove } = useFieldArray({
    control: createControl,
    name: "items",
  });

  /** REQ-0112 — keyed by field.id (stable across remove/reindex). */
  const [lineStockErrors, setLineStockErrors] = useState<Record<string, boolean>>(
    {},
  );

  const handleLineStockValidityChange = useCallback(
    (lineId: string, hasStockError: boolean) => {
      setLineStockErrors((prev) => {
        if (prev[lineId] === hasStockError) return prev;
        return { ...prev, [lineId]: hasStockError };
      });
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      setLineStockErrors({});
    }
  }, [open]);

  // Watch form values for calculations - use useWatch for reactive watching of items array
  const watchedItems =
    useWatch({
      control: createControl,
      name: "items",
    }) || [];
  const useSameAddress = createWatch("useSameAddress");

  // Calculate subtotal from items - updates in real-time as items change
  const subtotal = useMemo(() => {
    if (!watchedItems || watchedItems.length === 0) return 0;
    return watchedItems.reduce((sum, item) => {
      // Skip items without product
      if (!item?.productId) return sum;
      // Convert quantity to number, handling undefined or null
      const itemQuantity =
        item.quantity !== undefined && item.quantity !== null
          ? Number(item.quantity)
          : 0;
      // Skip if quantity is invalid or zero
      if (itemQuantity <= 0) return sum;
      const product = availableProducts.find((p) => p.id === item.productId);
      if (!product) return sum;
      const itemPrice = Number(product.price) || 0;
      return sum + itemPrice * itemQuantity;
    }, 0);
  }, [watchedItems, availableProducts]);

  // Tax, shipping, discount: computed from subtotal (hardcoded rules) — no dropdowns
  const orderFees = useMemo(
    () => getOrderFeesFromSubtotal(subtotal),
    [subtotal],
  );
  const total =
    subtotal +
    orderFees.taxAmount +
    orderFees.shippingAmount -
    orderFees.discountAmount;

  const hasValidLineItems = useMemo(
    () =>
      watchedItems?.some(
        (item) => item?.productId && (item?.quantity ?? 0) > 0,
      ) ?? false,
    [watchedItems],
  );
  const showOrderTotals = hasValidLineItems && subtotal > 0;

  // Sync billing address with shipping address if checkbox is checked
  useEffect(() => {
    if (useSameAddress && !editingOrder) {
      const shippingAddr = createWatch("shippingAddress");
      if (shippingAddr) {
        createSetValue("billingAddress", { ...shippingAddr });
      }
    }
  }, [useSameAddress, createWatch, createSetValue, editingOrder]);

  // Reset create form when dialog opens/closes (only when not editing)
  useEffect(() => {
    if (!open && !editingOrder) {
      createReset({
        items: [{ productId: "", quantity: undefined }],
        useSameAddress: true,
        shippingAddress: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        billingAddress: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        tax: 0,
        shipping: 0,
        discount: 0,
        notes: "",
      });
    }
  }, [open, editingOrder, createReset]);

  // Handle create order submission
  const handleCreateOrder = async (data: OrderFormData) => {
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Validate items - check stock availability
      // Filter out items without product or with invalid quantity
      const validItems = data.items.filter((item) => {
        if (!item.productId) return false;
        const qty =
          item.quantity !== undefined && item.quantity !== null
            ? Number(item.quantity)
            : 0;
        return qty > 0;
      });

      if (validItems.length === 0) {
        throw new Error("At least one order item is required");
      }

      // Compute subtotal and fees (tax 7%, shipping $4.99 except free on 10% tier, discount by tier) for payload
      const submitSubtotal = validItems.reduce((sum, item) => {
        const product = availableProducts.find((p) => p.id === item.productId);
        if (!product) return sum;
        const qty =
          item.quantity !== undefined && item.quantity !== null
            ? Number(item.quantity)
            : 0;
        return sum + Number(product.price) * qty;
      }, 0);
      const fees = getOrderFeesFromSubtotal(submitSubtotal);

      // REQ-0111 — ensure fresh allocation cache before submit validation
      for (const item of validItems) {
        const product = availableProducts.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        const stockCheck = await ensureStockAllocationsAndValidate(
          queryClient,
          {
            quantity: Number(product.quantity),
            reservedQuantity: product.reservedQuantity,
          },
          item,
        );
        if (!stockCheck.ok) {
          throw new Error(
            stockCheck.message ??
              `Insufficient stock for ${product.name}. Available: ${stockCheck.maxQty}`,
          );
        }
      }

      // Helper function to check if address has required fields
      const hasValidAddress = (address?: {
        street?: string;
        city?: string;
        zipCode?: string;
        country?: string;
      }) => {
        if (!address) return false;
        return !!(
          address.street &&
          address.city &&
          address.zipCode &&
          address.country
        );
      };

      // Prepare order data matching CreateOrderInput type
      // Convert empty addresses to undefined to pass validation
      const orderData: CreateOrderInput = {
        items: validItems.map((item) => {
          const qty =
            item.quantity !== undefined && item.quantity !== null
              ? Number(item.quantity)
              : 0;
          return {
            productId: item.productId,
            quantity: qty,
            ...(item.warehouseId ? { warehouseId: item.warehouseId } : {}),
          };
        }),
        shippingAddress: hasValidAddress(data.shippingAddress)
          ? (data.shippingAddress as ShippingAddress)
          : undefined,
        billingAddress: hasValidAddress(data.billingAddress)
          ? (data.billingAddress as BillingAddress)
          : undefined,
        tax: fees.taxAmount,
        shipping: fees.shippingAmount,
        discount: fees.discountAmount,
        notes: data.notes || undefined,
      };

      // Create order using TanStack Query mutation
      await createOrderMutation.mutateAsync(orderData);

      // Close dialog on success (toast is handled by mutation hook)
      setOpen(false);
      // Reset form after successful submission
      createReset({
        items: [{ productId: "", quantity: 1 }],
        useSameAddress: true,
        shippingAddress: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        billingAddress: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        tax: 0,
        shipping: 0,
        discount: 0,
        notes: "",
      });
    } catch (error) {
      // Error toast is handled by the mutation hook
      logger.error("Order creation error:", error);
      // Don't close dialog on error - let user fix the issue
    }
  };

  // Add new order item
  const handleAddItem = () => {
    append({
      productId: "",
      quantity: undefined as number | undefined,
      warehouseId: undefined,
    });
  };

  // Remove order item
  const handleRemoveItem = (index: number, lineId: string) => {
    if (fields.length > 1) {
      remove(index);
      setLineStockErrors((prev) => {
        if (!(lineId in prev)) return prev;
        const next = { ...prev };
        delete next[lineId];
        return next;
      });
    }
  };

  // ==================== EDIT ORDER FORM ====================
  // Initialize edit form with order data
  const editFormMethods = useForm<UpdateOrderFormData>({
    resolver: zodResolver(updateOrderSchema),
    defaultValues: editingOrder
      ? {
          status: editingOrder.status,
          paymentStatus: editingOrder.paymentStatus,
          trackingNumber: editingOrder.trackingNumber || "",
          trackingUrl: editingOrder.trackingUrl || "",
          estimatedDelivery: editingOrder.estimatedDelivery
            ? new Date(editingOrder.estimatedDelivery)
                .toISOString()
                .split("T")[0]
            : "",
          shippedAt: editingOrder.shippedAt
            ? new Date(editingOrder.shippedAt).toISOString().split("T")[0]
            : "",
          deliveredAt: editingOrder.deliveredAt
            ? new Date(editingOrder.deliveredAt).toISOString().split("T")[0]
            : "",
          cancelledAt: editingOrder.cancelledAt
            ? new Date(editingOrder.cancelledAt).toISOString().split("T")[0]
            : "",
          notes: editingOrder.notes || "",
        }
      : {
          status: "pending",
          paymentStatus: "unpaid",
          trackingNumber: "",
          trackingUrl: "",
          estimatedDelivery: "",
          shippedAt: "",
          deliveredAt: "",
          cancelledAt: "",
          notes: "",
        },
  });

  const { reset: editReset, watch: editWatch } = editFormMethods;

  // Reset edit form when order changes or dialog opens
  useEffect(() => {
    if (open && editingOrder) {
      editReset({
        status: editingOrder.status,
        paymentStatus: editingOrder.paymentStatus,
        trackingNumber: editingOrder.trackingNumber || "",
        trackingUrl: editingOrder.trackingUrl || "",
        estimatedDelivery: editingOrder.estimatedDelivery
          ? new Date(editingOrder.estimatedDelivery).toISOString().split("T")[0]
          : "",
        shippedAt: editingOrder.shippedAt
          ? new Date(editingOrder.shippedAt).toISOString().split("T")[0]
          : "",
        deliveredAt: editingOrder.deliveredAt
          ? new Date(editingOrder.deliveredAt).toISOString().split("T")[0]
          : "",
        cancelledAt: editingOrder.cancelledAt
          ? new Date(editingOrder.cancelledAt).toISOString().split("T")[0]
          : "",
        notes: editingOrder.notes || "",
      });
    } else if (open && !editingOrder && externalEditingOrder === null) {
      // Clear edit form when explicitly set to null
      editReset({
        status: "pending",
        paymentStatus: "unpaid",
        trackingNumber: "",
        trackingUrl: "",
        estimatedDelivery: "",
        shippedAt: "",
        deliveredAt: "",
        cancelledAt: "",
        notes: "",
      });
    }
  }, [open, editingOrder, externalEditingOrder, editReset]);

  // Handle edit order submission
  const handleUpdateOrder = async (data: UpdateOrderFormData) => {
    if (!editingOrder) return;

    try {
      // Prepare update data - convert date strings to Date objects for UpdateOrderInput
      // The API expects Date objects
      const updateData = {
        status: data.status,
        paymentStatus: data.paymentStatus,
        trackingNumber: data.trackingNumber || undefined,
        trackingUrl: data.trackingUrl || undefined,
        estimatedDelivery: data.estimatedDelivery
          ? new Date(data.estimatedDelivery)
          : undefined,
        shippedAt: data.shippedAt ? new Date(data.shippedAt) : undefined,
        deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
        cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : undefined,
        notes: data.notes || undefined,
      };

      // Update order using TanStack Query mutation
      await updateOrderMutation.mutateAsync({
        id: editingOrder.id,
        data: updateData,
      });

      // Clear editing state on success (toast is handled by mutation hook)
      if (externalEditingOrder === undefined) {
        setInternalEditingOrder(null);
      } else if (onEditOrder) {
        onEditOrder(null);
      }

      // Close dialog if controlled
      if (isControlled) {
        setOpen(false);
      } else {
        // For internal state, close after a brief delay
        setTimeout(() => {
          setOpen(false);
        }, 500);
      }
    } catch (error) {
      // Error toast is handled by the mutation hook
      logger.error("Order update error:", error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (externalEditingOrder === undefined) {
      setInternalEditingOrder(null);
    } else if (onEditOrder) {
      onEditOrder(null);
    }
    // Close dialog if controlled
    if (isControlled) {
      setOpen(false);
    }
  };

  // Handle Edit Order - called from table actions
  const handleEditOrder = useCallback(
    (order: Order) => {
      if (externalEditingOrder !== undefined && onEditOrder) {
        // If controlled, call the external handler
        onEditOrder(order);
      } else {
        // If internal, set state directly
        setInternalEditingOrder(order);
      }
      // Open dialog if controlled
      if (isControlled) {
        setOpen(true);
      }
    },
    [externalEditingOrder, onEditOrder, isControlled, setOpen],
  );

  const currentStatus = editWatch("status");

  // ==================== RENDER ====================
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="h-10 font-medium inline-flex items-center justify-center rounded-xl border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/40 via-violet-500/30 to-violet-500/20 dark:from-violet-500/40 dark:via-violet-500/30 dark:to-violet-500/20 text-white shadow-[0_15px_35px_rgba(139,92,246,0.35)] backdrop-blur-md transition duration-200 hover:border-violet-300/50 hover:from-violet-500/50 hover:via-violet-500/40 hover:to-violet-500/30 dark:hover:border-violet-300/50 dark:hover:from-violet-500/50 dark:hover:via-violet-500/40 dark:hover:to-violet-500/30">
            + Create Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-violet-400/30 dark:border-violet-400/30 shadow-[0_30px_80px_rgba(139,92,246,0.45)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeaderBrand
          icon={Package}
          tone="violet"
          title={
            editingOrder
              ? `Edit Order ${editingOrder.orderNumber}`
              : "Create New Order"
          }
          description={
            editingOrder
              ? "Update order status, payment status, tracking information, and notes."
              : "Add products, quantities, addresses, and order details below."
          }
        />

        {/* Edit Order Form (shown when editing) */}
        {editingOrder ? (
          <FormProvider {...editFormMethods}>
            <form onSubmit={editFormMethods.handleSubmit(handleUpdateOrder)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Order Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80">
                    Order Status
                  </label>
                  <DeferredSelectGate
                    enabled={open}
                    placeholder={
                      <div
                        className="flex h-11 w-full items-center rounded-md border border-violet-400/30 bg-white/10 px-2 text-sm text-white/60"
                        aria-hidden
                      >
                        {orderStatusOptions.find(
                          (o) =>
                            o.value ===
                            (editFormMethods.watch("status") ||
                              editingOrder.status),
                        )?.label ?? "Select Status"}
                      </div>
                    }
                  >
                    {({ selectRemountKey }) => (
                      <Select
                        key={selectRemountKey}
                        value={
                          editFormMethods.watch("status") || editingOrder.status
                        }
                        onValueChange={(value) =>
                          editFormMethods.setValue(
                            "status",
                            value as OrderStatus,
                          )
                        }
                      >
                        <SelectTrigger className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent
                          className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                          position="popper"
                          sideOffset={5}
                          align="start"
                        >
                          {orderStatusOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className={DIALOG_SELECT_ITEM_CLASS}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </DeferredSelectGate>
                </div>

                {/* Payment Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80">
                    Payment Status
                  </label>
                  <DeferredSelectGate
                    enabled={open}
                    placeholder={
                      <div
                        className="flex h-11 w-full items-center rounded-md border border-violet-400/30 bg-white/10 px-2 text-sm text-white/60"
                        aria-hidden
                      >
                        {paymentStatusOptions.find(
                          (o) =>
                            o.value ===
                            (editFormMethods.watch("paymentStatus") ||
                              editingOrder.paymentStatus),
                        )?.label ?? "Select Payment Status"}
                      </div>
                    }
                  >
                    {({ selectRemountKey }) => (
                      <Select
                        key={selectRemountKey}
                        value={
                          editFormMethods.watch("paymentStatus") ||
                          editingOrder.paymentStatus
                        }
                        onValueChange={(value) =>
                          editFormMethods.setValue(
                            "paymentStatus",
                            value as PaymentStatus,
                          )
                        }
                      >
                        <SelectTrigger className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}>
                          <SelectValue placeholder="Select Payment Status" />
                        </SelectTrigger>
                        <SelectContent
                          className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                          position="popper"
                          sideOffset={5}
                          align="start"
                        >
                          {paymentStatusOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className={DIALOG_SELECT_ITEM_CLASS}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </DeferredSelectGate>
                </div>

                {/* Tracking Number */}
                <FormField
                  name="trackingNumber"
                  label="Tracking Number"
                  placeholder="Enter tracking number"
                  labelClassName="text-white/80"
                  inputClassName={DIALOG_FORM_FIELD_VIOLET}
                />

                {/* Tracking URL */}
                <FormField
                  name="trackingUrl"
                  label="Tracking URL"
                  placeholder="https://tracking.example.com/..."
                  type="url"
                  labelClassName="text-white/80"
                  inputClassName={DIALOG_FORM_FIELD_VIOLET}
                />

                {/* Estimated Delivery — REQ-0126 DialogDateField */}
                <DialogDateField
                  id="estimated-delivery"
                  label="Estimated Delivery"
                  optional
                  labelIcon={null}
                  value={toDateInputValue(editWatch("estimatedDelivery"))}
                  onChange={(v) =>
                    editFormMethods.setValue(
                      "estimatedDelivery",
                      v || undefined,
                      { shouldValidate: true },
                    )
                  }
                  inputClassName={DIALOG_FORM_FIELD_VIOLET}
                />

                {/* Shipped At */}
                {currentStatus === "shipped" ||
                currentStatus === "delivered" ? (
                  <DialogDateField
                    id="shipped-at"
                    label="Shipped At"
                    optional
                    labelIcon={null}
                    value={toDateInputValue(editWatch("shippedAt"))}
                    onChange={(v) =>
                      editFormMethods.setValue("shippedAt", v || undefined, {
                        shouldValidate: true,
                      })
                    }
                    inputClassName={DIALOG_FORM_FIELD_VIOLET}
                  />
                ) : null}

                {/* Delivered At */}
                {currentStatus === "delivered" ? (
                  <DialogDateField
                    id="delivered-at"
                    label="Delivered At"
                    optional
                    labelIcon={null}
                    value={toDateInputValue(editWatch("deliveredAt"))}
                    onChange={(v) =>
                      editFormMethods.setValue("deliveredAt", v || undefined, {
                        shouldValidate: true,
                      })
                    }
                    inputClassName={DIALOG_FORM_FIELD_VIOLET}
                  />
                ) : null}

                {/* Cancelled At */}
                {currentStatus === "cancelled" ? (
                  <DialogDateField
                    id="cancelled-at"
                    label="Cancelled At"
                    optional
                    labelIcon={null}
                    value={toDateInputValue(editWatch("cancelledAt"))}
                    onChange={(v) =>
                      editFormMethods.setValue("cancelledAt", v || undefined, {
                        shouldValidate: true,
                      })
                    }
                    inputClassName={DIALOG_FORM_FIELD_VIOLET}
                  />
                ) : null}

                {/* Notes */}
                <div className="sm:col-span-2 space-y-2">
                  <DialogFormLabel htmlFor="notes" icon={StickyNote} optional>
                    Notes
                  </DialogFormLabel>
                  <FormField
                    name="notes"
                    label="Notes"
                    placeholder="Enter order notes..."
                    showLabel={false}
                    inputClassName={DIALOG_FORM_FIELD_VIOLET}
                  />
                </div>
              </div>

              <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2">
                <Button
                  onClick={handleCancelEdit}
                  variant="secondary"
                  className={cn("w-full sm:w-auto px-11 gap-2", GLASS_GHOST_BUTTON)}
                >
                  <X className="h-4 w-4 shrink-0" aria-hidden />
                  Cancel
                </Button>
                <DialogSubmitButton
                  isPending={isUpdating}
                  pendingLabel="Updating order…"
                  label="Update Order"
                  icon={Save}
                  hue="violet"
                  disabled={isUpdating}
                  className="px-11"
                />
              </DialogFooter>
            </form>
          </FormProvider>
        ) : (
          /* Create Order Form (shown when not editing) */
          <FormProvider {...createFormMethods}>
            <form
              onSubmit={createFormMethods.handleSubmit(
                handleCreateOrder,
                (errors) => {
                  // Client-side RHF validation failure — expected UX path, not a server error
                  console.warn(
                    "Form validation errors:",
                    JSON.stringify(errors, null, 2),
                  );
                  logger.warn("Order form validation errors:", errors);

                  // Helper function to extract error messages from nested objects
                  const extractErrorMessages = (
                    errorObj: unknown,
                    prefix = "",
                  ): string[] => {
                    const messages: string[] = [];

                    if (errorObj && typeof errorObj === "object") {
                      // Check if it has a message property (FieldError)
                      if ("message" in errorObj && errorObj.message) {
                        messages.push(
                          `${prefix ? `${prefix}: ` : ""}${String(errorObj.message)}`,
                        );
                      }

                      // Check if it's an array of errors (for array fields)
                      if (Array.isArray(errorObj)) {
                        errorObj.forEach((itemError, index) => {
                          if (itemError && typeof itemError === "object") {
                            messages.push(
                              ...extractErrorMessages(
                                itemError,
                                `${prefix}[${index}]`,
                              ),
                            );
                          }
                        });
                      } else {
                        // Process nested object errors (like billingAddress.street)
                        Object.entries(errorObj).forEach(([key, value]) => {
                          if (value && typeof value === "object") {
                            const newPrefix = prefix ? `${prefix}.${key}` : key;
                            messages.push(
                              ...extractErrorMessages(value, newPrefix),
                            );
                          }
                        });
                      }
                    }

                    return messages;
                  };

                  // Extract all error messages
                  const errorMessages = extractErrorMessages(errors);

                  toast({
                    title: "Validation Error",
                    description:
                      errorMessages.length > 0
                        ? errorMessages.join(". ")
                        : "Please fix the form errors before submitting.",
                    variant: "destructive",
                  });
                },
              )}
            >
              <div className="space-y-4">
                {/* Order Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <DialogFormLabel icon={Package}>Order Items</DialogFormLabel>
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      variant="secondary"
                      className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/30 via-violet-500/15 to-violet-500/5 dark:from-violet-500/30 dark:via-violet-500/15 dark:to-violet-500/5 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(139,92,246,0.2)] backdrop-blur-md transition duration-200 hover:border-violet-300/60 hover:from-violet-500/35 hover:via-violet-500/25 hover:to-violet-500/15 dark:hover:border-violet-300/60 dark:hover:from-violet-500/35 dark:hover:via-violet-500/25 dark:hover:to-violet-500/15"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <OrderDialogCreateLineItem
                      key={field.id}
                      lineId={field.id}
                      index={index}
                      productId={createWatch(`items.${index}.productId`) ?? ""}
                      quantityValue={createWatch(`items.${index}.quantity`)}
                      warehouseId={createWatch(`items.${index}.warehouseId`)}
                      availableProducts={availableProducts}
                      productSelectPlaceholder={productSelectPlaceholder}
                      isClientCreatingOrder={isClientCreatingOrder}
                      productOwner={productOwner}
                      dialogOpen={open}
                      canRemove={fields.length > 1}
                      createSetValue={createSetValue}
                      createErrors={createErrors}
                      onRemove={() => handleRemoveItem(index, field.id)}
                      onStockValidityChange={handleLineStockValidityChange}
                    />
                  ))}

                  {createErrors.items &&
                    typeof createErrors.items === "object" &&
                    "message" in createErrors.items && (
                      <p className="text-red-500 text-xs">
                        {String(createErrors.items.message)}
                      </p>
                    )}
                </div>

                {/* Addresses Section */}
                <div className="space-y-4">
                  <DialogFormLabel icon={MapPin}>Shipping Address</DialogFormLabel>
                  <OrderAddressFields prefix="shippingAddress" />

                  {/* Use Same Address Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useSameAddress"
                      checked={useSameAddress}
                      onChange={(e) =>
                        createSetValue("useSameAddress", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-violet-400/30 bg-white/10 text-violet-500 focus:ring-violet-500/50 data-[state=checked]:bg-violet-500/70"
                    />
                    <Label
                      htmlFor="useSameAddress"
                      className="text-white/80 text-sm cursor-pointer"
                    >
                      Use same address for billing
                    </Label>
                  </div>

                  {/* Billing Address */}
                  {!useSameAddress && (
                    <div className="space-y-4 pt-4 border-t border-violet-400/20">
                      <DialogFormLabel icon={MapPin}>Billing Address</DialogFormLabel>
                      <OrderAddressFields prefix="billingAddress" />
                    </div>
                  )}
                </div>

                {/* Order Totals Section — tax 7%, shipping $4.99, discount by subtotal tier (computed, no dropdowns) */}
                <div className="space-y-4">
                  <DialogFormLabel icon={DollarSign}>Order Totals</DialogFormLabel>
                  {showOrderTotals ? (
                    <div className="p-4 border border-violet-400/20 rounded-lg bg-white/5 space-y-2">
                      <div className="flex justify-between text-sm text-white/70">
                        <span className="inline-flex items-center gap-1.5">
                          <Receipt className="h-3.5 w-3.5 shrink-0" />
                          Subtotal:
                        </span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/70">
                        <span className="inline-flex items-center gap-1.5">
                          <Percent className="h-3.5 w-3.5 shrink-0" />
                          Tax (7%):
                        </span>
                        <span>${orderFees.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/70">
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 shrink-0" />
                          Shipping:
                        </span>
                        <span>${orderFees.shippingAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/70">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 shrink-0" />
                          Discount ({orderFees.discountPercent}%):
                        </span>
                        <span className="text-red-400">
                          -${orderFees.discountAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-medium text-white pt-2 border-t border-violet-400/20">
                        <span className="inline-flex items-center gap-1.5">
                          <CircleDollarSign className="h-4 w-4 shrink-0" />
                          Total:
                        </span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-violet-400/20 bg-white/5 p-6 text-center text-white/60">
                      <Package className="h-8 w-8 shrink-0 opacity-70" aria-hidden />
                      <p className="text-sm">Add products to see totals</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <DialogFormLabel htmlFor="notes" icon={StickyNote} optional>
                    Order Notes
                  </DialogFormLabel>
                  <FormField
                    name="notes"
                    label="Order Notes"
                    placeholder="Additional notes or instructions..."
                    showLabel={false}
                    inputClassName={DIALOG_FORM_FIELD_VIOLET}
                  />
                </div>
              </div>

              <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2">
                <DialogClose asChild>
                  <Button
                    ref={dialogCloseRef}
                    variant="secondary"
                    className={cn("w-full sm:w-auto px-11 gap-2", GLASS_GHOST_BUTTON)}
                  >
                    <X className="h-4 w-4 shrink-0" aria-hidden />
                    Cancel
                  </Button>
                </DialogClose>
                <DialogSubmitButton
                  isPending={isCreating}
                  pendingLabel="Creating order…"
                  label="Create Order"
                  icon={Package}
                  hue="violet"
                  disabled={
                    isCreating ||
                    watchedItems.length === 0 ||
                    !watchedItems.some(
                      (item) => item?.productId && (item?.quantity ?? 0) > 0,
                    ) ||
                    Object.values(lineStockErrors).some(Boolean)
                  }
                  className="px-11"
                />
              </DialogFooter>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
