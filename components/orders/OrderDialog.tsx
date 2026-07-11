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
import { Input } from "@/components/ui/input";
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
  DeferredSelectGate,
  DIALOG_FORM_FIELD_VIOLET,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  createOrderSchema,
  updateOrderSchema,
  type UpdateOrderFormData,
} from "@/lib/validations";
import { FormField, FormNumberField } from "@/components/forms";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  ShippingAddress,
  BillingAddress,
  CreateOrderInput,
} from "@/types";
import { logger } from "@/lib/logger";
import { Plus, Trash2, X, Package, Layers } from "lucide-react";
import { ProductOptionRow } from "@/components/products/ProductOptionRow";
import { OrderLineWarehouseSelect } from "@/components/orders/OrderLineWarehouseSelect";
import { useAuth } from "@/contexts";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import type { StockAllocation } from "@/types";

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
 * Extended form data type for creating orders (includes order items array and UI state)
 */
interface OrderFormData {
  items: Array<{
    productId: string;
    quantity?: number | undefined;
    /** REQ-0068 — required when product has warehouse allocations */
    warehouseId?: string;
  }>;
  shippingAddress?: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  useSameAddress?: boolean;
  tax?: number;
  shipping?: number;
  discount?: number;
  notes?: string;
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
  const shippingAmount = SHIPPING_FIXED;
  const discountPercent = getDiscountPercent(subtotal);
  const discountAmount = subtotal * (discountPercent / 100);
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

      // Compute subtotal and fees (tax 7%, shipping $4.99, discount by tier) for payload
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

