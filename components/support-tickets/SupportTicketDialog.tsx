"use client";

/**
 * REQ-0185 / REQ-0188 — Create / Edit support ticket dialog.
 * Client/supplier: assignedTo required; densify owner Select; Priority solid/opaque badges.
 * REQ-0188 — Send-to trigger: no line-clamp clip; dual-surface owner text.
 * REQ-0190 — Edit: Send-to read-only (all roles); omit assignedToId on PUT. Create Select unchanged.
 * REQ-0191 — Edit: Status Select (no inline detail Selects).
 * REQ-0197 — Create: optional Related product Command (owner-scoped); edit RO densify.
 * REQ-0198 — render-phase open sync; Send-to placeholder height matches trigger.
 * REQ-0200 — Related products via owner-scoped API (not role-scoped useProducts); Select always controlled.
 * REQ-0201 — Related product DialogProductOptionRow densify (create + edit RO).
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDot,
  FileText,
  MessageSquare,
  Package,
  Pencil,
  Send,
  User,
  X,
} from "lucide-react";
import {
  DeferredSelectGate,
  DIALOG_COMBOBOX_TRIGGER_CLASS,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_FORM_FIELD_SKY,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  DialogFormLabel,
  DialogHeaderBrand,
  GLASS_GHOST_BUTTON,
  DialogSubmitButton,
} from "@/components/shared";
import {
  DialogProductOptionRow,
  productCategoryLabel,
  productSupplierLabel,
} from "@/components/products/ProductOptionRow";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import { AVATAR_RING_CLASS } from "@/lib/ui/avatar-ring-styles";
import {
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
  filterCommandPopoverClass,
} from "@/lib/ui/popover-readability-styles";
import {
  useCreateSupportTicket,
  useSupportTicketOwnerProducts,
  useUpdateSupportTicket,
} from "@/hooks/queries";
import { useSyncDialogOpenState } from "@/hooks/use-sync-dialog-open-state";
import { useAuth } from "@/contexts";
import { cn } from "@/lib/utils";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/lib/ui/semantic-badges";
import type {
  ProductOwnerOption,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/types";

export type { ProductOwnerOption };

const PRIORITIES: { value: SupportTicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUSES: { value: SupportTicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

/**
 * REQ-0185 densify Send-to row; REQ-0188 — dual surface text + circle overflow only.
 * trigger = dark glass SelectTrigger; item = light readable popover.
 * Exported for admin Reassign Select (REQ-0190).
 */
export function OwnerSelectRow({
  owner,
  avatarSize = 28,
  surface = "item",
}: {
  owner: ProductOwnerOption;
  avatarSize?: number;
  surface?: "trigger" | "item";
}) {
  const avatar = resolveAvatarSourcesFromSeed(owner.id, owner.image);
  const count = owner.productCount;
  const nameClass =
    surface === "trigger"
      ? "truncate text-sm text-white"
      : "truncate text-sm text-gray-700 dark:text-white";
  const metaClass =
    surface === "trigger"
      ? "truncate text-xs text-white/75"
      : "truncate text-xs text-muted-foreground dark:text-white/70";
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
      {/* overflow-hidden on circle only — clip image to round, no extra padding */}
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          AVATAR_RING_CLASS,
        )}
        style={{ width: avatarSize, height: avatarSize }}
      >
        <SafeAvatarImage
          src={avatar.src}
          fallbackSrc={avatar.fallbackSrc}
          alt=""
          width={avatarSize}
          height={avatarSize}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className={nameClass}>{owner.name}</span>
        <span className={metaClass}>
          {owner.email}
          {typeof count === "number"
            ? ` · ${count} product${count === 1 ? "" : "s"}`
            : ""}
        </span>
      </span>
    </span>
  );
}

export type SupportTicketDialogProps = {
  productOwners?: ProductOwnerOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  variant?: "sky" | "violet";
  /** REQ-0185 — when set, dialog is Edit mode */
  existingTicket?: SupportTicket | null;
};

