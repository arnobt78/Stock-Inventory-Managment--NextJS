"use client";

/**
 * REQ-0185 — Support ticket table Actions (MoreVertical).
 * View Details · Edit Ticket (dialog) · Delete (dynamic confirm).
 * Edit/Delete when session user is creator or assignee (API gate parity).
 * REQ-0190 — Admin Reassign… (separate from Edit; Select + confirm AlertDialog).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialogWrapper } from "@/components/dialogs";
import SupportTicketDialog, {
  OwnerSelectRow,
} from "@/components/support-tickets/SupportTicketDialog";
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
import {
  useDeleteSupportTicket,
  useUpdateSupportTicket,
} from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  UserRoundPen,
  X,
} from "lucide-react";
import type { ProductOwnerOption, SupportTicket } from "@/types";

function truncateTicketDescription(text: string, max = 80): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export type SupportTicketActionsProps = {
  ticket: SupportTicket;
  detailHrefBase?: string;
  productOwners?: ProductOwnerOption[];
  /** "sky" personal activity; "violet" admin store tickets */
  dialogVariant?: "sky" | "violet";
};

export default function SupportTicketActions({
  ticket,
  detailHrefBase = "/admin/support-tickets",
  productOwners = [],
  dialogVariant = "violet",
}: SupportTicketActionsProps) {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignConfirmOpen, setReassignConfirmOpen] = useState(false);
  const [reassignToId, setReassignToId] = useState<string | null>(
    ticket.assignedToId ?? null,
  );
  const deleteMutation = useDeleteSupportTicket();
  const updateMutation = useUpdateSupportTicket();
  const isDeleting = deleteMutation.isPending;
  const isReassigning = updateMutation.isPending;
  const detailHref = `${detailHrefBase}/${ticket.id}`;

  const sessionId = user?.id;
  const isAdmin = user?.role === "admin";
  const canMutate =
    !!sessionId &&
    (ticket.userId === sessionId || ticket.assignedToId === sessionId);
  // REQ-0190 — admin Reassign is separate from Edit Send-to lock
  const canReassign = isAdmin && productOwners.length > 0;

  const isViolet = dialogVariant === "violet";
  const inputClass = isViolet
    ? DIALOG_FORM_FIELD_VIOLET
    : DIALOG_FORM_FIELD_SKY;
  const borderClass = isViolet
    ? "border-violet-400/30 dark:border-violet-400/30"
    : "border-sky-400/30 dark:border-sky-400/30";
  const shadowClass = isViolet
    ? "shadow-[0_30px_80px_rgba(139,92,246,0.35)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]"
    : "shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]";

  useEffect(() => {
    if (!reassignOpen) return;
    queueMicrotask(() => {
      setReassignToId(ticket.assignedToId ?? null);
    });
  }, [reassignOpen, ticket.assignedToId, ticket.id]);

  const selectedReassignOwner = productOwners.find(
    (po) => po.id === reassignToId,
  );
  const reassignTargetLabel = selectedReassignOwner
    ? selectedReassignOwner.name?.trim() ||
      selectedReassignOwner.email ||
      "selected owner"
    : "no specific owner";

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(ticket.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      logger.error("Error deleting support ticket:", error);
    }
  };

  const handleReassignConfirm = async () => {
    try {
      await updateMutation.mutateAsync({
        id: ticket.id,
        data: { assignedToId: reassignToId },
      });
      setReassignConfirmOpen(false);
      setReassignOpen(false);
    } catch (error) {
      logger.error("Error reassigning support ticket:", error);
    }
  };

  const descPreview = truncateTicketDescription(ticket.description, 80);
  const deleteDescription = descPreview
    ? `This will permanently delete the ticket "${ticket.subject}": ${descPreview}`
    : `This will permanently delete the ticket "${ticket.subject}". This action cannot be undone.`;

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
            <Link href={detailHref} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          {canMutate ? (
            <DropdownMenuItem
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Ticket
            </DropdownMenuItem>
          ) : null}
          {canReassign ? (
            <DropdownMenuItem
              onClick={() => setReassignOpen(true)}
              className="flex items-center gap-2"
            >
              <UserRoundPen className="h-4 w-4" />
              Reassign…
            </DropdownMenuItem>
          ) : null}
          {canMutate ? (
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-2 text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Ticket"}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canMutate ? (
        <SupportTicketDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          productOwners={productOwners}
          existingTicket={ticket}
          variant={dialogVariant}
        />
      ) : null}

      {/* REQ-0190 — admin Reassign picker (not the Edit Send-to dropdown) */}
      {canReassign ? (
        <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
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
              <DialogFormLabel htmlFor="support-ticket-reassign-to" icon={UserRoundPen}>
                Send to (product owner)
              </DialogFormLabel>
              <DeferredSelectGate
                enabled={reassignOpen}
                placeholder={
                  <div
                    className={cn(
                      "flex h-11 w-full items-center rounded-xl px-2 text-sm text-white/60",
                      inputClass,
                    )}
                    aria-hidden
                  >
                    {selectedReassignOwner ? (
                      <OwnerSelectRow
                        owner={selectedReassignOwner}
                        surface="trigger"
                      />
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
                        {selectedReassignOwner ? (
                          <OwnerSelectRow
                            owner={selectedReassignOwner}
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
                onClick={() => setReassignConfirmOpen(true)}
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <AlertDialogWrapper
        open={reassignConfirmOpen}
        onOpenChange={setReassignConfirmOpen}
        title="Reassign support ticket?"
        description={`Reassign "${ticket.subject}" to ${reassignTargetLabel}? The previous recipient will no longer be the Send-to owner.`}
        actionLabel="Reassign"
        actionLoadingLabel="Reassigning..."
        isLoading={isReassigning}
        onAction={handleReassignConfirm}
        onCancel={() => setReassignConfirmOpen(false)}
        actionVariant="default"
      />

      <AlertDialogWrapper
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete support ticket?"
        description={deleteDescription}
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