      // Check stock availability for each item (product + warehouse pick when allocated)
      for (const item of validItems) {
        const product = availableProducts.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        const requestedQty =
          item.quantity !== undefined && item.quantity !== null
            ? Number(item.quantity)
            : 0;

        const allocations = queryClient.getQueryData<StockAllocation[]>(
          queryKeys.stockAllocation.byProduct(item.productId),
        );
        const hasAllocations = (allocations?.length ?? 0) > 0;

        if (hasAllocations) {
          if (!item.warehouseId) {
            throw new Error(
              `Select a warehouse for ${product.name} (product has warehouse stock)`,
            );
          }
          const pick = allocations?.find(
            (a) => a.warehouseId === item.warehouseId,
          );
          const warehouseAvail =
            Number(pick?.quantity ?? 0) -
            Number(pick?.reservedQuantity ?? 0);
          if (requestedQty > warehouseAvail) {
            throw new Error(
              `Insufficient stock at warehouse for ${product.name}. Available: ${warehouseAvail}, Requested: ${requestedQty}`,
            );
          }
        } else {
          const availableStock =
            Number(product.quantity) -
            Number(product.reservedQuantity ?? 0);
          if (requestedQty > availableStock) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${requestedQty}`,
            );
          }
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
  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
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
        <DialogHeader>
          <DialogTitle className="text-[22px] text-white">
            {editingOrder
              ? `Edit Order ${editingOrder.orderNumber}`
              : "Create New Order"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {editingOrder
              ? "Update order status, payment status, tracking information, and notes."
              : "Add products, quantities, addresses, and order details below."}
          </DialogDescription>
        </DialogHeader>

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
                          className="border-violet-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                          position="popper"
                          sideOffset={5}
                          align="start"
                        >
                          {orderStatusOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="cursor-pointer text-gray-700 dark:text-white focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
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
                          className="border-violet-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                          position="popper"
                          sideOffset={5}
                          align="start"
                        >
                          {paymentStatusOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="cursor-pointer text-gray-700 dark:text-white focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
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

                {/* Estimated Delivery */}
                <FormField
                  name="estimatedDelivery"
                  label="Estimated Delivery"
                  type="date"
                  labelClassName="text-white/80"
                  inputClassName={DIALOG_FORM_FIELD_VIOLET}
                />

                {/* Shipped At */}
                {currentStatus === "shipped" ||
                currentStatus === "delivered" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/80">
                      Shipped At
                    </label>
                    <input
                      {...editFormMethods.register("shippedAt")}
                      type="date"
                      className={cn("h-11 w-full rounded-md px-2 py-2", DIALOG_FORM_FIELD_VIOLET)}
                      defaultValue={
                        editingOrder.shippedAt
                          ? new Date(editingOrder.shippedAt)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                    />
                  </div>
                ) : null}

                {/* Delivered At */}
                {currentStatus === "delivered" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/80">
                      Delivered At
                    </label>
                    <input
                      {...editFormMethods.register("deliveredAt")}
                      type="date"
                      className={cn("h-11 w-full rounded-md px-2 py-2", DIALOG_FORM_FIELD_VIOLET)}
                      defaultValue={
                        editingOrder.deliveredAt
                          ? new Date(editingOrder.deliveredAt)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                    />
                  </div>
                ) : null}

                {/* Cancelled At */}
                {currentStatus === "cancelled" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/80">
                      Cancelled At
                    </label>
                    <input
                      {...editFormMethods.register("cancelledAt")}
                      type="date"
                      className={cn("h-11 w-full rounded-md px-2 py-2", DIALOG_FORM_FIELD_VIOLET)}
                      defaultValue={
                        editingOrder.cancelledAt
                          ? new Date(editingOrder.cancelledAt)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                    />
                  </div>
                ) : null}

                {/* Notes */}
                <div className="sm:col-span-2">
                  <FormField
                    name="notes"
                    label="Notes"
                    placeholder="Enter order notes..."
                    labelClassName="text-white/80"
                    inputClassName={DIALOG_FORM_FIELD_VIOLET}
                  />
                </div>
              </div>

              <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2">
                <Button
                  onClick={handleCancelEdit}
                  variant="secondary"
                  className={cn("w-full sm:w-auto px-11", GLASS_GHOST_BUTTON)}
                >
                  Cancel
                </Button>
                <DialogSubmitButton
                  isPending={isUpdating}
                  pendingLabel="Updating order…"
                  label="Update Order"
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
                    <Label className="text-white/80 text-base font-medium">
                      Order Items
                    </Label>
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

                  {fields.map((field, index) => {
                    const productId = createWatch(`items.${index}.productId`);
                    const quantityValue = createWatch(
                      `items.${index}.quantity`,
                    );
                    // Convert quantity to number for calculations, but keep as-is for display
                    const quantity =
                      quantityValue !== undefined && quantityValue !== null
                        ? Number(quantityValue)
                        : 0;
                    const selectedProduct = availableProducts.find(
                      (p) => p.id === productId,
                    );
                    const availableStock = selectedProduct
                      ? Number(selectedProduct.quantity)
                      : 0;
                    const itemSubtotal =
                      selectedProduct && quantity > 0
                        ? Number(selectedProduct.price) * quantity
                        : 0;

                    // Check if quantity exceeds available stock
                    const exceedsStock =
                      selectedProduct && quantity > availableStock;

                    return (
                      <div
                        key={field.id}
                        className="p-4 border border-violet-400/20 rounded-lg bg-white/5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_100px_minmax(0,1fr)] gap-2 items-start">
                            {/* Product Selection */}
                            <div className="flex flex-col gap-2">
                              <Label className="flex items-center gap-2 text-white/80 text-sm">
                                <Package className="h-4 w-4 shrink-0 text-violet-400" />
                                Product {index + 1}
                              </Label>
                              <DeferredSelectGate
                                enabled={open}
                                placeholder={
                                  <div
                                    className="flex h-11 w-full items-center rounded-md border border-violet-400/30 bg-white/10 px-2 text-sm"
                                    aria-hidden
                                  >
                                    {selectedProduct ? (
                                      <ProductOptionRow
                                        name={selectedProduct.name}
                                        imageUrl={selectedProduct.imageUrl}
                                        size="sm"
                                        className="text-white/90"
                                      />
                                    ) : (
                                      <span className="text-white/60">
                                        {productSelectPlaceholder}
                                      </span>
                                    )}
                                  </div>
                                }
                              >
                                {({ selectRemountKey }) => (
                                  <Select
                                    key={selectRemountKey}
                                    value={productId || ""}
                                    onValueChange={(value) => {
                                      createSetValue(
                                        `items.${index}.productId`,
                                        value,
                                      );
                                      createSetValue(
                                        `items.${index}.quantity`,
                                        1,
                                      );
                                      createSetValue(
                                        `items.${index}.warehouseId`,
                                        undefined,
                                      );
                                    }}
                                    disabled={
                                      isClientCreatingOrder &&
                                      availableProducts.length === 0
                                    }
                                  >
                                    <SelectTrigger className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}>
                                      <SelectValue placeholder={productSelectPlaceholder}>
                                        {selectedProduct ? (
                                          <ProductOptionRow
                                            name={selectedProduct.name}
                                            imageUrl={selectedProduct.imageUrl}
                                            size="sm"
                                            className="text-white/90"
                                          />
                                        ) : null}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent
                                      className="border-violet-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                                      position="popper"
                                      sideOffset={5}
                                      align="start"
                                    >
                                      {availableProducts.length === 0 &&
                                      isClientCreatingOrder &&
                                      productOwner ? (
                                        <div className="px-2 text-sm text-muted-foreground dark:text-white/60 text-center">
                                          {productOwner.name} hasn&apos;t added
                                          any products yet
                                        </div>
                                      ) : (
                                        availableProducts.map((product) => (
                                          <SelectItem
                                            key={product.id}
                                            value={product.id}
                                            className="cursor-pointer py-2 text-gray-700 dark:text-white focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                                          >
                                            <ProductOptionRow
                                              name={product.name}
                                              imageUrl={product.imageUrl}
                                              price={Number(product.price)}
                                              quantity={Number(product.quantity)}
                                              size="sm"
                                              showMeta
                                            />
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                )}
                              </DeferredSelectGate>
                              {createErrors.items?.[index]?.productId && (
                                <p className="text-red-500 text-xs">
                                  {String(
                                    createErrors.items[index]?.productId
                                      ?.message,
                                  )}
                                </p>
                              )}
                            </div>

                            {/* Quantity */}
                            <div className="flex flex-col gap-2">
                              <Label className="flex items-center gap-2 text-white/80 text-sm">
                                <Layers className="h-4 w-4 shrink-0 text-violet-400" />
                                Quantity
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                value={
                                  quantityValue !== undefined &&
                                  quantityValue !== null
                                    ? quantityValue.toString()
                                    : ""
                                }
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  // Allow empty string, or parse as integer if value exists
                                  if (
                                    inputValue === "" ||
                                    inputValue === null ||
                                    inputValue === undefined
                                  ) {
                                    createSetValue(
                                      `items.${index}.quantity`,
                                      undefined,
                                      { shouldValidate: true },
                                    );
                                  } else {
                                    const parsedValue = parseInt(
                                      inputValue,
                                      10,
                                    );
                                    if (
                                      !isNaN(parsedValue) &&
                                      parsedValue > 0
                                    ) {
                                      createSetValue(
                                        `items.${index}.quantity`,
                                        parsedValue as number,
                                        { shouldValidate: true },
                                      );
                                    } else {
                                      createSetValue(
                                        `items.${index}.quantity`,
                                        undefined,
                                        { shouldValidate: true },
                                      );
                                    }
                                  }
                                }}
                                placeholder="Enter quantity"
                                className={cn("h-11", DIALOG_FORM_FIELD_VIOLET, "[&:invalid]:border-violet-400/30")}
                              />
                              {createErrors.items?.[index]?.quantity && (
                                <p className="text-red-500 text-xs">
                                  {String(
                                    createErrors.items[index]?.quantity
                                      ?.message,
                                  )}
                                </p>
                              )}
                            </div>

                            {/* REQ-0068 — warehouse in same grid row (REQ-0074 alignment) */}
                            <OrderLineWarehouseSelect
                              productId={productId}
                              value={createWatch(`items.${index}.warehouseId`)}
                              onChange={(whId) =>
                                createSetValue(
                                  `items.${index}.warehouseId`,
                                  whId,
                                )
                              }
                              quantity={quantity}
                              dialogOpen={open}
                            />
                          </div>

                          {/* Remove Button */}
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Item Subtotal and Warning - Same row aligned with columns */}
                        {selectedProduct && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Subtotal - aligned with product column */}
                            <div className="text-sm text-white/70">
                              Subtotal: ${itemSubtotal.toFixed(2)} (
                              {selectedProduct.name} × {quantity || 0})
                            </div>
                            {/* Stock validation warning - aligned with quantity column */}
                            <div>
                              {exceedsStock && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>
                                    Quantity exceeds available stock. Available:{" "}
                                    {availableStock}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

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
                  <Label className="text-white/80 text-base font-medium">
                    Shipping Address
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <FormField
                      name="shippingAddress.street"
                      label="Street Address"
                      placeholder="123 Main St"
                      labelClassName="text-white/80"
                      inputClassName={DIALOG_FORM_FIELD_VIOLET}
                    />
                    <FormField
                      name="shippingAddress.city"
                      label="City"
                      placeholder="New York"
                      labelClassName="text-white/80"
                      inputClassName={DIALOG_FORM_FIELD_VIOLET}
                    />
                    <FormField
                      name="shippingAddress.state"
                      label="State/Province"
                      placeholder="NY"
                      labelClassName="text-white/80"
                      inputClassName={DIALOG_FORM_FIELD_VIOLET}
                    />
                    <FormField
                      name="shippingAddress.zipCode"
                      label="Zip Code"
                      placeholder="10001"
                      labelClassName="text-white/80"
                      inputClassName={DIALOG_FORM_FIELD_VIOLET}
                    />
                    <FormField
                      name="shippingAddress.country"
                      label="Country"
                      placeholder="United States"
                      labelClassName="text-white/80"
                      className="sm:col-span-2"
                      inputClassName={DIALOG_FORM_FIELD_VIOLET}
                    />
                  </div>

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
                      <Label className="text-white/80 text-base font-medium">
                        Billing Address
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <FormField
                          name="billingAddress.street"
                          label="Street Address"
                          placeholder="123 Main St"
                          labelClassName="text-white/80"
                          inputClassName={DIALOG_FORM_FIELD_VIOLET}
                        />
                        <FormField
                          name="billingAddress.city"
                          label="City"
                          placeholder="New York"
                          labelClassName="text-white/80"
                          inputClassName={DIALOG_FORM_FIELD_VIOLET}
                        />
                        <FormField
                          name="billingAddress.state"
                          label="State/Province"
                          placeholder="NY"
                          labelClassName="text-white/80"
                          inputClassName={DIALOG_FORM_FIELD_VIOLET}
                        />
                        <FormField
                          name="billingAddress.zipCode"
                          label="Zip Code"
                          placeholder="10001"
                          labelClassName="text-white/80"
                          inputClassName={DIALOG_FORM_FIELD_VIOLET}
                        />
                        <FormField
                          name="billingAddress.country"
                          label="Country"
                          placeholder="United States"
                          labelClassName="text-white/80"
                          className="sm:col-span-2"
                          inputClassName={DIALOG_FORM_FIELD_VIOLET}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Totals Section — tax 7%, shipping $4.99, discount by subtotal tier (computed, no dropdowns) */}
                <div className="space-y-4">
                  <Label className="text-white/80 text-base font-medium">
                    Order Totals
                  </Label>
                  <div className="p-4 border border-violet-400/20 rounded-lg bg-white/5 space-y-2">
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Tax (7%):</span>
                      <span>${orderFees.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Shipping:</span>
                      <span>${orderFees.shippingAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Discount ({orderFees.discountPercent}%):</span>
                      <span className="text-red-400">
                        -${orderFees.discountAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-medium text-white pt-2 border-t border-violet-400/20">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <FormField
                    name="notes"
                    label="Order Notes"
                    placeholder="Additional notes or instructions..."
                    labelClassName="text-white/80"
                    inputClassName={DIALOG_FORM_FIELD_VIOLET}
                  />
                </div>
              </div>

              <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2">
                <DialogClose asChild>
                  <Button
                    ref={dialogCloseRef}
                    variant="secondary"
                    className={cn("w-full sm:w-auto px-11", GLASS_GHOST_BUTTON)}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <DialogSubmitButton
                  isPending={isCreating}
                  pendingLabel="Creating order…"
                  label="Create Order"
                  hue="violet"
                  disabled={
                    isCreating ||
                    watchedItems.length === 0 ||
                    !watchedItems.some(
                      (item) => item?.productId && (item?.quantity ?? 0) > 0,
                    ) ||
                    watchedItems.some((item) => {
                      if (!item?.productId || !item?.quantity) return false;
                      const product = availableProducts.find(
                        (p) => p.id === item.productId,
                      );
                      const itemQty = item.quantity ?? 0;
                      return (
                        product && Number(itemQty) > Number(product.quantity)
                      );
                    })
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