export default function SupportTicketDialog({
  productOwners = [],
  open: controlledOpen,
  onOpenChange,
  trigger,
  variant = "sky",
  existingTicket = null,
}: SupportTicketDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled && onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  };

  const isEdit = !!existingTicket;
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<SupportTicketPriority>("medium");
  const [status, setStatus] = useState<SupportTicketStatus>("open");
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  // REQ-0197 — optional Related product (create only)
  const [productId, setProductId] = useState<string | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const createMutation = useCreateSupportTicket();
  const updateMutation = useUpdateSupportTicket();
  // REQ-0200/0201 — owner catalog for create picker; edit RO fallback densify
  const ownerFetchId = isEdit
    ? (existingTicket?.assignedToId ?? assignedToId)
    : assignedToId;
  const { data: ownerProducts = [], isLoading: productsLoading } =
    useSupportTicketOwnerProducts(ownerFetchId, {
      enabled:
        open &&
        !!ownerFetchId &&
        (!isEdit || !!existingTicket?.productId),
    });

  const role = user?.role;
  // REQ-0195 — workflow status Select only for admin; client/supplier see RO badge
  const canEditStatus = role === "admin";
  const requireAssignee =
    (role === "client" || role === "supplier") && productOwners.length > 0;
  const allowNoneOwner = role === "admin" || !requireAssignee;

  const selectedProduct = ownerProducts.find((p) => p.id === productId);
  // REQ-0201 — edit RO densify from ticket snap, else owner-products row
  const editRelatedFromOwner = existingTicket?.productId
    ? ownerProducts.find((p) => p.id === existingTicket.productId)
    : undefined;
  const editHasTicketDensify = Boolean(
    existingTicket?.relatedProductName ||
      existingTicket?.relatedProductImageUrl ||
      existingTicket?.relatedProductSku,
  );

  const setAssignedToIdAndResetProduct = (next: string | null) => {
    setAssignedToId(next);
    setProductId(null);
  };

  // REQ-0198 — sync on open / ticket change (no queueMicrotask bounce)
  useSyncDialogOpenState(
    open,
    () => {
      if (existingTicket) {
        setSubject(existingTicket.subject ?? "");
        setDescription(existingTicket.description ?? "");
        setPriority(existingTicket.priority ?? "medium");
        setStatus(existingTicket.status ?? "open");
        setAssignedToId(existingTicket.assignedToId ?? null);
        setProductId(existingTicket.productId ?? null);
      } else {
        setSubject("");
        setDescription("");
        setPriority("medium");
        setStatus("open");
        setAssignedToId(null);
        setProductId(null);
      }
      setProductPickerOpen(false);
    },
    existingTicket?.id ?? "create",
  );

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isViolet = variant === "violet";
  const selectedOwner = productOwners.find((po) => po.id === assignedToId);
  // REQ-0190 — edit read-only row may use list enrich when owners list omits assignee
  const editAssigneeOwner: ProductOwnerOption | null = (() => {
    if (!isEdit || !existingTicket?.assignedToId) return selectedOwner ?? null;
    if (selectedOwner) return selectedOwner;
    return {
      id: existingTicket.assignedToId,
      name:
        existingTicket.assignedToName?.trim() ||
        existingTicket.assignedToEmail ||
        "Owner",
      email: existingTicket.assignedToEmail ?? "",
      image: existingTicket.assignedToImage ?? null,
    };
  })();

  // Create still requires assignee for client/supplier; edit never gates on Send-to
  const canSubmit =
    !!subject.trim() &&
    !!description.trim() &&
    (isEdit || !requireAssignee || !!assignedToId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (isEdit && existingTicket) {
      // REQ-0190 — never send assignedToId from edit (admin Reassign is separate)
      // REQ-0195 — omit status for non-admin (API also strips via resolveStatusUpdate)
      updateMutation.mutate(
        {
          id: existingTicket.id,
          data: {
            subject: subject.trim(),
            description: description.trim(),
            priority,
            ...(canEditStatus ? { status } : {}),
          },
        },
        {
          onSuccess: () => setOpen(false),
        },
      );
      return;
    }

    createMutation.mutate(
      {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        assignedToId: assignedToId ?? undefined,
        ...(productId ? { productId } : {}),
      },
      {
        onSuccess: () => {
          setSubject("");
          setDescription("");
          setPriority("medium");
          setAssignedToId(null);
          setProductId(null);
          setOpen(false);
        },
      },
    );
  };

  const borderClass = isViolet
    ? "border-violet-400/30 dark:border-violet-400/30"
    : "border-sky-400/30 dark:border-sky-400/30";
  const shadowClass = isViolet
    ? "shadow-[0_30px_80px_rgba(139,92,246,0.35)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]"
    : "shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]";
  const inputClass = isViolet
    ? DIALOG_FORM_FIELD_VIOLET
    : DIALOG_FORM_FIELD_SKY;
  const submitHue = isViolet ? "violet" : "sky";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto",
          "bg-gradient-to-br from-slate-800/98 to-slate-900/98 dark:from-slate-800/98 dark:to-slate-900/98",
          borderClass,
          shadowClass,
        )}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const first = document.getElementById("support-ticket-subject");
          if (first && first instanceof HTMLElement) first.focus();
        }}
      >
        <DialogHeaderBrand
          icon={isEdit ? Pencil : MessageSquare}
          tone={isViolet ? "violet" : "sky"}
          title={isEdit ? "Edit Support Ticket" : "Create Support Ticket"}
          description={
            isEdit
              ? canEditStatus
                ? "Update subject, description, status, or priority. Send-to cannot be changed here."
                : "Update subject, description, or priority. Status and Send-to cannot be changed here."
              : productOwners.length > 0
                ? "Open a new support ticket. Add a subject, description, and choose who to send it to (product owner)."
                : "Open a new support ticket. Add a subject and description."
          }
        />
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <DialogFormLabel
              htmlFor="support-ticket-subject"
              icon={MessageSquare}
              required
            >
              Subject
            </DialogFormLabel>
            <Input
              id="support-ticket-subject"
              placeholder="Brief subject of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isPending}
              className={cn("h-11 rounded-xl", inputClass)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <DialogFormLabel
              htmlFor="support-ticket-description"
              icon={FileText}
              required
            >
              Description
            </DialogFormLabel>
            <Textarea
              id="support-ticket-description"
              placeholder="Describe the issue or request in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              className={cn("min-h-[120px] rounded-xl resize-none", inputClass)}
            />
          </div>
          {/* REQ-0190 — edit: always show Send-to as read-only; create: Select when owners exist */}
          {(isEdit || productOwners.length > 0) && (
            <div className="space-y-2">
              <DialogFormLabel
                htmlFor="support-ticket-send-to"
                icon={User}
                required={!isEdit && requireAssignee}
                optional={!isEdit && !requireAssignee}
              >
                Send to (product owner)
              </DialogFormLabel>
              {isEdit ? (
                <div
                  id="support-ticket-send-to"
                  className={cn(
                    "flex h-auto min-h-11 w-full items-center rounded-xl px-3 py-1.5",
                    inputClass,
                    "opacity-90",
                  )}
                  aria-readonly="true"
                >
                  {editAssigneeOwner ? (
                    <OwnerSelectRow
                      owner={editAssigneeOwner}
                      surface="trigger"
                    />
                  ) : (
                    <span className="text-sm text-white/75">
                      — No specific owner —
                    </span>
                  )}
                </div>
              ) : (
                <DeferredSelectGate
                  enabled={open}
                  placeholder={
                    // REQ-0198 — match SelectTrigger h-auto min-h-11 (Send-to densify)
                    <div
                      className={cn(
                        "flex h-auto min-h-11 w-full items-center rounded-xl px-2 py-1.5 text-sm text-white/60",
                        "overflow-visible",
                        inputClass,
                      )}
                      aria-hidden
                    >
                      {selectedOwner ? (
                        <OwnerSelectRow
                          owner={selectedOwner}
                          surface="trigger"
                        />
                      ) : requireAssignee ? (
                        "Select product owner"
                      ) : (
                        "Select product owner (optional)"
                      )}
                    </div>
                  }
                >
                  {({ selectRemountKey }) => (
                    <Select
                      key={selectRemountKey}
                      // REQ-0200 — always controlled (never undefined → uncontrolled warning)
                      value={
                        assignedToId ?? (allowNoneOwner ? "none" : "")
                      }
                      onValueChange={(v) =>
                        setAssignedToIdAndResetProduct(
                          v === "none" || !v ? null : v,
                        )
                      }
                      disabled={isPending}
                    >
                      {/* REQ-0188 — kill Radix line-clamp so avatar/meta are not clipped */}
                      <SelectTrigger
                        id="support-ticket-send-to"
                        className={cn(
                          "h-auto min-h-11 rounded-xl py-1.5",
                          "overflow-visible [&>span]:line-clamp-none [&>span]:overflow-visible [&>span]:min-w-0",
                          inputClass,
                        )}
                      >
                        <SelectValue
                          placeholder={
                            requireAssignee
                              ? "Select product owner"
                              : "Select product owner (optional)"
                          }
                        >
                          {selectedOwner ? (
                            <OwnerSelectRow
                              owner={selectedOwner}
                              surface="trigger"
                            />
                          ) : allowNoneOwner && !assignedToId ? (
                            "— No specific owner —"
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        className={cn(
                          DIALOG_SELECT_CONTENT_CLASS,
                          "rounded-xl",
                        )}
                        position="popper"
                        sideOffset={5}
                      >
                        {allowNoneOwner ? (
                          <SelectItem
                            value="none"
                            className={DIALOG_SELECT_ITEM_CLASS}
                          >
                            — No specific owner —
                          </SelectItem>
                        ) : null}
                        {productOwners.map((po) => (
                          <SelectItem
                            key={po.id}
                            value={po.id}
                            className={cn(DIALOG_SELECT_ITEM_CLASS, "py-2")}
                          >
                            <OwnerSelectRow owner={po} surface="item" />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </DeferredSelectGate>
              )}
            </div>
          )}
          {/* REQ-0197 — create: optional Related product (owner-scoped); edit: RO densify */}
          {!isEdit ? (
            <div className="space-y-2">
              <DialogFormLabel
                htmlFor="support-ticket-related-product"
                icon={Package}
                optional
              >
                Related product
              </DialogFormLabel>
              {/* REQ-0199 — modal Popover + shared Combobox trigger (no white hover / reopen) */}
              <Popover
                open={productPickerOpen}
                onOpenChange={setProductPickerOpen}
                modal
              >
                <PopoverTrigger asChild>
                  <Button
                    id="support-ticket-related-product"
                    type="button"
                    variant="ghost"
                    role="combobox"
                    disabled={
                      isPending || !assignedToId || productsLoading
                    }
                    className={cn(
                      "h-auto min-h-11 w-full justify-between rounded-xl py-2",
                      DIALOG_COMBOBOX_TRIGGER_CLASS,
                      inputClass,
                    )}
                  >
                    {selectedProduct ? (
                      <DialogProductOptionRow
                        name={selectedProduct.name}
                        imageUrl={selectedProduct.imageUrl}
                        sku={selectedProduct.sku}
                        price={selectedProduct.price}
                        quantity={selectedProduct.quantity}
                        categoryName={productCategoryLabel(
                          selectedProduct.category,
                        )}
                        ownerId={selectedProduct.userId}
                        ownerName={selectedProduct.productOwnerName}
                        ownerImage={selectedProduct.productOwnerImage}
                        supplierId={selectedProduct.supplierId}
                        supplierName={productSupplierLabel(
                          selectedProduct.supplier,
                        )}
                        supplierImage={selectedProduct.supplierImage}
                        metaOnDark
                        className="flex-1"
                      />
                    ) : (
                      <span className="text-sm text-white/75">
                        {!assignedToId
                          ? "Select a product owner first"
                          : "— None —"}
                      </span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  className={cn(
                    "w-[var(--radix-popover-trigger-width)] p-0",
                    filterCommandPopoverClass(isViolet ? "violet" : "sky"),
                    FILTER_COMMAND_INPUT_WRAPPER_CLASS,
                  )}
                >
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Search products…" />
                    <CommandList className="max-h-[min(60vh,280px)]">
                      <CommandEmpty>No products found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setProductId(null);
                            setProductPickerOpen(false);
                          }}
                          className="relative py-2 pr-8"
                        >
                          <span className="text-sm">— None —</span>
                          <Check
                            className={cn(
                              "absolute right-2 h-4 w-4 shrink-0",
                              !productId ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                        {ownerProducts.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.sku ?? ""} ${productCategoryLabel(p.category) ?? ""} ${productSupplierLabel(p.supplier) ?? ""} ${p.productOwnerName ?? ""}`}
                            onSelect={() => {
                              setProductId(p.id);
                              setProductPickerOpen(false);
                            }}
                            className="relative py-2 pr-8"
                          >
                            <DialogProductOptionRow
                              name={p.name}
                              imageUrl={p.imageUrl}
                              sku={p.sku}
                              price={p.price}
                              quantity={p.quantity}
                              categoryName={productCategoryLabel(p.category)}
                              ownerId={p.userId}
                              ownerName={p.productOwnerName}
                              ownerImage={p.productOwnerImage}
                              supplierId={p.supplierId}
                              supplierName={productSupplierLabel(p.supplier)}
                              supplierImage={p.supplierImage}
                            />
                            <Check
                              className={cn(
                                "absolute right-2 h-4 w-4 shrink-0",
                                productId === p.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : existingTicket?.productId ? (
            <div className="space-y-2">
              <DialogFormLabel
                htmlFor="support-ticket-related-product-ro"
                icon={Package}
              >
                Related product
              </DialogFormLabel>
              <div
                id="support-ticket-related-product-ro"
                className={cn(
                  "flex h-auto min-h-11 w-full items-center rounded-xl px-3 py-1.5",
                  inputClass,
                  "opacity-90",
                )}
                aria-readonly="true"
              >
                {editHasTicketDensify || editRelatedFromOwner ? (
                  <DialogProductOptionRow
                    name={
                      existingTicket.relatedProductName?.trim() ||
                      editRelatedFromOwner?.name ||
                      existingTicket.productId.slice(-8)
                    }
                    imageUrl={
                      existingTicket.relatedProductImageUrl ??
                      editRelatedFromOwner?.imageUrl
                    }
                    sku={
                      existingTicket.relatedProductSku ??
                      editRelatedFromOwner?.sku
                    }
                    price={
                      existingTicket.relatedProductPrice ??
                      editRelatedFromOwner?.price
                    }
                    quantity={
                      existingTicket.relatedProductQuantity ??
                      editRelatedFromOwner?.quantity
                    }
                    categoryName={
                      existingTicket.relatedProductCategoryName ??
                      productCategoryLabel(editRelatedFromOwner?.category)
                    }
                    ownerId={
                      existingTicket.relatedProductOwnerId ??
                      editRelatedFromOwner?.userId
                    }
                    ownerName={
                      existingTicket.relatedProductOwnerName ??
                      editRelatedFromOwner?.productOwnerName
                    }
                    ownerImage={
                      existingTicket.relatedProductOwnerImage ??
                      editRelatedFromOwner?.productOwnerImage
                    }
                    supplierId={
                      existingTicket.relatedProductSupplierId ??
                      editRelatedFromOwner?.supplierId
                    }
                    supplierName={
                      existingTicket.relatedProductSupplierName ??
                      productSupplierLabel(editRelatedFromOwner?.supplier)
                    }
                    supplierImage={
                      existingTicket.relatedProductSupplierImage ??
                      editRelatedFromOwner?.supplierImage
                    }
                    metaOnDark
                    className="flex-1"
                  />
                ) : (
                  <span className="text-sm text-white/90">
                    {existingTicket.relatedProductName?.trim() ||
                      existingTicket.relatedProductSku ||
                      existingTicket.productId.slice(-8)}
                    {existingTicket.relatedProductSku
                      ? ` · ${existingTicket.relatedProductSku}`
                      : ""}
                  </span>
                )}
              </div>
            </div>
          ) : null}
          {/* REQ-0191/0195 — Status on edit: admin Select; non-admin read-only badge */}
          {isEdit ? (
            <div className="space-y-2">
              <DialogFormLabel
                htmlFor="support-ticket-status"
                icon={CircleDot}
                required={canEditStatus}
              >
                Status
              </DialogFormLabel>
              {canEditStatus ? (
                <DeferredSelectGate
                  enabled={open}
                  placeholder={
                    <div
                      className={cn(
                        "flex h-11 w-full items-center rounded-xl px-2",
                        inputClass,
                      )}
                      aria-hidden
                    >
                      <TicketStatusBadge
                        status={status}
                        size="compact"
                        contrast="solid"
                      />
                    </div>
                  }
                >
                  {({ selectRemountKey }) => (
                    <Select
                      key={selectRemountKey}
                      value={status}
                      onValueChange={(v) => setStatus(v as SupportTicketStatus)}
                      disabled={isPending}
                    >
                      <SelectTrigger
                        id="support-ticket-status"
                        className={cn("h-11 rounded-xl w-full", inputClass)}
                      >
                        <SelectValue>
                          <TicketStatusBadge
                            status={status}
                            size="compact"
                            contrast="solid"
                          />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        className={cn(DIALOG_SELECT_CONTENT_CLASS, "rounded-xl")}
                        position="popper"
                        sideOffset={5}
                      >
                        {STATUSES.map((s) => (
                          <SelectItem
                            key={s.value}
                            value={s.value}
                            className={DIALOG_SELECT_ITEM_CLASS}
                          >
                            <TicketStatusBadge
                              status={s.value}
                              label={s.label}
                              size="compact"
                              contrast="opaque"
                            />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </DeferredSelectGate>
              ) : (
                <div
                  id="support-ticket-status"
                  className={cn(
                    "flex h-11 w-full items-center rounded-xl px-3",
                    inputClass,
                    "opacity-90",
                  )}
                  aria-readonly="true"
                >
                  <TicketStatusBadge
                    status={status}
                    size="compact"
                    contrast="solid"
                  />
                </div>
              )}
            </div>
          ) : null}
          <div className="space-y-2">
            <DialogFormLabel
              htmlFor="support-ticket-priority"
              icon={AlertTriangle}
              required
            >
              Priority
            </DialogFormLabel>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className={cn(
                    "flex h-11 w-full items-center rounded-xl px-2",
                    inputClass,
                  )}
                  aria-hidden
                >
                  <TicketPriorityBadge
                    status={priority}
                    size="compact"
                    contrast="solid"
                  />
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={priority}
                  onValueChange={(v) => setPriority(v as SupportTicketPriority)}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="support-ticket-priority"
                    className={cn("h-11 rounded-xl w-full", inputClass)}
                  >
                    <SelectValue>
                      <TicketPriorityBadge
                        status={priority}
                        size="compact"
                        contrast="solid"
                      />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS, "rounded-xl")}
                    position="popper"
                    sideOffset={5}
                  >
                    {PRIORITIES.map((p) => (
                      <SelectItem
                        key={p.value}
                        value={p.value}
                        className={DIALOG_SELECT_ITEM_CLASS}
                      >
                        <TicketPriorityBadge
                          status={p.value}
                          size="compact"
                          contrast="opaque"
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
          </div>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row items-center gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                className={cn("h-11 rounded-xl gap-2", GLASS_GHOST_BUTTON)}
                disabled={isPending}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancel
              </Button>
            </DialogClose>
            <DialogSubmitButton
              isPending={isPending}
              pendingLabel={isEdit ? "Saving ticket…" : "Creating ticket…"}
              label={isEdit ? "Save" : "Create Ticket"}
              icon={isEdit ? Pencil : Send}
              hue={submitHue}
              disabled={!canSubmit}
              className="h-11 rounded-xl"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
