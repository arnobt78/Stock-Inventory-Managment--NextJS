"use client";

/**
 * REQ-0190 / REQ-0191 — Admin Reassign Send-to (separate from Edit dialog).
 * Select owner → confirm AlertDialog → useUpdateSupportTicket({ assignedToId }).
 * REQ-0197 — confirm warns when Related product will clear; client may send productId: null.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialogWrapper } from "@/components/dialogs";
import { OwnerSelectRow } from "@/components/support-tickets/SupportTicketDialog";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_SKY,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  DialogFormLabel,
  DialogHeaderBrand,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
} from "@/components/shared";
import { useUpdateSupportTicket } from "@/hooks/queries";
import { willClearProductOnReassign } from "@/lib/support-tickets/ticket-reassign-product";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { UserRoundPen, X } from "lucide-react";
import type { ProductOwnerOption, SupportTicket } from "@/types";

export type TicketReassignDialogProps = {
  ticket: SupportTicket;
  productOwners: ProductOwnerOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "sky" | "violet";
};

export default function TicketReassignDialog({
  ticket,
  productOwners,
  open,
  onOpenChange,
  variant = "violet",
}: TicketReassignDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reassignToId, setReassignToId] = useState<string | null>(
    ticket.assignedToId ?? null,
  );
  // REQ-0193 — reset Send-to on open during render (no effect/microtask bounce)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReassignToId(ticket.assignedToId ?? null);
    }
  }
  const updateMutation = useUpdateSupportTicket();
  const isReassigning = updateMutation.isPending;

  const isViolet = variant === "violet";
  const inputClass = isViolet
    ? DIALOG_FORM_FIELD_VIOLET
    : DIALOG_FORM_FIELD_SKY;
  const borderClass = isViolet
    ? "border-violet-400/30 dark:border-violet-400/30"
    : "border-sky-400/30 dark:border-sky-400/30";
  const shadowClass = isViolet
    ? "shadow-[0_30px_80px_rgba(139,92,246,0.35)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]"
    : "shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]";

  const selectedOwner = productOwners.find((po) => po.id === reassignToId);
  const targetLabel = selectedOwner
    ? selectedOwner.name?.trim() || selectedOwner.email || "selected owner"
    : "no specific owner";

  // REQ-0197 — Related product clears when new owner ≠ product owner (assignee)
  // Product owner is the Send-to; mismatch when next assignee ≠ current ticket.assignedToId
  // while product linked — or when clearing assignee. Server re-checks product.userId.
  const productSnap = {
    productId: ticket.productId,
    // Best client estimate: current assignee owns Related product when linked
    productOwnerUserId: ticket.productId
      ? (ticket.assignedToId ?? null)
      : null,
  };
  const clearsProduct = willClearProductOnReassign(productSnap, reassignToId);
  const productLabel =
    ticket.relatedProductName?.trim() ||
    ticket.relatedProductSku ||
    (ticket.productId ? ticket.productId.slice(-8) : "linked product");
  const productSkuSuffix = ticket.relatedProductSku
    ? ` (${ticket.relatedProductSku})`
    : "";

  const confirmDescription = clearsProduct
    ? `Reassign "${ticket.subject}" to ${targetLabel}? Related product "${productLabel}${productSkuSuffix}" will be cleared because it is not owned by the new recipient.`
    : `Reassign "${ticket.subject}" to ${targetLabel}? The previous recipient will no longer be the Send-to owner.`;

  const handleConfirm = async () => {
    try {
      await updateMutation.mutateAsync({
        id: ticket.id,
        data: {
          assignedToId: reassignToId,
          ...(clearsProduct ? { productId: null } : {}),
        },
      });
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      logger.error("Error reassigning support ticket:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto",
            "bg-gradient-to-br from-slate-800/98 to-slate-900/98 dark:from-slate-800/98 dark:to-slate-900/98",
            borderClass,
            shadowClass,
          )}
        >
          <DialogHeaderBrand
            icon={UserRoundPen}
            tone={isViolet ? "violet" : "sky"}
            title="Reassign ticket"
            description={`Choose who receives "${ticket.subject}". Confirm before applying.`}
          />
          <div className="mt-4 space-y-2">
            <DialogFormLabel
              htmlFor="support-ticket-reassign-to"
              icon={UserRoundPen}
            >
              Send to (product owner)
            </DialogFormLabel>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                // REQ-0193 — match SelectTrigger h-auto min-h-11 (avoids bounce vs Edit dialog)
                <div
                  className={cn(
                    "flex h-auto min-h-11 w-full items-center rounded-xl px-2 py-1.5 text-sm text-white/60",
                    "overflow-visible",
                    inputClass,
                  )}
                  aria-hidden
                >
                  {selectedOwner ? (
                    <OwnerSelectRow owner={selectedOwner} surface="trigger" />
                  ) : (
                    "Select product owner (optional)"
                  )}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={reassignToId ?? "none"}
                  onValueChange={(v) =>
                    setReassignToId(v === "none" || !v ? null : v)
                  }
                  disabled={isReassigning}
                >
                  <SelectTrigger
                    id="support-ticket-reassign-to"
                    className={cn(
                      "h-auto min-h-11 rounded-xl py-1.5",
                      "overflow-visible [&>span]:line-clamp-none [&>span]:overflow-visible [&>span]:min-w-0",
                      inputClass,
                    )}
                  >
                    <SelectValue placeholder="Select product owner">
                      {selectedOwner ? (
                        <OwnerSelectRow
                          owner={selectedOwner}
                          surface="trigger"
                        />
                      ) : (
                        "— No specific owner —"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS, "rounded-xl")}
                    position="popper"
                    sideOffset={5}
                  >
                    <SelectItem
                      value="none"
                      className={DIALOG_SELECT_ITEM_CLASS}
                    >
                      — No specific owner —
                    </SelectItem>
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
          </div>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row items-center gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                className={cn("h-11 rounded-xl gap-2", GLASS_GHOST_BUTTON)}
                disabled={isReassigning}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancel
              </Button>
            </DialogClose>
            <DialogSubmitButton
              type="button"
              isPending={false}
              pendingLabel="Continue…"
              label="Continue"
              icon={UserRoundPen}
              hue={isViolet ? "violet" : "sky"}
              className="h-11 rounded-xl"
              onClick={() => setConfirmOpen(true)}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialogWrapper
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reassign support ticket?"
        description={confirmDescription}
        actionLabel="Reassign"
        actionLoadingLabel="Reassigning..."
        isLoading={isReassigning}
        onAction={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        actionVariant="default"
      />
    </>
  );
}
